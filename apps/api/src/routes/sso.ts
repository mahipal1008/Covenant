import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { resolveProvider } from "../auth/sso";
import { getSettings } from "../services/org-settings";

/**
 * SSO routes — Session 4 §1.
 *
 *   POST /v1/auth/sso/:org/start    → redirectUrl + state
 *   POST /v1/auth/sso/:org/callback → assertion → verified profile
 *
 * The actual JWT minting is delegated to the existing /auth path. This
 * plugin only handles the SAML/OIDC handshake.
 */

const startSchema = z.object({ relayState: z.string().optional() });
const callbackSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  externalId: z.string(),
  groups: z.array(z.string()).default([]),
  signature: z.string(),
  state: z.string()
});

export const ssoRoutes: FastifyPluginAsync = async (app) => {
  app.post("/auth/sso/:org/start", async (req, reply) => {
    const params = req.params as { org: string };
    const body = startSchema.safeParse(req.body ?? {});
    if (!body.success) return reply.badRequest("invalid body");
    const settings = getSettings(params.org);
    const provider = resolveProvider(settings.sso.provider === "none" ? "fixture" : settings.sso.provider);
    const result = await provider.start({
      organizationId: params.org,
      ...(body.data.relayState ? { relayState: body.data.relayState } : {})
    });
    return result;
  });

  app.post("/auth/sso/:org/callback", async (req, reply) => {
    const params = req.params as { org: string };
    const body = callbackSchema.safeParse(req.body ?? {});
    if (!body.success) return reply.badRequest("invalid assertion");
    const settings = getSettings(params.org);
    const provider = resolveProvider(settings.sso.provider === "none" ? "fixture" : settings.sso.provider);
    const profile = await provider.callback({ organizationId: params.org, payload: body.data });
    if (!profile.verified) return reply.unauthorized("sso: signature invalid");
    return profile;
  });
};
