import { buildScanWorker } from "./workers/scan-worker";
import { buildDigestWorker } from "./workers/digest-worker";
import { buildRegulationWorker } from "./workers/regulation-worker";
import { buildCveWorker } from "./workers/cve-worker";

/**
 * Boot every BullMQ worker. Used by:
 *   - the dedicated worker entrypoint (apps/api/src/worker.ts)
 *   - the API server in development (when WORKERS_INLINE=1)
 */
export function startWorkers() {
  const workers = [buildScanWorker(), buildDigestWorker(), buildRegulationWorker(), buildCveWorker()];
  return {
    workers,
    async close() {
      await Promise.allSettled(workers.map((w) => w.close()));
    }
  };
}
