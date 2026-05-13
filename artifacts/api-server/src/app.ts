import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { CLERK_PROXY_PATH, clerkProxyMiddleware } from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";
import { buildCorsOptions, getAllowedOrigins } from "./lib/cors-config";
import { originGuard } from "./lib/origin-guard";

const app: Express = express();

// trust proxy: required so `req.ip` reflects the real client IP when the server
// sits behind a reverse proxy (e.g. nginx, Caddy, a load balancer). Without it,
// `req.ip` is the proxy's socket address and the rate limiter cannot tell
// clients apart.
//
// Configure via env:
//   TRUST_PROXY unset       → no trust (default, suits direct-exposed servers)
//   TRUST_PROXY=loopback    → trust localhost-only proxy chain (nginx on same box)
//   TRUST_PROXY=<n hops>    → trust N hops of X-Forwarded-For
//   TRUST_PROXY=<addr/cidr> → trust a specific proxy or subnet
// See https://expressjs.com/en/guide/behind-proxies.html
const trustProxy = process.env.TRUST_PROXY;
if (trustProxy !== undefined && trustProxy !== "") {
  const asNumber = Number(trustProxy);
  app.set("trust proxy", Number.isFinite(asNumber) ? asNumber : trustProxy);
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Clerk proxy — chỉ chạy trong production khi CLERK_SECRET_KEY được set
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

// CORS allow-list: prod defaults to https://huyenbi.io.vn, dev allows loopback.
// Additional origins via CORS_ALLOWED_ORIGINS (comma-separated). Reflecting any
// origin would defeat `credentials: true`, so we never fall back to that.
const corsAllowList = getAllowedOrigins();
logger.info({ corsAllowList, nodeEnv: process.env.NODE_ENV }, "CORS allow-list configured");

// TRUST_PROXY startup warning (best-effort, never fail-fast). Direct-exposed
// deployments legitimately leave it unset, so we only warn.
if (!process.env.TRUST_PROXY) {
  logger.warn(
    "TRUST_PROXY is not set. If the API is deployed behind a reverse proxy, " +
      "the rate limiter will see every request as coming from the proxy's IP " +
      "and collapse all clients into one bucket. Set TRUST_PROXY per DEPLOY.md.",
  );
}

// Body size limit. `express.json` defaults to 100kb; we keep that as a ceiling
// so that no route can accept an unbounded body. Per-route zod schemas add
// stricter, field-level limits on top of this transport-level guard.
const JSON_BODY_LIMIT = "64kb";

// Security response headers (H2). Mount helmet BEFORE cors so that headers are
// present on every response — including early rejections (e.g. CORS denials or
// body-parser errors). CSP source lists are derived from the actual third-party
// domains Clerk loads plus the API origin itself; see design §4.
//
// - `crossOriginEmbedderPolicy: false` avoids breaking SSE streams and
//   third-party AI endpoints (which do not advertise COEP).
// - `crossOriginResourcePolicy: "cross-origin"` lets the static/frontend origin
//   consume API responses without tripping CORP.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://*.clerk.dev",
          "https://*.clerk.accounts.dev",
          "https://challenges.cloudflare.com",
        ],
        connectSrc: [
          "'self'",
          "https://*.clerk.dev",
          "https://*.clerk.accounts.dev",
          "https://api.clerk.com",
        ],
        imgSrc: ["'self'", "data:", "blob:", "https://img.clerk.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", "data:"],
        frameSrc: [
          "https://*.clerk.dev",
          "https://*.clerk.accounts.dev",
          "https://challenges.cloudflare.com",
        ],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    hsts: { maxAge: 15_552_000, includeSubDomains: true },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    // Helmet defaults X-Frame-Options to SAMEORIGIN; requirement 4.2 pins DENY
    // because we never embed this API inside any frame — stronger guard against
    // clickjacking across browsers that ignore frame-ancestors.
    frameguard: { action: "deny" },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(cors(buildCorsOptions()));

// CSRF defense-in-depth (M1). `originGuard` enforces that state-changing
// requests carry an Origin (or Referer fallback) matching the CORS allow-list.
// Mounted on `/api` after CORS (so preflight OPTIONS is answered by cors first)
// and before the body parser (so forged cross-site POSTs never reach a parser).
app.use("/api", originGuard);

app.use(express.json({ limit: JSON_BODY_LIMIT }));
// `express.urlencoded` intentionally not mounted: no route consumes urlencoded
// bodies, and dropping the parser is belt-and-suspenders against cross-site
// form POSTs that would bypass CORS preflight. See design §6 (M1).

// clerkMiddleware cần CẢ HAI: CLERK_SECRET_KEY và CLERK_PUBLISHABLE_KEY
// Khi thiếu một trong hai, bỏ qua — auth endpoints sẽ trả 401 nhưng server không crash
const clerkSecretKey = process.env.CLERK_SECRET_KEY;
const clerkPublishableKey = process.env.CLERK_PUBLISHABLE_KEY;

if (clerkSecretKey && clerkPublishableKey) {
  app.use(clerkMiddleware({ secretKey: clerkSecretKey, publishableKey: clerkPublishableKey }));
} else {
  logger.warn(
    { hasSecretKey: !!clerkSecretKey, hasPublishableKey: !!clerkPublishableKey },
    "Clerk keys incomplete — auth endpoints will return 401, other endpoints unaffected",
  );
}

app.use("/api", router);

export default app;
