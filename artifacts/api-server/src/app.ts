import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { CLERK_PROXY_PATH, clerkProxyMiddleware } from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";
import { buildCorsOptions, getAllowedOrigins } from "./lib/cors-config";

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
// Body size limit. `express.json` defaults to 100kb; we keep that as a ceiling
// so that no route can accept an unbounded body. Per-route zod schemas add
// stricter, field-level limits on top of this transport-level guard.
const JSON_BODY_LIMIT = "64kb";

app.use(cors(buildCorsOptions()));
app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: JSON_BODY_LIMIT }));

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
