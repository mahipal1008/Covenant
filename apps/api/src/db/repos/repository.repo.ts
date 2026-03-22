import type { Repository as SharedRepository } from "@covenant/shared";
import { tenantPrisma } from "../tenant-guard";

/**
 * Repository repository (Prisma-backed) — first slice of the demoStore
 * cutover (master plan §3, ADR-001 tenant-guard). Lives behind tenantPrisma
 * so cross-tenant queries are blocked at the ORM layer.
 *
 * Maps Prisma's normalized columns to the shared `Repository` shape that
 * the web client expects.
 */

const PROVIDER_DEFAULT = "github" as const;
function normalizeProvider(value: string): SharedRepository["provider"] {
  if (value === "github" || value === "gitlab" || value === "upload") return value;
  return PROVIDER_DEFAULT;
}

export async function listRepositories(): Promise<SharedRepository[]> {
  const rows = await tenantPrisma.repository.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { findings: { where: { status: "open" } } }
      }
    }
  });
  return rows.map((r) => ({
    id: r.id,
    organizationId: r.organizationId,
    name: r.name,
    provider: normalizeProvider(r.provider),
    defaultBranch: r.defaultBranch,
    language: r.language,
    lastCommitSha: r.lastCommitSha ?? "",
    lastScannedAt: r.lastScannedAt ? r.lastScannedAt.toISOString() : "",
    scanStatus: r.scanStatus,
    openFindings: r._count.findings,
    riskScore: r.riskScore
  }));
}

export async function createRepository(input: {
  name: string;
  provider: SharedRepository["provider"];
  defaultBranch: string;
  language: string;
}): Promise<SharedRepository> {
  // organizationId is injected by tenant-guard regardless of what we pass.
  const created = await tenantPrisma.repository.create({
    data: {
      organizationId: "(injected by tenant-guard)",
      name: input.name,
      provider: input.provider,
      defaultBranch: input.defaultBranch,
      language: input.language,
      lastCommitSha: null,
      scanStatus: "queued",
      riskScore: 100
    }
  });
  return {
    id: created.id,
    organizationId: created.organizationId,
    name: created.name,
    provider: normalizeProvider(created.provider),
    defaultBranch: created.defaultBranch,
    language: created.language,
    lastCommitSha: created.lastCommitSha ?? "",
    lastScannedAt: created.lastScannedAt ? created.lastScannedAt.toISOString() : "",
    scanStatus: created.scanStatus,
    openFindings: 0,
    riskScore: created.riskScore
  };
}
