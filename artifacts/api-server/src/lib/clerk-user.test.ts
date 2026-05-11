import assert from "node:assert/strict";
import type { NextFunction, Request, Response } from "express";
import { __setGetAuthForTests, requireClerkUser, type AuthenticatedRequest } from "./clerk-user";

function createRes(): Response & { statusCode: number; body: unknown } {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

// 1. No auth → 401 and next() is not invoked.
{
  __setGetAuthForTests(() => null);
  const req = {} as Request;
  const res = createRes();
  let nextCalled = false;
  const next: NextFunction = () => {
    nextCalled = true;
  };
  requireClerkUser(req, res, next);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "Unauthorized" });
  assert.equal(nextCalled, false);
}

// 2. auth without userId → 401.
{
  __setGetAuthForTests(() => ({ userId: null }));
  const req = {} as Request;
  const res = createRes();
  let nextCalled = false;
  requireClerkUser(req, res, () => {
    nextCalled = true;
  });
  assert.equal(res.statusCode, 401);
  assert.equal(nextCalled, false);
}

// 3. Valid userId → next() runs and req.userId is attached for ownership scoping.
{
  __setGetAuthForTests(() => ({ userId: "user_abc" }));
  const req = {} as Request;
  const res = createRes();
  let nextCalled = false;
  requireClerkUser(req, res, () => {
    nextCalled = true;
  });
  assert.equal(res.statusCode, 0, "no response should be sent when authenticated");
  assert.equal(nextCalled, true);
  assert.equal((req as unknown as AuthenticatedRequest).userId, "user_abc");
}

__setGetAuthForTests(null);
console.log("clerk-user requireClerkUser: ok");
