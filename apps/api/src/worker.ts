import { startWorkers } from "./jobs/start";

const handle = startWorkers();
console.log("[covenant-worker] booted with 4 queues: scan, digest, regulations, cve");

const shutdown = async (signal: string) => {
  console.log(`[covenant-worker] received ${signal}, shutting down...`);
  await handle.close();
  process.exit(0);
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
