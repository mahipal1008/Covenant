import assert from "node:assert/strict";

process.env.NODE_ENV = "test";

const { tenantPrisma, runWithTenant, TenantContextMissingError } = await import("./db/tenant-guard");

async function test(name: string, run: () => Promise<void>) {
  try {
    await run();
    console.log(`ok - ${name}`);
  } catch (err) {
    console.error(`fail - ${name}:`, err);
    process.exitCode = 1;
  }
}

await test("tenantPrisma throws TenantContextMissingError outside runWithTenant", async () => {
  await assert.rejects(
    () => tenantPrisma.apiToken.findMany({}),
    (err: Error) => {
      assert.ok(err instanceof TenantContextMissingError, `expected TenantContextMissingError, got ${err.constructor.name}`);
      assert.match(err.message, /TenantContextMissingError/);
      return true;
    }
  );
});

await test("tenantPrisma succeeds inside runWithTenant", async () => {
  const items = await runWithTenant({ organizationId: "org_covenant_demo", userId: null }, () =>
    tenantPrisma.apiToken.findMany({ where: { revokedAt: null } })
  );
  assert.ok(Array.isArray(items));
  // every returned row must belong to the active tenant
  for (const t of items) {
    assert.equal(t.organizationId, "org_covenant_demo");
  }
});

await test("findUnique with foreign organization returns null (cross-tenant blocked)", async () => {
  // Look up a real token id, then query with a different tenant context.
  const real = await runWithTenant({ organizationId: "org_covenant_demo", userId: null }, () =>
    tenantPrisma.apiToken.findFirst({ where: { revokedAt: null } })
  );
  if (!real) {
    console.log("  (skipped — no tokens in db)");
    return;
  }
  const blocked = await runWithTenant({ organizationId: "org_does_not_exist", userId: null }, () =>
    tenantPrisma.apiToken.findUnique({ where: { id: real.id } })
  );
  assert.equal(blocked, null, "tenant-guard must hide cross-tenant rows on findUnique");
});

await test("count via tenantPrisma is org-scoped", async () => {
  const count = await runWithTenant({ organizationId: "org_covenant_demo", userId: null }, () =>
    tenantPrisma.apiToken.count()
  );
  assert.ok(count >= 0);
  // A bogus tenant must see zero rows.
  const empty = await runWithTenant({ organizationId: "org_phantom_xyz", userId: null }, () =>
    tenantPrisma.apiToken.count()
  );
  assert.equal(empty, 0);
});

console.log("tenant-guard contract tests complete");
