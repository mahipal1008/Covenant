import {
  AlertTriangle,
  Compass,
  GitCommit,
  GitMerge,
  History,
  LineChart,
  ListChecks,
  Network,
  Wallet
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "Intelligence - Covenant" };
export const dynamic = "force-dynamic";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000";
const headers = { "x-organization-id": "org_covenant_demo" };

async function getJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`, { headers, cache: "no-store" });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

type DecisionLog = { entries: Array<{ id: string; commitSha: string; date: string; author: string; title: string; rationale: string; riskIfRemoved: string; affectedFiles: string[] }>; counts: { critical: number; high: number } };
type Contracts = { contracts: Array<{ id: string; consumerService: string; providerService: string; expectation: string; evidence: string; status: string; lastObservedAt: string }>; counts: { verified: number; implicit: number; violated: number } };
type Trends = { trends: Array<{ capability: string; metric: string; series: { sprint: string; value: number }[]; direction: string; delta: string }>; regressing: number };
type Regressions = { regressions: Array<{ id: string; prNumber: number; title: string; contract: string; before: string; after: string; severity: string }>; openCount: number };
type TechDebt = { items: Array<{ id: string; area: string; summary: string; costHours: number; savingsHoursPerQuarter: number; paybackSprints: number; priority: string }>; totals: { costHours: number; savingsHoursPerQuarter: number; roi: number } };
type Tour = { id: string; role: string; totalMinutes: number; stops: Array<{ step: number; title: string; filePath: string; why: string; estimatedMinutes: number }> };
type PrContext = { briefs: Array<{ id: string; prNumber: number; title: string; author: string; blastRadius: string; intentChecks: { contract: string; status: string }[]; reviewers: { name: string; reason: string }[]; riskTag: string }>; highRiskCount: number };

const statusTone: Record<string, string> = {
  verified: "border-teal/25 bg-teal/10 text-teal",
  implicit: "border-amber-300/30 bg-amber-100/50 text-amber-700",
  violated: "border-rose-300/30 bg-rose-100/50 text-rose-700",
  passing: "border-teal/25 bg-teal/10 text-teal",
  warning: "border-amber-300/30 bg-amber-100/50 text-amber-700",
  improving: "border-teal/25 bg-teal/10 text-teal",
  stable: "border-line bg-mist text-graphite",
  regressing: "border-rose-300/30 bg-rose-100/50 text-rose-700",
  now: "border-rose-300/30 bg-rose-100/50 text-rose-700",
  soon: "border-amber-300/30 bg-amber-100/50 text-amber-700",
  later: "border-line bg-mist text-graphite",
  critical: "border-rose-300/30 bg-rose-100/50 text-rose-700",
  high: "border-rose-300/30 bg-rose-100/50 text-rose-700",
  medium: "border-amber-300/30 bg-amber-100/50 text-amber-700",
  low: "border-line bg-mist text-graphite"
};

function Tag({ children, status }: { children: React.ReactNode; status?: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusTone[status ?? ""] ?? "border-line bg-mist text-graphite"}`}>
      {children}
    </span>
  );
}

export default async function IntelligencePage() {
  const [decisions, contracts, trends, regressions, debt, tour, prs] = await Promise.all([
    getJson<DecisionLog>("/v1/decision-log", { entries: [], counts: { critical: 0, high: 0 } }),
    getJson<Contracts>("/v1/service-contracts", { contracts: [], counts: { verified: 0, implicit: 0, violated: 0 } }),
    getJson<Trends>("/v1/capability-trends", { trends: [], regressing: 0 }),
    getJson<Regressions>("/v1/behavioral-regressions", { regressions: [], openCount: 0 }),
    getJson<TechDebt>("/v1/tech-debt", { items: [], totals: { costHours: 0, savingsHoursPerQuarter: 0, roi: 0 } }),
    getJson<Tour>("/v1/onboarding-tour", { id: "", role: "", totalMinutes: 0, stops: [] }),
    getJson<PrContext>("/v1/pr-context", { briefs: [], highRiskCount: 0 })
  ]);

  return (
    <main className="min-h-screen">
      <SiteHeader active="Agents" />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Intelligence</p>
        <h1 className="mt-3 text-4xl font-bold text-ink sm:text-5xl">Every agent, live.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-graphite/80">
          The seven cross-cutting agents below complete the 20-agent plan. Each one is wired to a
          live API endpoint. Open the API explorer to inspect their payloads.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <article id="decision-log" className="scroll-mt-24 rounded-panel border border-line bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <History size={16} className="text-teal" />
              <h2 className="text-base font-bold text-ink">Archaeologist - Decision log</h2>
              <Tag status="critical">{decisions.counts.critical} critical</Tag>
            </div>
            <ul className="space-y-3 text-sm">
              {decisions.entries.map((e) => (
                <li key={e.id} className="rounded-panel border border-line bg-paper p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="font-mono text-xs text-graphite">{e.commitSha}</code>
                    <Tag status={e.riskIfRemoved}>{e.riskIfRemoved}</Tag>
                    <span className="text-xs text-graphite/70">{new Date(e.date).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-2 font-semibold text-ink">{e.title}</p>
                  <p className="mt-1 text-graphite/80">{e.rationale}</p>
                  <p className="mt-2 font-mono text-[11px] text-graphite/65">{e.affectedFiles.join(", ")}</p>
                </li>
              ))}
            </ul>
          </article>

          <article id="contracts" className="scroll-mt-24 rounded-panel border border-line bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Network size={16} className="text-teal" />
              <h2 className="text-base font-bold text-ink">Tribal Knowledge - Service contracts</h2>
              <Tag status="violated">{contracts.counts.violated} violated</Tag>
              <Tag status="implicit">{contracts.counts.implicit} implicit</Tag>
            </div>
            <ul className="space-y-3 text-sm">
              {contracts.contracts.map((c) => (
                <li key={c.id} className="rounded-panel border border-line bg-paper p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-ink">{c.consumerService}</span>
                    <span className="text-xs text-graphite">to</span>
                    <span className="font-mono text-xs text-ink">{c.providerService}</span>
                    <Tag status={c.status}>{c.status}</Tag>
                  </div>
                  <p className="mt-2 text-graphite/80">{c.expectation}</p>
                  <p className="mt-1 text-[11px] text-graphite/65">Evidence: {c.evidence}</p>
                </li>
              ))}
            </ul>
          </article>

          <article id="trends" className="scroll-mt-24 rounded-panel border border-line bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <LineChart size={16} className="text-teal" />
              <h2 className="text-base font-bold text-ink">Codebase Time Machine</h2>
              <Tag status="regressing">{trends.regressing} regressing</Tag>
            </div>
            <ul className="space-y-4 text-sm">
              {trends.trends.map((t) => {
                const max = Math.max(...t.series.map((s) => s.value)) || 1;
                return (
                  <li key={t.capability} className="rounded-panel border border-line bg-paper p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink">{t.capability}</span>
                        <Tag status={t.direction}>{t.direction}</Tag>
                      </div>
                      <span className="text-xs text-graphite/70">{t.delta}</span>
                    </div>
                    <div className="mt-3 flex h-12 items-end gap-1">
                      {t.series.map((s) => (
                        <div key={s.sprint} className="flex flex-1 flex-col items-center gap-1">
                          <div
                            className={`w-full rounded-sm ${t.direction === "regressing" ? "bg-rose-300/60" : t.direction === "improving" ? "bg-teal/60" : "bg-graphite/30"}`}
                            style={{ height: `${(s.value / max) * 100}%` }}
                          />
                          <span className="text-[9px] font-mono text-graphite/60">{s.sprint}</span>
                        </div>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </article>

          <article id="regressions" className="scroll-mt-24 rounded-panel border border-line bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-teal" />
              <h2 className="text-base font-bold text-ink">Behavioral Regression Detector</h2>
              <Tag status="high">{regressions.openCount} open</Tag>
            </div>
            <ul className="space-y-3 text-sm">
              {regressions.regressions.map((r) => (
                <li key={r.id} className="rounded-panel border border-line bg-paper p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-ink">PR #{r.prNumber}</span>
                    <Tag status={r.severity}>{r.severity}</Tag>
                  </div>
                  <p className="mt-2 font-semibold text-ink">{r.title}</p>
                  <p className="mt-1 text-graphite/80">Broke contract: <span className="font-medium text-ink">{r.contract}</span></p>
                  <div className="mt-2 grid gap-2 text-[11px] sm:grid-cols-2">
                    <code className="rounded-panel border border-line bg-mist px-2 py-1 text-graphite">before: {r.before}</code>
                    <code className="rounded-panel border border-rose-200 bg-rose-50 px-2 py-1 text-rose-700">after: {r.after}</code>
                  </div>
                </li>
              ))}
            </ul>
          </article>

          <article id="tech-debt" className="scroll-mt-24 rounded-panel border border-line bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Wallet size={16} className="text-teal" />
              <h2 className="text-base font-bold text-ink">Technical Debt Economist</h2>
              <Tag status="now">ROI {debt.totals.roi}x</Tag>
              <Tag>cost {debt.totals.costHours}h</Tag>
              <Tag>savings {debt.totals.savingsHoursPerQuarter}h/q</Tag>
            </div>
            <div className="overflow-hidden rounded-panel border border-line">
              <table className="w-full text-left text-xs">
                <thead className="bg-mist text-graphite">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Area</th>
                    <th className="px-3 py-2 font-semibold">Summary</th>
                    <th className="px-3 py-2 font-semibold">Cost</th>
                    <th className="px-3 py-2 font-semibold">Saves/q</th>
                    <th className="px-3 py-2 font-semibold">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {debt.items.map((i) => (
                    <tr key={i.id} className="border-t border-line">
                      <td className="px-3 py-2 font-semibold text-ink">{i.area}</td>
                      <td className="px-3 py-2 text-graphite/80">{i.summary}</td>
                      <td className="px-3 py-2 font-mono text-graphite">{i.costHours}h</td>
                      <td className="px-3 py-2 font-mono text-teal">{i.savingsHoursPerQuarter}h</td>
                      <td className="px-3 py-2"><Tag status={i.priority}>{i.priority}</Tag></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article id="tour" className="scroll-mt-24 rounded-panel border border-line bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Compass size={16} className="text-teal" />
              <h2 className="text-base font-bold text-ink">Onboarding Accelerator</h2>
              <Tag>{tour.role}</Tag>
              <Tag>~{tour.totalMinutes} min</Tag>
            </div>
            <ol className="space-y-3 text-sm">
              {tour.stops.map((s) => (
                <li key={s.step} className="flex gap-3 rounded-panel border border-line bg-paper p-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full border border-line bg-white text-xs font-bold text-ink">
                    {s.step}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink">{s.title}</span>
                      <span className="text-[11px] text-graphite/65">~{s.estimatedMinutes} min</span>
                    </div>
                    <code className="mt-1 block truncate font-mono text-[11px] text-graphite">{s.filePath}</code>
                    <p className="mt-1 text-graphite/80">{s.why}</p>
                  </div>
                </li>
              ))}
            </ol>
          </article>

          <article id="pr-context" className="scroll-mt-24 rounded-panel border border-line bg-white p-6 lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <GitMerge size={16} className="text-teal" />
              <h2 className="text-base font-bold text-ink">PR Context Enricher</h2>
              <Tag status="high">{prs.highRiskCount} high-risk PR</Tag>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {prs.briefs.map((b) => (
                <div key={b.id} className="rounded-panel border border-line bg-paper p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <GitCommit size={14} className="text-graphite" />
                    <span className="font-mono text-xs text-ink">PR #{b.prNumber}</span>
                    <Tag status={b.riskTag}>{b.riskTag}</Tag>
                  </div>
                  <p className="mt-2 font-semibold text-ink">{b.title}</p>
                  <p className="mt-1 text-xs text-graphite/70">by {b.author}</p>
                  <p className="mt-3 text-xs font-semibold text-graphite">Blast radius</p>
                  <p className="text-xs text-graphite/80">{b.blastRadius}</p>
                  <p className="mt-3 text-xs font-semibold text-graphite">Intent checks</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    {b.intentChecks.map((c) => (
                      <li key={c.contract} className="flex items-center justify-between gap-2">
                        <span className="text-graphite/80">{c.contract}</span>
                        <Tag status={c.status}>{c.status}</Tag>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs font-semibold text-graphite">Suggested reviewers</p>
                  <ul className="mt-1 space-y-1 text-xs text-graphite/80">
                    {b.reviewers.map((r) => (
                      <li key={r.name}>
                        <span className="font-semibold text-ink">{r.name}</span> - {r.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
