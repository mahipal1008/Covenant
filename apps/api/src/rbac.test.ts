import test from "node:test";
import assert from "node:assert/strict";
import { bindUserRole, checkPermission } from "./auth/rbac";

/**
 * Casbin RBAC contract tests — master plan §4.2.
 * Verifies the default role policy enforces tenant isolation by domain
 * (organizationId) and resource/action.
 */

test("owner can do anything in their org", async () => {
  await bindUserRole("user_owner_a", "org_a", "owner");
  assert.equal(await checkPermission("user_owner_a", "org_a", "/v1/repositories", "POST"), true);
  assert.equal(await checkPermission("user_owner_a", "org_a", "/v1/scans/abc123", "DELETE"), true);
});

test("member can read but not write privileged routes", async () => {
  await bindUserRole("user_member_b", "org_b", "member");
  assert.equal(await checkPermission("user_member_b", "org_b", "/v1/dashboard", "GET"), true);
  assert.equal(await checkPermission("user_member_b", "org_b", "/v1/repositories", "GET"), true);
  // Members cannot create repositories under default policy.
  assert.equal(await checkPermission("user_member_b", "org_b", "/v1/repositories", "POST"), false);
});

test("role binding does not leak across organizations", async () => {
  await bindUserRole("user_owner_c", "org_c", "owner");
  // Same user has no role in a foreign org → denied even for read.
  assert.equal(await checkPermission("user_owner_c", "org_foreign", "/v1/dashboard", "GET"), false);
});

test("unbound user is denied by default", async () => {
  assert.equal(await checkPermission("user_ghost", "org_a", "/v1/dashboard", "GET"), false);
});

console.log("rbac contract tests complete");
