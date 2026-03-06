import { AsyncLocalStorage } from "node:async_hooks";
import { Prisma } from "@prisma/client";

/**
 * Dev-only N+1 query detector — Session 6 §10.
 *
 * Wrap a request (or any logical unit of work) with `runWithQueryScope`
 * and any Prisma operation that fires inside will be counted by
 * `model:action`. When the same key fires more than `THRESHOLD` times
 * within a single scope, we log a warning. The hook is a no-op in
 * production and when the detector is disabled.
 */

interface ScopeBucket {
  startedAt: number;
  counts: Map<string, number>;
  warned: Set<string>;
}

const THRESHOLD = Number(process.env.PRISMA_NPLUSONE_THRESHOLD ?? 10);
const ENABLED =
  process.env.NODE_ENV !== "production" && process.env.PRISMA_NPLUSONE !== "off";

const storage = new AsyncLocalStorage<ScopeBucket>();

export function runWithQueryScope<T>(label: string, fn: () => Promise<T>): Promise<T> {
  if (!ENABLED) return fn();
  const bucket: ScopeBucket = { startedAt: Date.now(), counts: new Map(), warned: new Set() };
  return storage.run(bucket, async () => {
    try {
      return await fn();
    } finally {
      const elapsed = Date.now() - bucket.startedAt;
      for (const [key, count] of bucket.counts) {
        if (count > THRESHOLD) {
          // eslint-disable-next-line no-console
          console.warn(
            `[n+1] ${label} fired ${count}× ${key} in ${elapsed}ms — consider include/select or a join.`
          );
        }
      }
    }
  });
}

/** Prisma `$extends` query hook. Pass to `prisma.$extends({ query: nPlusOneExtension })`. */
export const nPlusOneExtension = Prisma.defineExtension({
  name: "n-plus-one-detector",
  query: {
    $allOperations: ({ model, operation, args, query }) => {
      if (!ENABLED) return query(args);
      const bucket = storage.getStore();
      if (!bucket) return query(args);
      const key = `${model ?? "raw"}:${operation}`;
      bucket.counts.set(key, (bucket.counts.get(key) ?? 0) + 1);
      const count = bucket.counts.get(key)!;
      if (count === THRESHOLD + 1 && !bucket.warned.has(key)) {
        bucket.warned.add(key);
        // eslint-disable-next-line no-console
        console.warn(`[n+1] ${key} crossed threshold (${THRESHOLD}); investigate.`);
      }
      return query(args);
    }
  }
});
