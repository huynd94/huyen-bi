import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

// Exported so regression tests (e.g. logger-redact.test.ts) can spin up a
// parallel pino instance with an identical redact policy without reaching into
// the module's internals or depending on its non-deterministic transport.
export const redactConfig = {
  paths: [
    'req.headers.authorization',
    'req.headers.cookie',
    'req.headers["x-ai-key"]',
    'req.headers["x-clerk-secret-key"]',
    'req.headers["clerk-proxy-url"]',
    'req.headers["x-clerk-auth-token"]',
    'res.headers["set-cookie"]',
  ],
  censor: "[Redacted]",
};

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: redactConfig,
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
});
