import assert from "node:assert/strict";
import {
  DEFAULT_PRODUCTION_ORIGIN,
  buildCorsOptions,
  getAllowedOrigins,
  isOriginAllowed,
  parseAllowedOrigins,
} from "./cors-config";

// 1. parseAllowedOrigins trims and drops empty entries.
assert.deepEqual(parseAllowedOrigins(undefined), []);
assert.deepEqual(parseAllowedOrigins(""), []);
assert.deepEqual(
  parseAllowedOrigins("https://a.example ,https://b.example, "),
  ["https://a.example", "https://b.example"],
);

// 2. Production defaults include the canonical origin and dedupes env additions.
{
  const env = {
    NODE_ENV: "production",
    CORS_ALLOWED_ORIGINS: `${DEFAULT_PRODUCTION_ORIGIN},https://preview.huyenbi.io.vn`,
  } as unknown as NodeJS.ProcessEnv;
  const list = getAllowedOrigins(env);
  assert.deepEqual(list, [DEFAULT_PRODUCTION_ORIGIN, "https://preview.huyenbi.io.vn"]);
}

// 3. Non-production has no default origins unless configured explicitly.
{
  const env = { NODE_ENV: "development" } as unknown as NodeJS.ProcessEnv;
  assert.deepEqual(getAllowedOrigins(env), []);
}

// 4. Origin checks — prod blocks arbitrary origins, allows canonical + configured.
{
  const env = { NODE_ENV: "production" } as unknown as NodeJS.ProcessEnv;
  const allow = getAllowedOrigins(env);
  // No Origin header (same-origin / server-to-server) is allowed.
  assert.equal(isOriginAllowed(undefined, allow, env), true);
  assert.equal(isOriginAllowed(DEFAULT_PRODUCTION_ORIGIN, allow, env), true);
  assert.equal(isOriginAllowed("https://evil.example", allow, env), false);
  // Loopback MUST NOT leak into production.
  assert.equal(isOriginAllowed("http://localhost:5173", allow, env), false);
}

// 5. Non-production allows loopback on any port for DX.
{
  const env = { NODE_ENV: "development" } as unknown as NodeJS.ProcessEnv;
  const allow = getAllowedOrigins(env);
  assert.equal(isOriginAllowed("http://localhost:5173", allow, env), true);
  assert.equal(isOriginAllowed("http://127.0.0.1:3000", allow, env), true);
  assert.equal(isOriginAllowed("https://evil.example", allow, env), false);
}

// 6. buildCorsOptions returns `credentials: true` and an origin callback that
//    honors the allow-list.
{
  const env = {
    NODE_ENV: "production",
    CORS_ALLOWED_ORIGINS: "https://extra.example",
  } as unknown as NodeJS.ProcessEnv;
  const opts = buildCorsOptions(env);
  assert.equal(opts.credentials, true);
  assert.equal(typeof opts.origin, "function");

  const originFn = opts.origin as (
    origin: string | undefined,
    cb: (err: Error | null, allow?: boolean) => void,
  ) => void;

  function check(origin: string | undefined): boolean {
    let resolved: boolean | undefined;
    originFn(origin, (err, allow) => {
      assert.equal(err, null);
      resolved = allow;
    });
    // Callback should have fired synchronously; otherwise something is wrong.
    assert.notEqual(resolved, undefined);
    return resolved as boolean;
  }

  assert.equal(check(undefined), true);
  assert.equal(check(DEFAULT_PRODUCTION_ORIGIN), true);
  assert.equal(check("https://extra.example"), true);
  assert.equal(check("https://evil.example"), false);
}

console.log("cors-config: ok");
