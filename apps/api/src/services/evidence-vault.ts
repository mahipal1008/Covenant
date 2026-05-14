import { createHash } from "node:crypto";

/**
 * Evidence vault — Session 6 §6.
 *
 * Stores compliance artefacts (CI artefacts, policy docs, training
 * records, vendor risk responses) in an S3-compatible bucket when one
 * is configured, otherwise falls back to a process-local in-memory
 * map. The fallback is intentional for the code-only milestone so the
 * platform boots without cloud credentials; once `EVIDENCE_S3_BUCKET`
 * is set, every put goes to durable storage.
 */

export type EvidenceCategory =
  | "ci-artifact"
  | "policy-doc"
  | "training-record"
  | "vendor-risk";

export interface EvidenceMetadata {
  id: string;
  organizationId: string;
  category: EvidenceCategory;
  name: string;
  contentType: string;
  bytes: number;
  sha256: string;
  storedAt: string;
  storageBackend: "s3" | "memory";
  uri: string;
}

export interface PutEvidenceInput {
  organizationId: string;
  category: EvidenceCategory;
  name: string;
  body: Buffer | string;
  contentType?: string;
}

interface S3Config {
  endpoint: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
}

function readS3Config(): S3Config | null {
  const endpoint = process.env.EVIDENCE_S3_ENDPOINT;
  const bucket = process.env.EVIDENCE_S3_BUCKET;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID ?? process.env.EVIDENCE_S3_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.AWS_SECRET_ACCESS_KEY ?? process.env.EVIDENCE_S3_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) return null;
  return {
    endpoint,
    bucket,
    region: process.env.EVIDENCE_S3_REGION ?? "us-east-1",
    accessKeyId,
    secretAccessKey,
    forcePathStyle: process.env.EVIDENCE_S3_FORCE_PATH_STYLE !== "false"
  };
}

const memoryStore = new Map<string, { body: Buffer; meta: EvidenceMetadata }>();

function buildId(organizationId: string, category: string, name: string): string {
  const safe = name.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const safeOrg = organizationId.replace(/[^a-zA-Z0-9._-]+/g, "_");
  // SECURITY: org id is the FIRST segment of every key so cross-tenant
  // S3 listings (prefix-scoped) and memory-store filters can't leak data
  // between organizations. See production-readiness-plan.md §C2-api.
  return `${safeOrg}/${category}/${Date.now()}-${safe}`;
}

async function loadS3Sdk(): Promise<{
  S3Client: new (cfg: unknown) => { send: (cmd: unknown) => Promise<unknown> };
  PutObjectCommand: new (input: unknown) => unknown;
  ListObjectsV2Command: new (input: unknown) => unknown;
} | null> {
  // Dynamic + indirect import so TypeScript doesn't try to resolve the
  // module at build time. Returns null when the SDK is not installed.
  try {
    const dynImport = new Function("m", "return import(m)") as (m: string) => Promise<unknown>;
    const mod = (await dynImport("@aws-sdk/client-s3")) as {
      S3Client: new (cfg: unknown) => { send: (cmd: unknown) => Promise<unknown> };
      PutObjectCommand: new (input: unknown) => unknown;
      ListObjectsV2Command: new (input: unknown) => unknown;
    };
    return mod;
  } catch {
    return null;
  }
}

async function putToS3(
  cfg: S3Config,
  id: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const sdk = await loadS3Sdk();
  if (!sdk) {
    throw new Error(
      "Evidence vault: EVIDENCE_S3_BUCKET set but @aws-sdk/client-s3 is not installed."
    );
  }
  const client = new sdk.S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint,
    forcePathStyle: cfg.forcePathStyle,
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey }
  });
  await client.send(
    new sdk.PutObjectCommand({
      Bucket: cfg.bucket,
      Key: id,
      Body: body,
      ContentType: contentType
    })
  );
  return `s3://${cfg.bucket}/${id}`;
}

export async function putEvidence(input: PutEvidenceInput): Promise<EvidenceMetadata> {
  if (!input.organizationId) {
    throw new Error("evidence-vault: organizationId is required");
  }
  const body = typeof input.body === "string" ? Buffer.from(input.body, "utf8") : input.body;
  const contentType = input.contentType ?? "application/octet-stream";
  const id = buildId(input.organizationId, input.category, input.name);
  const sha256 = createHash("sha256").update(body).digest("hex");
  const cfg = readS3Config();
  if (cfg) {
    const uri = await putToS3(cfg, id, body, contentType);
    const meta: EvidenceMetadata = {
      id,
      organizationId: input.organizationId,
      category: input.category,
      name: input.name,
      contentType,
      bytes: body.byteLength,
      sha256,
      storedAt: new Date().toISOString(),
      storageBackend: "s3",
      uri
    };
    return meta;
  }
  const meta: EvidenceMetadata = {
    id,
    organizationId: input.organizationId,
    category: input.category,
    name: input.name,
    contentType,
    bytes: body.byteLength,
    sha256,
    storedAt: new Date().toISOString(),
    storageBackend: "memory",
    uri: `memory://${id}`
  };
  memoryStore.set(id, { body, meta });
  return meta;
}

export async function listEvidence(
  organizationId: string,
  category?: EvidenceCategory
): Promise<EvidenceMetadata[]> {
  if (!organizationId) {
    throw new Error("evidence-vault: organizationId is required");
  }
  const safeOrg = organizationId.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const cfg = readS3Config();
  if (cfg) {
    const sdk = await loadS3Sdk();
    if (!sdk) return [];
    const client = new sdk.S3Client({
      region: cfg.region,
      endpoint: cfg.endpoint,
      forcePathStyle: cfg.forcePathStyle,
      credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey }
    });
    const prefix = category ? `${safeOrg}/${category}/` : `${safeOrg}/`;
    const out = (await client.send(
      new sdk.ListObjectsV2Command({ Bucket: cfg.bucket, Prefix: prefix })
    )) as { Contents?: Array<{ Key?: string; Size?: number; ETag?: string; LastModified?: Date }> };
    return (out.Contents ?? []).map((obj) => {
      const key = obj.Key ?? "";
      const parts = key.split("/");
      return {
        id: key,
        organizationId,
        category: ((parts[1] ?? "ci-artifact") as EvidenceCategory),
        name: parts.slice(2).join("/"),
        contentType: "application/octet-stream",
        bytes: obj.Size ?? 0,
        sha256: obj.ETag?.replace(/"/g, "") ?? "",
        storedAt: obj.LastModified?.toISOString() ?? new Date().toISOString(),
        storageBackend: "s3" as const,
        uri: `s3://${cfg.bucket}/${key}`
      };
    });
  }
  const all = Array.from(memoryStore.values())
    .map((v) => v.meta)
    .filter((m) => m.organizationId === organizationId);
  return category ? all.filter((m) => m.category === category) : all;
}

/** Reset helper for tests. */
export function __resetMemoryStore(): void {
  memoryStore.clear();
}
