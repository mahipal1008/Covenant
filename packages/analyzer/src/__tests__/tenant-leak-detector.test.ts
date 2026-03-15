import assert from "node:assert/strict";
import { scanSourceFiles } from "../index";

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

test("flags sensitive Prisma reads without tenant filters", () => {
  const result = scanSourceFiles([
    {
      path: "src/routes/reports.ts",
      content: `
        router.get("/api/reports/billing", async (_req, res) => {
          const invoices = await prisma.invoice.findMany({
            where: { status: "paid" }
          });
          res.json(invoices);
        });
      `
    }
  ]);

  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0]?.severity, "critical");
  assert.equal(result.findings[0]?.endpoint, "/api/reports/billing");
});

test("does not flag sensitive queries scoped by organization id", () => {
  const result = scanSourceFiles([
    {
      path: "src/routes/reports.ts",
      content: `
        router.get("/api/reports/billing", async (req, res) => {
          const invoices = await prisma.invoice.findMany({
            where: { status: "paid", organizationId: req.session.organizationId }
          });
          res.json(invoices);
        });
      `
    }
  ]);

  assert.equal(result.findings.length, 0);
});

test("flags raw SQL against sensitive tables when no tenant key is present", () => {
  const result = scanSourceFiles([
    {
      path: "src/routes/admin.ts",
      content: `
        router.post("/api/admin/export/reservations", async (_req, res) => {
          const rows = await prisma.$queryRaw\`select * from reservations where status = 'active'\`;
          res.json(rows);
        });
      `
    }
  ]);

  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0]?.severity, "critical");
});

test("auth auditor flags an unprotected route as unprotected", () => {
  const result = scanSourceFiles([
    {
      path: "src/routes/internal.ts",
      content: `
        router.get("/api/internal/debug/dump", async (_req, res) => {
          res.json({ok: true});
        });
      `
    }
  ]);

  assert.equal(result.authChecks.length, 1);
  assert.equal(result.authChecks[0]?.authStatus, "unprotected");
});

test("auth auditor identifies admin-only routes via requireAdmin", () => {
  const result = scanSourceFiles([
    {
      path: "src/routes/admin.ts",
      content: `
        router.post("/api/admin/export", requireAdmin, async (_req, res) => {
          res.csv("");
        });
      `
    }
  ]);

  assert.equal(result.authChecks[0]?.authStatus, "admin-only");
  assert.deepEqual(result.authChecks[0]?.middlewares, ["requireAdmin"]);
});
