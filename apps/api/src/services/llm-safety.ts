import { z } from "zod";
import { getSettings } from "./org-settings";
import { resolveLLMProvider, type LLMRequest, type LLMResponse } from "./llm-provider";

/**
 * LLM safety layer — Session 4 §6.
 *
 * Pre-flight:
 *   1. Per-org "model on" toggle.
 *   2. Cost cap per org per UTC day (in-memory ledger; DB persistence
 *      lands with the BillingEvent migration).
 *   3. Prompt-injection filter (regex deny list, hand-tuned for the
 *      common jailbreak shapes documented by OWASP LLM Top 10).
 *   4. PII redaction — emails, SSN, credit-card, phone, AWS keys.
 *
 * Post-flight:
 *   5. Output schema validation against the provided Zod schema.
 *   6. Cost recorded on the per-org ledger; once cap is breached, the
 *      next call short-circuits with a blocked=true response and the
 *      caller is expected to write an audit event.
 */

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?previous\s+(instructions|prompts|rules)/i,
  /disregard\s+(the\s+)?system\s+prompt/i,
  /you\s+are\s+now\s+(a|in)\s+\w+\s+(mode|role)/i,
  /reveal\s+(your\s+)?(system|hidden)\s+prompt/i,
  /act\s+as\s+(an?\s+)?(?:dan|developer\s+mode|jailbroken)/i,
  /<\|im_start\|>/i,
  /\$\$\s*system\s*\$\$/i
];

const PII_PATTERNS: { name: string; re: RegExp; replacement: string }[] = [
  { name: "email", re: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, replacement: "[REDACTED_EMAIL]" },
  { name: "ssn", re: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: "[REDACTED_SSN]" },
  { name: "credit-card", re: /\b(?:\d[ -]?){12,18}\d\b/g, replacement: "[REDACTED_CC]" },
  { name: "phone-us", re: /\b(?:\+?1[ .-]?)?\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}\b/g, replacement: "[REDACTED_PHONE]" },
  { name: "aws-key", re: /\bAKIA[0-9A-Z]{16}\b/g, replacement: "[REDACTED_AWS_KEY]" }
];

const ledger = new Map<string, { day: string; usd: number }>();

export interface SafetyEvent {
  organizationId: string;
  kind: "blocked-injection" | "blocked-cost-cap" | "blocked-disabled" | "redacted-pii";
  detail: string;
  at: string;
}

const events: SafetyEvent[] = [];
const auditSinks: ((e: SafetyEvent) => void | Promise<void>)[] = [
  (e) => {
    events.push(e);
  }
];

export function onSafetyEvent(fn: (e: SafetyEvent) => void | Promise<void>): void {
  auditSinks.push(fn);
}

export function recentSafetyEvents(): SafetyEvent[] {
  return [...events];
}

function emit(e: SafetyEvent) {
  for (const sink of auditSinks) void sink(e);
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function checkCostCap(organizationId: string, capUsd: number): boolean {
  const entry = ledger.get(organizationId);
  const day = todayUtc();
  if (!entry || entry.day !== day) return true;
  return entry.usd < capUsd;
}

function recordCost(organizationId: string, costUsd: number): void {
  const day = todayUtc();
  const entry = ledger.get(organizationId);
  if (!entry || entry.day !== day) {
    ledger.set(organizationId, { day, usd: costUsd });
  } else {
    entry.usd += costUsd;
  }
}

export function redactPii(input: string): { redacted: string; matches: string[] } {
  const matches: string[] = [];
  let out = input;
  for (const p of PII_PATTERNS) {
    out = out.replace(p.re, () => {
      matches.push(p.name);
      return p.replacement;
    });
  }
  return { redacted: out, matches };
}

export function detectInjection(input: string): string | null {
  for (const re of INJECTION_PATTERNS) {
    if (re.test(input)) return re.source;
  }
  return null;
}

export async function safeComplete<T = unknown>(req: LLMRequest): Promise<LLMResponse<T>> {
  const settings = getSettings(req.organizationId);
  const at = new Date().toISOString();

  if (!settings.llm.enabled) {
    const evt = { organizationId: req.organizationId, kind: "blocked-disabled" as const, detail: "llm disabled for org", at };
    emit(evt);
    return blocked<T>("llm disabled for organization");
  }

  if (!checkCostCap(req.organizationId, settings.llm.costCapUsd)) {
    const evt = {
      organizationId: req.organizationId,
      kind: "blocked-cost-cap" as const,
      detail: `cap=${settings.llm.costCapUsd}`,
      at
    };
    emit(evt);
    return blocked<T>("daily cost cap exceeded");
  }

  const injection = detectInjection(req.prompt);
  if (injection) {
    emit({ organizationId: req.organizationId, kind: "blocked-injection", detail: injection, at });
    return blocked<T>("prompt rejected: possible injection");
  }

  const { redacted, matches } = redactPii(req.prompt);
  if (matches.length > 0) {
    emit({ organizationId: req.organizationId, kind: "redacted-pii", detail: matches.join(","), at });
  }

  const provider = resolveLLMProvider(settings.llm.provider);
  const response = await provider.complete<T>({ ...req, prompt: redacted });

  recordCost(req.organizationId, response.costUsd);

  if (req.schema && response.text) {
    const candidate = safeJson(response.text);
    if (candidate !== undefined) {
      const parsed = req.schema.safeParse(candidate);
      if (parsed.success) {
        return { ...response, parsed: parsed.data as T };
      }
    }
  }
  return response;
}

function safeJson(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {
    return undefined;
  }
}

function blocked<T>(reason: string): LLMResponse<T> {
  return {
    text: "",
    parsed: null,
    usage: { inputTokens: 0, outputTokens: 0 },
    costUsd: 0,
    blocked: true,
    blockedReason: reason
  };
}

/** Test hook — wipe ledger and event buffer between specs. */
export function __resetSafety(): void {
  ledger.clear();
  events.length = 0;
}

/** Re-export so callers can keep imports tight. */
export type SafetySchema<T extends z.ZodTypeAny> = T;
