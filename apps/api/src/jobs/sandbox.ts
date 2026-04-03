import { Script, createContext } from "node:vm";

/**
 * Restricted Node VM sandbox for scan workers — Session 4 §7.
 *
 * Scan agents that evaluate untrusted source need to run in a context
 * with no `require`, no global `process`, no fs, and no net access.
 * Node's `vm` module gives us isolation at the language level; we
 * couple it with a frozen, minimal global to prevent prototype-chain
 * escapes for typical regex/AST workloads.
 *
 * NOT a security boundary against malicious WASM or native modules;
 * for those we still need a separate process under seccomp/firejail.
 * Documented in `docs/runbooks/sandboxing.md`.
 */

export interface SandboxOptions {
  /** Wall-clock timeout in ms. Defaults to 1000. */
  timeoutMs?: number;
  /** Globals to expose into the sandbox (frozen before injection). */
  globals?: Record<string, unknown>;
}

export function runInSandbox<T = unknown>(source: string, options: SandboxOptions = {}): T {
  const baseGlobals: Record<string, unknown> = {
    console: { log: () => undefined, warn: () => undefined, error: () => undefined },
    Math,
    Date,
    JSON,
    RegExp,
    String,
    Number,
    Boolean,
    Array,
    Object,
    Error
  };
  const ctx = createContext(Object.freeze({ ...baseGlobals, ...(options.globals ?? {}) }));
  const script = new Script(source, { filename: "sandbox.js" });
  return script.runInContext(ctx, { timeout: options.timeoutMs ?? 1000 }) as T;
}
