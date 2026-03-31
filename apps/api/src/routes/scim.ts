import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";

/**
 * SCIM 2.0 Users + Groups — Session 4 §2.
 *
 * RFC 7644 endpoints:
 *   GET    /scim/v2/Users
 *   GET    /scim/v2/Users/:id
 *   POST   /scim/v2/Users
 *   PATCH  /scim/v2/Users/:id
 *   DELETE /scim/v2/Users/:id
 *   GET    /scim/v2/Groups
 *   POST   /scim/v2/Groups
 *
 * Auth: Bearer token compared (constant-time) against
 * `process.env.SCIM_BEARER_TOKEN`. Per-org SCIM tokens are tracked in
 * OrgSettings.scim.bearerTokenHash; the env value covers the
 * single-tenant or super-admin case.
 *
 * Backing store: in-memory keyed by user id. Production wires this to
 * Prisma User + Membership rows; the route surface is identical.
 */

interface ScimUser {
  id: string;
  userName: string;
  active: boolean;
  emails: { value: string; primary: boolean }[];
  name: { givenName: string; familyName: string };
  groups: string[];
  meta: { resourceType: "User"; created: string; lastModified: string };
}

interface ScimGroup {
  id: string;
  displayName: string;
  members: { value: string }[];
  meta: { resourceType: "Group"; created: string; lastModified: string };
}

const users = new Map<string, ScimUser>();
const groups = new Map<string, ScimGroup>();

const userBody = z.object({
  userName: z.string(),
  active: z.boolean().optional(),
  emails: z.array(z.object({ value: z.string().email(), primary: z.boolean().optional() })).default([]),
  name: z.object({ givenName: z.string().default(""), familyName: z.string().default("") }).default({ givenName: "", familyName: "" })
});

const groupBody = z.object({
  displayName: z.string(),
  members: z.array(z.object({ value: z.string() })).default([])
});

function authorize(req: FastifyRequest): boolean {
  const expected = process.env["SCIM_BEARER_TOKEN"];
  if (!expected) {
    // Same belt+braces as admin.ts: only honor the unauthenticated
    // bypass under a real test runner (npm_lifecycle_event present)
    // and explicitly NODE_ENV=test.
    return (
      process.env["NODE_ENV"] === "test" &&
      typeof process.env["npm_lifecycle_event"] === "string"
    );
  }
  const header = req.headers.authorization ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) return false;
  const presented = header.slice(7).trim();
  if (presented.length !== expected.length) return false;
  const a = Buffer.from(presented, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function listResponse<T>(resources: T[]) {
  return {
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    totalResults: resources.length,
    Resources: resources,
    itemsPerPage: resources.length,
    startIndex: 1
  };
}

function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export const scimRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", async (req, reply) => {
    if (!req.url.startsWith("/scim/")) return;
    if (!authorize(req)) return reply.unauthorized("scim: invalid bearer");
  });

  app.get("/scim/v2/Users", async () => listResponse([...users.values()]));

  app.get("/scim/v2/Users/:id", async (req, reply) => {
    const u = users.get((req.params as { id: string }).id);
    if (!u) return reply.notFound("user");
    return u;
  });

  app.post("/scim/v2/Users", async (req, reply) => {
    const parsed = userBody.safeParse(req.body);
    if (!parsed.success) return reply.badRequest("invalid user");
    const id = newId("usr");
    const now = new Date().toISOString();
    const user: ScimUser = {
      id,
      userName: parsed.data.userName,
      active: parsed.data.active ?? true,
      emails: parsed.data.emails.map((e) => ({ value: e.value, primary: e.primary ?? false })),
      name: parsed.data.name,
      groups: [],
      meta: { resourceType: "User", created: now, lastModified: now }
    };
    users.set(id, user);
    return reply.code(201).send(user);
  });

  app.patch("/scim/v2/Users/:id", async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const existing = users.get(id);
    if (!existing) return reply.notFound("user");
    const u = existing;
    const ops = (req.body as { Operations?: { op: string; path?: string; value?: unknown }[] })?.Operations ?? [];
    // Allowlist of fields a SCIM client may patch. `id` and `meta` are
    // server-managed; `groups` are managed via /Groups membership ops.
    // Closes the Object.assign mass-assignment vector.
    const PATCHABLE = new Set(["userName", "active", "emails", "name"]);
    function applyValue(key: string, value: unknown): void {
      if (!PATCHABLE.has(key)) return;
      if (key === "active") u.active = Boolean(value);
      else if (key === "userName" && typeof value === "string") u.userName = value;
      else if (key === "emails" && Array.isArray(value)) {
        u.emails = (value as { value?: unknown; primary?: unknown }[])
          .filter((e) => typeof e.value === "string")
          .map((e) => ({ value: String(e.value), primary: Boolean(e.primary) }));
      } else if (key === "name" && typeof value === "object" && value) {
        const v = value as { givenName?: unknown; familyName?: unknown };
        u.name = {
          givenName: typeof v.givenName === "string" ? v.givenName : u.name.givenName,
          familyName: typeof v.familyName === "string" ? v.familyName : u.name.familyName
        };
      }
    }
    for (const op of ops) {
      if (op.op !== "replace" && op.op !== "add") continue;
      if (op.path && PATCHABLE.has(op.path)) {
        applyValue(op.path, op.value);
      } else if (!op.path && typeof op.value === "object" && op.value) {
        for (const [k, v] of Object.entries(op.value as Record<string, unknown>)) {
          applyValue(k, v);
        }
      }
    }
    u.meta.lastModified = new Date().toISOString();
    users.set(id, u);
    return u;
  });

  app.delete("/scim/v2/Users/:id", async (req, reply) => {
    const id = (req.params as { id: string }).id;
    if (!users.delete(id)) return reply.notFound("user");
    return reply.code(204).send();
  });

  app.get("/scim/v2/Groups", async () => listResponse([...groups.values()]));

  app.post("/scim/v2/Groups", async (req, reply) => {
    const parsed = groupBody.safeParse(req.body);
    if (!parsed.success) return reply.badRequest("invalid group");
    const id = newId("grp");
    const now = new Date().toISOString();
    const group: ScimGroup = {
      id,
      displayName: parsed.data.displayName,
      members: parsed.data.members,
      meta: { resourceType: "Group", created: now, lastModified: now }
    };
    groups.set(id, group);
    return reply.code(201).send(group);
  });
};

export function __resetScim(): void {
  users.clear();
  groups.clear();
}
