/**
 * Per-org settings store — Session 4 §3, §4, §5.
 *
 * Schema migration for OrganizationSettings is deferred (the Prisma
 * schema doesn't carry a JSON settings column today). Until that
 * migration ships, this module exposes the same get/update API a
 * Prisma-backed implementation would, but keeps state in-memory keyed
 * by organizationId. Callers don't have to change when persistence
 * lands.
 *
 * Structure:
 *   - `ipAllowlist`: CIDR list (v4/v6) — empty == allow-all.
 *   - `sso`: { provider, metadataUrl, defaultRole }
 *   - `scim`: { bearerTokenHash }
 *   - `llm`: BYO LLM provider config (provider, model, apiKey, costCapUsd).
 *   - `theme`: { primary, accent, logoUrl } — wired into web layout.
 *   - `featureFlags`: per-org overrides keyed by flag key.
 */

export interface OrgSettings {
  ipAllowlist: string[];
  sso: {
    provider: "saml" | "oidc" | "none";
    issuer: string | null;
    metadataUrl: string | null;
    defaultRole: "owner" | "admin" | "member";
  };
  scim: {
    bearerTokenHash: string | null;
  };
  llm: {
    provider: "openai" | "anthropic" | "azure" | "local-noop";
    model: string;
    apiKeyRef: string | null;
    costCapUsd: number;
    enabled: boolean;
  };
  theme: {
    primary: string | null;
    accent: string | null;
    logoUrl: string | null;
  };
  featureFlags: Record<string, boolean>;
}

const DEFAULT: OrgSettings = {
  ipAllowlist: [],
  sso: { provider: "none", issuer: null, metadataUrl: null, defaultRole: "member" },
  scim: { bearerTokenHash: null },
  llm: { provider: "local-noop", model: "noop", apiKeyRef: null, costCapUsd: 50, enabled: true },
  theme: { primary: null, accent: null, logoUrl: null },
  featureFlags: {}
};

const store = new Map<string, OrgSettings>();

export function getSettings(organizationId: string): OrgSettings {
  return store.get(organizationId) ?? DEFAULT;
}

export function setSettings(
  organizationId: string,
  partial: {
    ipAllowlist?: string[];
    sso?: Partial<OrgSettings["sso"]>;
    scim?: Partial<OrgSettings["scim"]>;
    llm?: Partial<OrgSettings["llm"]>;
    theme?: Partial<OrgSettings["theme"]>;
    featureFlags?: Record<string, boolean>;
  }
): OrgSettings {
  const current = getSettings(organizationId);
  const next: OrgSettings = {
    ...current,
    sso: { ...current.sso, ...(partial.sso ?? {}) },
    scim: { ...current.scim, ...(partial.scim ?? {}) },
    llm: { ...current.llm, ...(partial.llm ?? {}) },
    theme: { ...current.theme, ...(partial.theme ?? {}) },
    featureFlags: { ...current.featureFlags, ...(partial.featureFlags ?? {}) },
    ipAllowlist: partial.ipAllowlist ?? current.ipAllowlist
  };
  store.set(organizationId, next);
  return next;
}

/** Test/utility hook — wipe all in-memory settings. */
export function __resetSettings(): void {
  store.clear();
}
