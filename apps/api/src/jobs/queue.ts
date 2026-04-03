import { Queue } from "bullmq";
import IORedis, { type Redis } from "ioredis";
import { loadConfig } from "../config";

/**
 * Centralized BullMQ wiring (master plan §4.3).
 *
 * Four queues, one shared ioredis connection (BullMQ requires
 * `maxRetriesPerRequest: null` on the connection used for blocking commands).
 *
 *   - covenant-scan       : per-PR / on-demand security scans
 *   - covenant-digest     : nightly + weekly notification digests
 *   - covenant-regulations: scheduled regulation/policy refresh from upstream
 *   - covenant-cve        : CVE feed watcher (osv.dev, GitHub advisories)
 */

export type ScanJobData = {
  organizationId: string;
  repositoryId: string;
  sourceMode: "demo" | "uploaded" | "provider";
};

export type DigestJobData = {
  organizationId: string;
  scope: "daily" | "weekly";
};

export type RegulationSyncJobData = {
  source: "gdpr" | "hipaa" | "soc2" | "iso27001" | "all";
};

export type CveWatcherJobData = {
  ecosystem: "npm" | "pypi" | "maven" | "go" | "all";
};

let connection: Redis | null = null;
function getConnection(): Redis {
  if (connection) return connection;
  const cfg = loadConfig();
  connection = new IORedis(cfg.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true
  });
  return connection;
}

let scanQueue: Queue<ScanJobData> | null = null;
let digestQueue: Queue<DigestJobData> | null = null;
let regulationQueue: Queue<RegulationSyncJobData> | null = null;
let cveQueue: Queue<CveWatcherJobData> | null = null;

export function getScanQueue(): Queue<ScanJobData> {
  return (scanQueue ??= new Queue<ScanJobData>("covenant-scan", { connection: getConnection() }));
}

export function getDigestQueue(): Queue<DigestJobData> {
  return (digestQueue ??= new Queue<DigestJobData>("covenant-digest", { connection: getConnection() }));
}

export function getRegulationQueue(): Queue<RegulationSyncJobData> {
  return (regulationQueue ??= new Queue<RegulationSyncJobData>("covenant-regulations", {
    connection: getConnection()
  }));
}

export function getCveQueue(): Queue<CveWatcherJobData> {
  return (cveQueue ??= new Queue<CveWatcherJobData>("covenant-cve", { connection: getConnection() }));
}

/**
 * BullMQ default job options that align with master plan §4.3:
 *   - exponential backoff (initial 5s)
 *   - max 5 attempts
 *   - keep last 100 completed jobs and 1000 failed for inspection
 */
export const defaultJobOptions = {
  attempts: 5,
  backoff: { type: "exponential" as const, delay: 5000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 1000 }
};

export function getRedisConnection(): Redis {
  return getConnection();
}
