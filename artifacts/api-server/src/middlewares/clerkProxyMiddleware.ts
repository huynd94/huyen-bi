/**
 * Clerk Frontend API Proxy Middleware
 *
 * Proxies Clerk requests through your domain. Có 2 loại request cần proxy:
 *
 *  1. /api/__clerk/npm/*  → https://npm.clerk.dev/*  (Clerk JS browser bundle)
 *  2. /api/__clerk/*      → https://frontend-api.clerk.dev/*  (Clerk FAPI auth calls)
 *
 * Proxy này chỉ cần thiết khi:
 *   - Deployment trên Replit.app (không có DNS CNAME)
 *   - Hoặc subdomain chưa được verify trên Clerk Dashboard
 *
 * Với custom domain VPS (e.g. battu.huynd.io.vn) + production keys đã verify domain
 * trên Clerk Dashboard → KHÔNG cần proxy. Clerk load thẳng từ CDN của họ.
 *
 * Để bật proxy: đặt VITE_CLERK_PROXY_URL=https://your-domain.com/api/__clerk
 * trong .env khi build frontend.
 *
 * IMPORTANT: Must be mounted BEFORE express.json() middleware
 */

import { createProxyMiddleware } from "http-proxy-middleware";
import type { RequestHandler, Request, Response, NextFunction } from "express";

const CLERK_FAPI = "https://frontend-api.clerk.dev";
const CLERK_NPM_CDN = "https://npm.clerk.dev";
export const CLERK_PROXY_PATH = "/api/__clerk";
const CLERK_NPM_PATH = `${CLERK_PROXY_PATH}/npm`;

export function clerkProxyMiddleware(): RequestHandler {
  if (process.env.NODE_ENV !== "production") {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  // Proxy cho Clerk JS browser bundle (npm CDN)
  const npmProxy = createProxyMiddleware({
    target: CLERK_NPM_CDN,
    changeOrigin: true,
    pathRewrite: (path: string) =>
      path.replace(new RegExp(`^${CLERK_NPM_PATH}`), ""),
  }) as RequestHandler;

  // Proxy cho Clerk FAPI (auth API calls)
  const fapiProxy = createProxyMiddleware({
    target: CLERK_FAPI,
    changeOrigin: true,
    pathRewrite: (path: string) =>
      path.replace(new RegExp(`^${CLERK_PROXY_PATH}`), ""),
    on: {
      proxyReq: (proxyReq: any, req: any) => {
        const protocol = req.headers["x-forwarded-proto"] || "https";
        const host = req.headers.host || "";
        const proxyUrl = `${protocol}://${host}${CLERK_PROXY_PATH}`;

        proxyReq.setHeader("Clerk-Proxy-Url", proxyUrl);
        proxyReq.setHeader("Clerk-Secret-Key", secretKey);

        const xff = req.headers["x-forwarded-for"];
        const clientIp =
          (Array.isArray(xff) ? xff[0] : xff)?.split(",")[0]?.trim() ||
          req.socket?.remoteAddress ||
          "";
        if (clientIp) {
          proxyReq.setHeader("X-Forwarded-For", clientIp);
        }
      },
    },
  }) as RequestHandler;

  // Route npm requests to CDN, others to FAPI
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/npm/")) {
      return npmProxy(req, res, next);
    }
    return fapiProxy(req, res, next);
  };
}
