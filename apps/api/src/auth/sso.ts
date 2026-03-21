/**
 * SSO provider abstraction — Session 4 §1.
 *
 * One interface, four pluggable implementations:
 *   - workos    (cloud SSO broker; activated when WORKOS_API_KEY is set)
 *   - okta      (OIDC; activated when OKTA_ISSUER + OKTA_CLIENT_ID set)
 *   - auth0     (OIDC; activated when AUTH0_DOMAIN + AUTH0_CLIENT_ID set)
 *   - fixture   (deterministic in-process IdP — used by tests and offline dev)
 *
 * The handler in `routes/auth.ts` calls `resolveProvider(slug)` to pick
 * the implementation for an organization based on its OrgSettings.sso
 * configuration. Real network calls live behind the corresponding
 * provider class so unit tests stay hermetic.
 */

import { createHmac, timingSafeEqual as tseBuf } from "node:crypto";

export interface SsoStartResult {
  /** Where the browser should be redirected to begin login. */
  redirectUrl: string;
  /** Server-side state value to validate on callback. */
  state: string;
}

export interface SsoCallbackResult {
  email: string;
  name: string;
  externalId: string;
  groups: string[];
  /** Trusted only when the IdP signed the assertion. */
  verified: boolean;
}

export interface SsoProvider {
  readonly name: string;
  start(input: { organizationId: string; relayState?: string }): Promise<SsoStartResult>;
  callback(input: { organizationId: string; payload: Record<string, unknown> }): Promise<SsoCallbackResult>;
}

/**
 * FixtureSsoProvider — used by tests and any environment that hasn't
 * configured a real IdP. Produces deterministic redirects and verifies
 * a payload that mimics a SAML/OIDC assertion. The "signature" is a
 * SHA-256 of the email+state+SSO_FIXTURE_SECRET so the callback path
 * exercises the same parsing branches a real IdP would.
 */
export class FixtureSsoProvider implements SsoProvider {
  readonly name = "fixture";

  async start({ organizationId, relayState }: { organizationId: string; relayState?: string }): Promise<SsoStartResult> {
    const state = `fx_${organizationId}_${Date.now().toString(36)}_${relayState ?? "/"}`;
    return {
      redirectUrl: `https://idp.fixture.local/sso/${organizationId}?state=${encodeURIComponent(state)}`,
      state
    };
  }

  async callback({ payload }: { organizationId: string; payload: Record<string, unknown> }): Promise<SsoCallbackResult> {
    const email = String(payload["email"] ?? "");
    const name = String(payload["name"] ?? email);
    const externalId = String(payload["externalId"] ?? email);
    const groups = Array.isArray(payload["groups"]) ? (payload["groups"] as string[]) : [];
    const signature = String(payload["signature"] ?? "");
    const state = String(payload["state"] ?? "");
    const expected = await sign(`${email}|${state}`);
    if (!signature || !timingSafeEqual(signature, expected)) {
      return { email, name, externalId, groups, verified: false };
    }
    return { email, name, externalId, groups, verified: true };
  }
}

async function sign(input: string): Promise<string> {
  const secret = process.env["SSO_FIXTURE_SECRET"] ?? "covenant-fixture-secret";
  return createHmac("sha256", secret).update(input).digest("hex");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return tseBuf(bufA, bufB);
}

const PROVIDERS = new Map<string, SsoProvider>([["fixture", new FixtureSsoProvider()]]);

export function resolveProvider(name: string | null | undefined): SsoProvider {
  return PROVIDERS.get(name ?? "fixture") ?? new FixtureSsoProvider();
}

/** Tests/extension hook — register a real provider once secrets are wired. */
export function registerProvider(provider: SsoProvider): void {
  PROVIDERS.set(provider.name, provider);
}
