import ts from "typescript";
import type { Severity } from "@covenant/shared";

export type SourceFileInput = {
  path: string;
  content: string;
};

export type AnalyzerFinding = {
  id: string;
  ruleId: string;
  severity: Severity;
  title: string;
  summary: string;
  filePath: string;
  line: number;
  endpoint: string;
  routeMethod: string;
  evidence: string;
  impact: string;
  suggestedFix: string;
  exploitSteps: string[];
};

export type EndpointTrace = {
  endpoint: string;
  method: string;
  filePath: string;
  line: number;
};

export type QueryTrace = {
  filePath: string;
  line: number;
  text: string;
  endpoint: string;
  routeMethod: string;
};

export type AuthCheck = {
  endpoint: string;
  method: string;
  filePath: string;
  line: number;
  middlewares: string[];
  authStatus: "protected" | "unprotected" | "admin-only";
};

export type AnalyzerResult = {
  filesAnalyzed: number;
  endpointsAnalyzed: number;
  queriesAnalyzed: number;
  findings: AnalyzerFinding[];
  endpointTraces: EndpointTrace[];
  queryTraces: QueryTrace[];
  authChecks: AuthCheck[];
};

const httpMethods = new Set(["get", "post", "put", "patch", "delete"]);
const queryMethods = new Set([
  "findMany",
  "findFirst",
  "findUnique",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
  "create",
  "createMany",
  "$queryRaw",
  "$executeRaw",
  "query",
  "select",
  "from"
]);

const tenantBoundaryPattern =
  /\b(tenantId|tenant_id|organizationId|organization_id|orgId|org_id|workspaceId|workspace_id|companyId|company_id|hostelId|hostel_id)\b/i;
const sensitiveDataPattern =
  /\b(invoice|billing|payment|payout|subscription|reservation|guest|customer|user|report|export|admin|ledger)\b/i;
const rawSqlPattern = /\b(select|update|delete)\s+.*\b(from|where)\b/i;

export function scanSourceFiles(files: SourceFileInput[]): AnalyzerResult {
  const endpointTraces: EndpointTrace[] = [];
  const queryTraces: QueryTrace[] = [];
  const findings: AnalyzerFinding[] = [];
  const authChecks: AuthCheck[] = [];

  for (const file of files) {
    const source = ts.createSourceFile(file.path, file.content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const routes = collectRoutes(source, file.path);
    endpointTraces.push(...routes);
    authChecks.push(...collectAuthChecks(source, file.path));

    visit(source, (node) => {
      if (!ts.isCallExpression(node) && !ts.isTaggedTemplateExpression(node)) return;
      if (!isQueryExpression(node)) return;

      const text = compactText(node.getText(source));
      const line = getLine(source, node.getStart(source));
      const route = findNearestRoute(routes, line);
      const queryTrace: QueryTrace = {
        filePath: file.path,
        line,
        text,
        endpoint: route.endpoint,
        routeMethod: route.method
      };
      queryTraces.push(queryTrace);

      if (queryRequiresTenantBoundary(text) && !hasTenantBoundary(text)) {
        findings.push(createTenantFinding(queryTrace));
      }
    });
  }

  return {
    filesAnalyzed: files.length,
    endpointsAnalyzed: endpointTraces.length,
    queriesAnalyzed: queryTraces.length,
    findings: findings.sort((a, b) => severityOrder(b.severity) - severityOrder(a.severity)),
    endpointTraces,
    queryTraces,
    authChecks
  };
}

const authMiddlewareNames = new Set(["requireAuth", "requireUser", "isAuthenticated", "authenticate", "requireSession"]);
const adminMiddlewareNames = new Set(["requireAdmin", "requireSuperuser", "requireRole", "adminOnly"]);

function collectAuthChecks(source: ts.SourceFile, filePath: string): AuthCheck[] {
  const checks: AuthCheck[] = [];

  visit(source, (node) => {
    if (!ts.isCallExpression(node)) return;
    const expression = node.expression;
    if (!ts.isPropertyAccessExpression(expression)) return;
    const method = expression.name.text;
    if (!httpMethods.has(method)) return;
    const firstArg = node.arguments[0];
    if (!firstArg || !ts.isStringLiteralLike(firstArg)) return;

    const middlewares: string[] = [];
    for (let i = 1; i < node.arguments.length; i += 1) {
      const arg = node.arguments[i];
      if (!arg) continue;
      if (ts.isIdentifier(arg)) middlewares.push(arg.text);
      else if (ts.isCallExpression(arg) && ts.isIdentifier(arg.expression)) middlewares.push(arg.expression.text);
    }

    let authStatus: AuthCheck["authStatus"] = "unprotected";
    if (middlewares.some((m) => adminMiddlewareNames.has(m))) authStatus = "admin-only";
    else if (middlewares.some((m) => authMiddlewareNames.has(m))) authStatus = "protected";

    checks.push({
      endpoint: firstArg.text,
      method: method.toUpperCase(),
      filePath,
      line: getLine(source, node.getStart(source)),
      middlewares,
      authStatus
    });
  });

  return checks;
}

export const demoSourceFiles: SourceFileInput[] = [
  {
    path: "src/routes/reports.ts",
    content: `
      router.get("/api/reports/billing", requireAuth, async (req, res) => {
        const rows = await prisma.invoice.findMany({
          where: { status: "paid" },
          include: { customer: true }
        });
        res.json(rows);
      });
    `
  },
  {
    path: "src/routes/customers.ts",
    content: `
      router.get("/api/customers/:id", requireAuth, async (req, res) => {
        const customer = await prisma.customer.findFirst({
          where: { id: req.params.id, organizationId: req.session.organizationId }
        });
        res.json(customer);
      });
    `
  },
  {
    path: "src/services/exportReservations.ts",
    content: `
      router.post("/api/admin/export/reservations", requireAdmin, async (req, res) => {
        const reservations = await db.reservation.findMany({
          include: { guest: true, payments: true }
        });
        res.csv(renderCsv(reservations));
      });
    `
  },
  {
    path: "src/routes/health.ts",
    content: `
      router.get("/api/health", async (_req, res) => {
        res.json({ ok: true });
      });
    `
  }
];

function collectRoutes(source: ts.SourceFile, filePath: string): EndpointTrace[] {
  const routes: EndpointTrace[] = [];

  visit(source, (node) => {
    if (!ts.isCallExpression(node)) return;
    const expression = node.expression;
    if (!ts.isPropertyAccessExpression(expression)) return;
    const method = expression.name.text;
    if (!httpMethods.has(method)) return;

    const firstArg = node.arguments[0];
    if (!firstArg || !ts.isStringLiteralLike(firstArg)) return;

    routes.push({
      endpoint: firstArg.text,
      method: method.toUpperCase(),
      filePath,
      line: getLine(source, node.getStart(source))
    });
  });

  visit(source, (node) => {
    if (!ts.isFunctionDeclaration(node)) return;
    const name = node.name?.text;
    if (!name || !["GET", "POST", "PUT", "PATCH", "DELETE"].includes(name)) return;
    routes.push({
      endpoint: "next-route-handler",
      method: name,
      filePath,
      line: getLine(source, node.getStart(source))
    });
  });

  return routes.sort((a, b) => a.line - b.line);
}

function visit(node: ts.Node, callback: (node: ts.Node) => void): void {
  callback(node);
  ts.forEachChild(node, (child) => visit(child, callback));
}

function isQueryExpression(node: ts.CallExpression | ts.TaggedTemplateExpression): boolean {
  if (ts.isTaggedTemplateExpression(node)) {
    const tag = node.tag.getText();
    return queryMethods.has(tag) || rawSqlPattern.test(node.template.getText());
  }

  const expression = node.expression;
  if (ts.isPropertyAccessExpression(expression)) {
    return queryMethods.has(expression.name.text);
  }

  if (ts.isIdentifier(expression)) {
    return queryMethods.has(expression.text);
  }

  return rawSqlPattern.test(node.getText());
}

function findNearestRoute(routes: EndpointTrace[], line: number): EndpointTrace {
  const earlierRoutes = routes.filter((route) => route.line <= line);
  const route = earlierRoutes.at(-1) ?? routes[0];
  return (
    route ?? {
      endpoint: "background-job",
      method: "JOB",
      filePath: "unknown",
      line: 1
    }
  );
}

function queryRequiresTenantBoundary(text: string): boolean {
  return sensitiveDataPattern.test(text) || rawSqlPattern.test(text);
}

function hasTenantBoundary(text: string): boolean {
  return tenantBoundaryPattern.test(text);
}

function createTenantFinding(trace: QueryTrace): AnalyzerFinding {
  const severity = inferSeverity(trace);
  const noun = trace.endpoint === "background-job" ? "data access" : `${trace.routeMethod} ${trace.endpoint}`;

  return {
    id: stableFindingId(trace),
    ruleId: "tenant-filter-required",
    severity,
    title: `Missing tenant filter in ${noun}`,
    summary: "Covenant found a sensitive database read or write without an explicit tenant boundary in the query itself.",
    filePath: trace.filePath,
    line: trace.line,
    endpoint: trace.endpoint,
    routeMethod: trace.routeMethod,
    evidence: trace.text,
    impact:
      severity === "critical"
        ? "A single request can expose billing, payment, export, or report data across tenants."
        : "The query can cross tenant boundaries unless every caller performs a separate ownership check.",
    suggestedFix:
      "Bind the query to session.organizationId, tenantId, or the app's canonical tenant key at the database layer, then add a regression test for cross-tenant access.",
    exploitSteps: [
      "Authenticate as a user in tenant A.",
      `Call ${trace.routeMethod} ${trace.endpoint} with filters that return shared-resource rows.`,
      "Confirm the response cannot include records owned by tenant B after the tenant key is added."
    ]
  };
}

function inferSeverity(trace: QueryTrace): Severity {
  const haystack = `${trace.endpoint} ${trace.text}`;
  if (/\b(invoice|billing|payment|payout|export|ledger|admin)\b/i.test(haystack)) return "critical";
  if (/\b(reservation|guest|customer|user|report)\b/i.test(haystack)) return "high";
  if (/\b(update|delete|create)\b/i.test(trace.text)) return "high";
  return "medium";
}

function severityOrder(severity: Severity): number {
  if (severity === "critical") return 4;
  if (severity === "high") return 3;
  if (severity === "medium") return 2;
  return 1;
}

function stableFindingId(trace: QueryTrace): string {
  return `finding_${slug(trace.filePath)}_${trace.line}_${slug(trace.endpoint)}`;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function compactText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function getLine(source: ts.SourceFile, position: number): number {
  return source.getLineAndCharacterOfPosition(position).line + 1;
}

export * from './agent-contract';
export * from './analyzer-runner';
