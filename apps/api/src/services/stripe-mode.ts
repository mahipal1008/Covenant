/**
 * Stripe mode + key validator — Session 7 §2.
 *
 * Two responsibilities:
 *   1. Choose between TEST and LIVE keys based on `STRIPE_MODE`.
 *   2. Refuse to boot in LIVE without a positive
 *      `STRIPE_TAX_REGISTRATION_VERIFIED=true` flag — the
 *      legal/tax checklist in docs/runbooks/stripe-go-live.md must
 *      be ticked off before LIVE charges are accepted.
 */

export type StripeMode = "test" | "live";

export interface StripeModeConfig {
  mode: StripeMode;
  secretKey: string;
  webhookSecret: string | null;
  publishableKey: string | null;
}

export class StripeLiveModeNotReadyError extends Error {
  constructor(missing: string[]) {
    super(
      `STRIPE_MODE=live but the following preconditions are missing: ${missing.join(
        ", "
      )}. See docs/runbooks/stripe-go-live.md.`
    );
    this.name = "StripeLiveModeNotReadyError";
  }
}

function asBool(v: string | undefined): boolean {
  return v === "true" || v === "1" || v === "yes";
}

export function loadStripeMode(env: NodeJS.ProcessEnv = process.env): StripeModeConfig {
  const mode: StripeMode = env.STRIPE_MODE === "live" ? "live" : "test";
  const secretKey = env.STRIPE_SECRET_KEY ?? "";
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET ?? null;
  const publishableKey = env.STRIPE_PUBLISHABLE_KEY ?? null;

  if (mode === "live") {
    const missing: string[] = [];
    if (!secretKey.startsWith("sk_live_")) missing.push("STRIPE_SECRET_KEY (must be sk_live_*)");
    if (!webhookSecret || !webhookSecret.startsWith("whsec_")) missing.push("STRIPE_WEBHOOK_SECRET");
    if (!publishableKey || !publishableKey.startsWith("pk_live_"))
      missing.push("STRIPE_PUBLISHABLE_KEY (must be pk_live_*)");
    if (!asBool(env.STRIPE_TAX_REGISTRATION_VERIFIED))
      missing.push("STRIPE_TAX_REGISTRATION_VERIFIED=true");
    if (missing.length > 0) throw new StripeLiveModeNotReadyError(missing);
  }

  return { mode, secretKey, webhookSecret, publishableKey };
}
