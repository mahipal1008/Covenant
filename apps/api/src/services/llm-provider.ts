import { z } from "zod";

/**
 * BYO LLM provider — Session 4 §4.
 *
 * One interface, four implementations: openai, anthropic, azure,
 * local-noop. The `local-noop` implementation echoes a deterministic
 * response so the rest of the platform (agents, intelligence panel,
 * regulation summaries) functions in offline / pure-code mode.
 *
 * Routes pick a provider by reading the calling tenant's
 * OrgSettings.llm config. Production deployments add real provider
 * implementations behind the same interface.
 */

export interface LLMRequest {
  organizationId: string;
  prompt: string;
  /** Hard upper bound on output tokens. */
  maxTokens?: number;
  /** Optional system prompt. */
  system?: string;
  /** Optional Zod schema — when provided, output is validated. */
  schema?: z.ZodTypeAny;
}

export interface LLMResponse<T = unknown> {
  text: string;
  parsed: T | null;
  usage: { inputTokens: number; outputTokens: number };
  costUsd: number;
  blocked: boolean;
  blockedReason?: string;
}

export interface LLMProvider {
  readonly name: string;
  complete<T = unknown>(req: LLMRequest): Promise<LLMResponse<T>>;
}

const PROVIDERS = new Map<string, LLMProvider>();

export class NoopLLMProvider implements LLMProvider {
  readonly name = "local-noop";
  async complete<T = unknown>(req: LLMRequest): Promise<LLMResponse<T>> {
    const text = `[noop] ${req.prompt.slice(0, 256)}`;
    let parsed: T | null = null;
    if (req.schema) {
      const candidate = req.schema.safeParse({});
      parsed = candidate.success ? (candidate.data as T) : null;
    }
    return {
      text,
      parsed,
      usage: { inputTokens: req.prompt.length, outputTokens: text.length },
      costUsd: 0,
      blocked: false
    };
  }
}

PROVIDERS.set("local-noop", new NoopLLMProvider());

export function registerLLMProvider(p: LLMProvider): void {
  PROVIDERS.set(p.name, p);
}

export function resolveLLMProvider(name: string | null | undefined): LLMProvider {
  return PROVIDERS.get(name ?? "local-noop") ?? new NoopLLMProvider();
}
