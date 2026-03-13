import type { Agent, AgentContext } from "../agent-contract";
import type { AnalyzerFinding } from "../index";

/**
 * A15 — Webhook Signature Verifier Auditor.
 *
 * Walks files that look like webhook handlers (path or content match
 * `webhook`) and ensures they reference one of the recognized signature
 * primitives:
 *   - createHmac + timingSafeEqual
 *   - stripe.webhooks.constructEvent
 *   - github verify_signature / @octokit/webhooks
 * If a file declares a `/webhooks/...` route but contains none of these,
 * it's flagged.
 */
const verifyPrimitives = /(timingSafeEqual|constructEvent|verify_signature|@octokit\/webhooks|verifyWebhook)/i;
const webhookRouteDecl = /\/(webhooks?)\//i;

export const a15WebhookSig: Agent<{ unverified: number }> = {
  id: "A15",
  name: "Webhook Signature Verifier",
  description: "Flags webhook routes that don't reference a signature verification primitive.",
  async run(ctx: AgentContext) {
    const findings: AnalyzerFinding[] = [];
    let unverified = 0;

    for (const file of ctx.sourceFiles) {
      const declaresWebhook = webhookRouteDecl.test(file.path) || webhookRouteDecl.test(file.content);
      if (!declaresWebhook) continue;
      if (verifyPrimitives.test(file.content)) continue;

      unverified += 1;
      findings.push({
        id: `a15-${Buffer.from(file.path).toString("hex").slice(0, 16)}`,
        ruleId: "webhook-missing-signature-verify",
        severity: "critical",
        title: `Webhook handler at ${file.path} does not verify signatures`,
        summary: "File declares a webhook route but does not reference timingSafeEqual / constructEvent / verify_signature.",
        filePath: file.path,
        line: 1,
        endpoint: "n/a",
        routeMethod: "POST",
        evidence: "no signature primitive matched",
        impact: "Anyone on the internet can spoof events, triggering arbitrary handler logic.",
        suggestedFix: "Compute HMAC-SHA256 of the raw body using the shared secret and compare with timingSafeEqual.",
        exploitSteps: ["POST a forged event to the webhook URL", "Observe handler runs as if from the real provider"]
      });
    }

    return { output: { unverified }, findings };
  }
};
