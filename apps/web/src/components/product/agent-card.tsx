"use client";

import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

/**
 * AgentCard — master plan §7 design.
 *
 * Compact dashboard tile rendering one Covenant agent's status:
 *   - the agent identifier and human name (A1 — Architect)
 *   - last run duration
 *   - finding count by severity (or "no findings")
 *   - state ("ok", "warn", "error")
 *
 * Uses design tokens from tokens.css so it looks correct in both themes
 * and inside Storybook without extra config.
 */

export type AgentCardSeverityCounts = {
  critical?: number;
  high?: number;
  medium?: number;
  low?: number;
};

export type AgentCardProps = {
  agentId: string;
  name: string;
  description?: string;
  state: "ok" | "warn" | "error";
  durationMs: number;
  findings: AgentCardSeverityCounts;
  icon?: ComponentType<{ size?: number; className?: string }>;
  onSelect?: () => void;
  className?: string;
};

const stateAccent: Record<AgentCardProps["state"], string> = {
  ok: "border-l-[var(--token-risk-low)]",
  warn: "border-l-[var(--token-risk-medium)]",
  error: "border-l-[var(--token-risk-high)]"
};

const stateLabel: Record<AgentCardProps["state"], string> = {
  ok: "Healthy",
  warn: "Attention",
  error: "Action required"
};

function totalFindings(counts: AgentCardSeverityCounts): number {
  return (counts.critical ?? 0) + (counts.high ?? 0) + (counts.medium ?? 0) + (counts.low ?? 0);
}

export function AgentCard({
  agentId,
  name,
  description,
  state,
  durationMs,
  findings,
  icon: Icon,
  onSelect,
  className
}: AgentCardProps) {
  const total = totalFindings(findings);
  const Wrapper = onSelect ? "button" : "div";
  const wrapperProps = onSelect
    ? { type: "button" as const, onClick: onSelect, "aria-label": `${agentId} ${name} agent details` }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        "flex w-full items-stretch gap-3 rounded-[var(--token-radius-md)] border border-[var(--token-line)] border-l-4 bg-[var(--token-surface-1)] p-4 text-left shadow-[var(--token-shadow-sm)] transition hover:shadow-[var(--token-shadow-md)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--token-teal-500)]",
        stateAccent[state],
        className
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--token-radius-sm)] bg-[var(--token-surface-2)]">
        {Icon ? <Icon size={20} className="text-[var(--token-teal-600)]" /> : (
          <span className="text-xs font-semibold text-[var(--token-graphite)]">{agentId}</span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-semibold text-[var(--token-ink)]">
            <span className="text-[var(--token-graphite)]">{agentId}</span> · {name}
          </p>
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--token-graphite)]">
            {stateLabel[state]}
          </span>
        </div>
        {description ? (
          <p className="line-clamp-2 text-xs text-[var(--token-graphite)]">{description}</p>
        ) : null}
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[var(--token-graphite)]">
          <span className="rounded-full bg-[var(--token-surface-2)] px-2 py-0.5 font-mono">
            {durationMs}ms
          </span>
          {total === 0 ? (
            <span className="rounded-full bg-[var(--token-emerald-500)]/10 px-2 py-0.5 text-[var(--token-emerald-500)]">
              No findings
            </span>
          ) : (
            <>
              {findings.critical ? (
                <Pill tone="critical" label={`${findings.critical} critical`} />
              ) : null}
              {findings.high ? <Pill tone="high" label={`${findings.high} high`} /> : null}
              {findings.medium ? <Pill tone="medium" label={`${findings.medium} medium`} /> : null}
              {findings.low ? <Pill tone="low" label={`${findings.low} low`} /> : null}
            </>
          )}
        </div>
      </div>
    </Wrapper>
  );
}

function Pill({ tone, label }: { tone: "critical" | "high" | "medium" | "low"; label: string }) {
  const palette: Record<typeof tone, { bg: string; fg: string }> = {
    critical: { bg: "bg-[var(--token-ember-500)]/12", fg: "text-[var(--token-ember-500)]" },
    high: { bg: "bg-[var(--token-amber-500)]/14", fg: "text-[var(--token-amber-500)]" },
    medium: { bg: "bg-[var(--token-cobalt-500)]/12", fg: "text-[var(--token-cobalt-500)]" },
    low: { bg: "bg-[var(--token-graphite)]/10", fg: "text-[var(--token-graphite)]" }
  };
  const { bg, fg } = palette[tone];
  return (
    <span className={cn("rounded-full px-2 py-0.5 font-medium", bg, fg)}>{label}</span>
  );
}
