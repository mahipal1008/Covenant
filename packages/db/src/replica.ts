import { PrismaClient } from "@prisma/client";

/**
 * Read-replica Prisma client — Session 6 §10.
 *
 * When `DATABASE_REPLICA_URL` is set, expose a separate Prisma client
 * pointed at the replica DSN for read-only workloads. When unset, the
 * primary `prisma` client is re-exported so callers can write
 * replica-aware code today and pick up the optimisation tomorrow.
 *
 * Usage:
 *   import { prismaReplica } from "@covenant/db/replica";
 *   await prismaReplica.scan.findMany({ ... });
 *
 * Writes through `prismaReplica` are NOT prevented at the type level
 * (Prisma's client doesn't expose a readonly variant). Tenant-guarded
 * code paths should continue to write through the primary `prisma`
 * client to avoid replication lag bugs.
 */

import { prisma } from "./index";

const globalForReplica = globalThis as unknown as {
  covenantReplica?: PrismaClient;
};

function buildReplica(): PrismaClient {
  const url = process.env.DATABASE_REPLICA_URL;
  if (!url) return prisma;
  return (
    globalForReplica.covenantReplica ??
    new PrismaClient({
      datasources: { db: { url } },
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
    })
  );
}

export const prismaReplica: PrismaClient = buildReplica();

if (process.env.NODE_ENV !== "production" && process.env.DATABASE_REPLICA_URL) {
  globalForReplica.covenantReplica = prismaReplica;
}
