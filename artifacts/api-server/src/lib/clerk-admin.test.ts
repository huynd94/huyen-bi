import assert from "node:assert/strict";
import { hasAdminRole } from "./clerk-admin";

assert.equal(hasAdminRole({ role: "admin" }), true);
assert.equal(hasAdminRole({ role: "user" }), false);
assert.equal(hasAdminRole({ admin: true }), false);
assert.equal(hasAdminRole({}), false);
assert.equal(hasAdminRole(null), false);
