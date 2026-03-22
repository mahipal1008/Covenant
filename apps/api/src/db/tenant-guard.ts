import { AsyncLocalStorage } from "node:async_hooks";
import { prisma as basePrisma } from "@covenant/db";

/**
 * Tenant guard — ADR-001 / master plan §3.2.
 *
 * Every tenant-scoped query passes through this Prisma client extension. The
 * extension reads the active TenantContext from AsyncLocalStorage and injects
 * `organizationId` into every where clause and create payload, so route code
 * never has to remember to pass it. If a tenant-scoped query runs without an
 * active context, we throw `TenantContextMissingError` instead of silently
 * leaking cross-tenant data.
 */

export interface TenantContext {
  organizationId: string;
  userId: string | null;
}

export const tenantContext = new AsyncLocalStorage<TenantContext>();

export class TenantContextMissingError extends Error {
  readonly model: string;
  readonly operation: string;
  constructor(model: string, operation: string) {
    super(
      `TenantContextMissingError: ${model}.${operation} executed without an active tenant context. Wrap the call in runWithTenant() or ensure the request hook ran.`
    );
    this.name = "TenantContextMissingError";
    this.model = model;
    this.operation = operation;
  }
}

/**
 * Models that own an `organizationId` column. Anything not in this set
 * (e.g. `User`, `FeatureFlag`, `Endpoint`, `Commit`, `WebhookDelivery`,
 * `Report`, `QueryTrace`, `DataModel`) is reachable only via a tenant-scoped
 * parent and is intentionally excluded.
 */
const TENANT_SCOPED_MODELS = new Set<string>([
  "Membership",
  "Project",
  "Repository",
  "Scan",
  "Finding",
  "TenantBoundary",
  "IntentContract",
  "Integration",
  "Subscription",
  "Notification",
  "AuditEvent",
  "ApiToken",
  "WebhookSubscription",
  "NotificationPreference",
  "DataExportJob",
  "UsageRecord",
  "Invoice",
  "FeatureFlagAssignment"
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function injectWhere<T extends Record<string, unknown> | undefined>(
  args: T,
  orgId: string
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...(args ?? {}) };
  const where = isPlainObject(next.where) ? next.where : {};
  next.where = { AND: [where, { organizationId: orgId }] };
  return next;
}

function injectData(data: unknown, orgId: string): unknown {
  // We OVERRIDE any user-supplied organizationId so callers cannot smuggle a
  // foreign tenant. This is the trust boundary documented in ADR-001.
  if (Array.isArray(data)) {
    return data.map((row) =>
      isPlainObject(row) ? { ...row, organizationId: orgId } : row
    );
  }
  if (isPlainObject(data)) {
    return { ...data, organizationId: orgId };
  }
  return data;
}

export const tenantPrisma = basePrisma.$extends({
  name: "tenant-guard",
  query: {
    $allModels: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async $allOperations({ model, operation, args, query }: any) {
        if (!TENANT_SCOPED_MODELS.has(model)) {
          return query(args);
        }
        const ctx = tenantContext.getStore();
        if (!ctx) {
          throw new TenantContextMissingError(model, operation);
        }
        const orgId = ctx.organizationId;
        switch (operation) {
          case "findFirst":
          case "findFirstOrThrow":
          case "findMany":
          case "count":
          case "aggregate":
          case "groupBy":
          case "updateMany":
          case "deleteMany":
          case "update":
          case "delete":
            return query(injectWhere(args, orgId));
          case "upsert": {
            const next = { ...(args ?? {}) };
            const where = isPlainObject(next.where) ? next.where : {};
            next.where = { AND: [where, { organizationId: orgId }] };
            if (isPlainObject(next.create)) {
              next.create = { ...next.create, organizationId: orgId };
            }
            return query(next);
          }
          case "create": {
            const next = { ...(args ?? {}) };
            next.data = injectData(next.data, orgId);
            return query(next);
          }
          case "createMany":
          case "createManyAndReturn": {
            const next = { ...(args ?? {}) };
            next.data = injectData(next.data, orgId);
            return query(next);
          }
          case "findUnique":
          case "findUniqueOrThrow": {
            const result = await query(args);
            if (
              result &&
              isPlainObject(result) &&
              "organizationId" in result &&
              result.organizationId !== orgId
            ) {
              if (operation === "findUniqueOrThrow") {
                throw new Error(
                  `No ${model} found (cross-tenant access blocked by tenant-guard)`
                );
              }
              return null;
            }
            return result;
          }
          default:
            return query(args);
        }
      }
    }
  }
});

export type TenantPrisma = typeof tenantPrisma;

export async function runWithTenant<T>(
  ctx: TenantContext,
  fn: () => Promise<T> | T
): Promise<T> {
  return tenantContext.run(ctx, async () => fn());
}

export function currentTenant(): TenantContext {
  const ctx = tenantContext.getStore();
  if (!ctx) {
    throw new TenantContextMissingError("(none)", "currentTenant");
  }
  return ctx;
}

export function enterTenant(ctx: TenantContext): void {
  tenantContext.enterWith(ctx);
}
