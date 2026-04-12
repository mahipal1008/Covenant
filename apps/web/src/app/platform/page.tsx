import { Activity, GitBranch, Layers, Network, Shield, Webhook } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "Platform - Covenant" };
export const dynamic = "force-dynamic";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000";
const headers = { "x-organization-id": "org_covenant_demo" };

async function getJson<T>(path: string, fallback: T, init: RequestInit = {}): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`, { ...init, headers: { ...headers, ...(init.headers ?? {}) }, cache: "no-store" });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

type GraphResponse = {
  graph: {
    generatedAt: string;
    nodes: { id: string; kind: string; label: string; layer: string; riskScore: number }[];
    edges: { id: string; from: string; to: string; kind: string; label?: string }[];
  };
  counts: { nodes: number; edges: number; highRiskNodes: number };
};

type Digest = {
  channel: string;
  title: string;
  blocks: { kind: string; text: string }[];
};

type GateDecision = {
  prNumber: number;
  decision: "allow" | "warn" | "block";
  rationale: string;
  failingChecks: { name: string; severity: string; message: string }[];
  passingChecks: string[];
};

const kindTone: Record<string, string> = {
  route: "border-rose-200 bg-rose-50 text-rose-700",
  service: "border-cobalt/30 bg-cobalt/10 text-cobalt",
  model: "border-teal/30 bg-teal/10 text-teal",
  tenant_boundary: "border-amber-300/40 bg-amber-100/60 text-amber-700",
  external: "border-line bg-mist text-graphite"
};

const decisionTone: Record<string, string> = {
  allow: "border-teal/30 bg-teal/10 text-teal",
  warn: "border-amber-300/40 bg-amber-100/60 text-amber-700",
  block: "border-rose-300/40 bg-rose-100/60 text-rose-700"
};

function laneFor(kind: string): number {
  if (kind === "route") return 0;
  if (kind === "service") return 1;
  if (kind === "model") return 2;
  if (kind === "tenant_boundary") return 3;
  return 4;
}

export default async function PlatformPage() {
  const [graph, digest, gate] = await Promise.all([
    getJson<GraphResponse>("/v1/graph", { graph: { generatedAt: "", nodes: [], edges: [] }, counts: { nodes: 0, edges: 0, highRiskNodes: 0 } }),
    getJson<Digest>("/v1/integrations/slack/digest", { channel: "", title: "", blocks: [] }, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ channel: "#covenant-alerts", scope: "security" })
    }),
    getJson<GateDecision>("/v1/pr-checks", { prNumber: 0, decision: "allow", rationale: "", failingChecks: [], passingChecks: [] }, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prNumber: 284, title: "Refactor list endpoints", changedFiles: ["src/routes/list.ts"] })
    })
  ]);

  const lanes = ["Routes", "Services", "Models", "Tenant boundary", "External"];
  const lanedNodes = lanes.map((_, i) => graph.graph.nodes.filter((n) => laneFor(n.kind) === i));

  return (
    <main className="min-h-screen">
      <SiteHeader active="Platform" />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Platform</p>
        <h1 className="mt-3 text-4xl font-bold text-ink sm:text-5xl">The semantic core.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-graphite/80">
          Every push updates the living graph. Every PR runs through the merge gate. Every digest is
          composed from the same source of truth that powers the 20 agents.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Stat icon={Layers} label="Graph nodes" value={String(graph.counts.nodes)} />
          <Stat icon={GitBranch} label="Graph edges" value={String(graph.counts.edges)} />
          <Stat icon={Shield} label="High-risk nodes" value={String(graph.counts.highRiskNodes)} tone="text-rose-600" />
        </div>

        <article className="mt-10 rounded-panel border border-line bg-white p-6">
          <header className="mb-4 flex items-center gap-2">
            <Network size={16} className="text-teal" />
            <h2 className="text-base font-bold text-ink">Living dependency graph</h2>
            <span className="ml-auto text-xs text-graphite/65">
              Generated {graph.graph.generatedAt ? new Date(graph.graph.generatedAt).toLocaleString() : "-"}
            </span>
          </header>
          <div className="grid gap-3 lg:grid-cols-5">
            {lanes.map((lane, i) => (
              <div key={lane} className="rounded-panel border border-line bg-paper p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-graphite/60">{lane}</p>
                <ul className="mt-2 space-y-2">
                  {lanedNodes[i]!.map((node) => (
                    <li
                      key={node.id}
                      className={`rounded-panel border px-3 py-2 text-xs ${kindTone[node.kind] ?? "border-line bg-mist text-graphite"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{node.label}</span>
                        <span className="font-mono text-[10px] opacity-80">{node.riskScore}</span>
                      </div>
                      <span className="mt-1 block text-[10px] uppercase tracking-wide opacity-70">{node.layer}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <details className="mt-4 rounded-panel border border-line bg-paper p-3 text-xs">
            <summary className="cursor-pointer font-semibold text-ink">Edges ({graph.graph.edges.length})</summary>
            <ul className="mt-3 grid gap-1 sm:grid-cols-2">
              {graph.graph.edges.map((e) => (
                <li key={e.id} className="font-mono text-[11px] text-graphite">
                  {e.from} <span className="text-teal">--{e.kind}--&gt;</span> {e.to}
                  {e.label ? <span className="text-graphite/60"> ({e.label})</span> : null}
                </li>
              ))}
            </ul>
          </details>
        </article>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <article className="rounded-panel border border-line bg-white p-6">
            <header className="mb-4 flex items-center gap-2">
              <Webhook size={16} className="text-teal" />
              <h2 className="text-base font-bold text-ink">GitHub webhook + CI/CD merge gate</h2>
            </header>
            <p className="text-xs text-graphite/70">
              POST <code className="font-mono text-ink">/v1/integrations/github/webhook</code> on every
              push. POST <code className="font-mono text-ink">/v1/pr-checks</code> from your CI to gate
              merges.
            </p>
            <div className="mt-4 rounded-panel border border-line bg-paper p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-graphite">PR #{gate.prNumber}</span>
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${decisionTone[gate.decision]}`}>
                  {gate.decision}
                </span>
              </div>
              <p className="mt-2 text-graphite/85">{gate.rationale}</p>
              {gate.failingChecks.length > 0 ? (
                <ul className="mt-3 space-y-1 text-xs">
                  {gate.failingChecks.map((c) => (
                    <li key={c.name} className="rounded-panel border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
                      <span className="font-semibold">{c.name}</span>
                      <span className="ml-2 text-[10px] uppercase">{c.severity}</span>
                      <p className="mt-1 text-rose-700/85">{c.message}</p>
                    </li>
                  ))}
                </ul>
              ) : null}
              {gate.passingChecks.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-graphite">
                  {gate.passingChecks.map((p) => (
                    <li key={p} className="text-teal">+ {p}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </article>

          <article className="rounded-panel border border-line bg-white p-6">
            <header className="mb-4 flex items-center gap-2">
              <Activity size={16} className="text-teal" />
              <h2 className="text-base font-bold text-ink">Slack / email digest preview</h2>
            </header>
            <p className="text-xs text-graphite/70">
              POST <code className="font-mono text-ink">/v1/integrations/slack/digest</code> to preview
              the digest before scheduling delivery.
            </p>
            <div className="mt-4 rounded-panel border border-line bg-paper p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-line bg-white px-2 py-0.5 font-mono text-[10px] text-graphite">{digest.channel}</span>
                <span className="font-semibold text-ink">{digest.title}</span>
              </div>
              <ul className="mt-3 space-y-2">
                {digest.blocks.map((b, i) => (
                  <li
                    key={i}
                    className={`rounded-panel border border-line bg-white px-3 py-2 text-xs ${b.kind === "header" ? "font-bold text-ink" : b.kind === "context" ? "italic text-graphite/65" : "text-graphite/85"}`}
                  >
                    {b.text}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Activity; label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-panel border border-line bg-white p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-graphite/65">
        <Icon size={14} />
        {label}
      </div>
      <p className={`mt-2 text-2xl font-bold ${tone ?? "text-ink"}`}>{value}</p>
    </div>
  );
}
