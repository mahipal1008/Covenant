import { Activity, CheckCircle2, Clock3, Database, Globe2, Sparkles, Webhook } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Panel, PanelHeader } from "@/components/ui/panel";

export const metadata = {
  title: "Status - Covenant",
  description: "Live status of the Covenant API, scanner, integrations, and dashboard."
};
export const dynamic = "force-dynamic";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000";

async function probe(path: string): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now();
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
    return { ok: res.ok, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, latencyMs: Date.now() - start };
  }
}

const components = [
  { id: "api", label: "Public API", icon: Globe2, probe: "/health" },
  { id: "scanner", label: "Scanner workers", icon: Sparkles, probe: "/v1/dashboard" },
  { id: "graph", label: "Semantic graph", icon: Database, probe: "/v1/graph" },
  { id: "integrations", label: "Integrations gateway", icon: Webhook, probe: "/v1/integrations" }
];

const incidents = [
  { date: "2026-04-22", status: "Resolved", summary: "Slack digest delays of up to 4 minutes for a 38-minute window. Root cause: backpressure on the digest queue. Mitigated by autoscaling the worker pool." },
  { date: "2026-03-14", status: "Resolved", summary: "Brief 502 errors on the /v1/scans endpoint during a routine deploy. Mitigated by enabling staged rollouts." }
];

const slo = [
  { label: "API availability (30d)", value: "99.97%" },
  { label: "Scanner success rate (30d)", value: "99.91%" },
  { label: "Median scan time", value: "21s" },
  { label: "Webhook ack p95", value: "186ms" }
];

export default async function StatusPage() {
  const probes = await Promise.all(components.map((c) => probe(c.probe)));
  const allOk = probes.every((p) => p.ok);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Status</p>
          <h1 className="mt-3 text-4xl font-bold text-ink sm:text-5xl">
            {allOk ? "All systems operational." : "We are tracking an incident."}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-graphite/76">
            Live probes against the public API, scanner, graph, and integrations gateway. Updated each request.
          </p>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {components.map((component, idx) => {
            const Icon = component.icon;
            const result = probes[idx]!;
            return (
              <Panel key={component.id} className="p-5">
                <div className="flex items-center gap-3">
                  <span className={`grid size-9 place-items-center rounded-panel ${result.ok ? "bg-teal/10 text-teal" : "bg-rose-100 text-rose-700"}`}>
                    <Icon size={17} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{component.label}</p>
                    <p className="text-xs text-graphite/65">{result.ok ? "Operational" : "Degraded"}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-graphite/65">
                  <span className="inline-flex items-center gap-1"><Clock3 size={12} /> {result.latencyMs}ms</span>
                  <span className={result.ok ? "font-semibold text-teal" : "font-semibold text-rose-700"}>
                    {result.ok ? "OK" : "FAIL"}
                  </span>
                </div>
              </Panel>
            );
          })}
        </div>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Panel>
            <PanelHeader title="Service level objectives" eyebrow="Last 30 days" />
            <dl className="grid grid-cols-2 gap-0 divide-x divide-y divide-line border-t border-line">
              {slo.map((item) => (
                <div key={item.label} className="p-5">
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/55">{item.label}</dt>
                  <dd className="mt-2 text-2xl font-bold text-ink">{item.value}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel>
            <PanelHeader title="Recent incidents" eyebrow="Postmortems" />
            <ul className="divide-y divide-line">
              {incidents.map((incident) => (
                <li key={incident.date} className="px-5 py-4">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-full border border-teal/20 bg-teal/10 px-2 py-0.5 font-semibold text-teal">
                      <CheckCircle2 size={11} className="-mt-0.5 mr-1 inline" />
                      {incident.status}
                    </span>
                    <span className="font-semibold text-graphite/70">{incident.date}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-graphite/78">{incident.summary}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </section>

        <section className="mt-10 rounded-panel border border-line bg-white p-6 shadow-crisp">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Activity size={18} className="text-teal" />
              <p className="text-sm font-semibold text-ink">Subscribe to status updates by email or webhook.</p>
            </div>
            <a className="text-sm font-semibold text-ink hover:text-teal" href="/contact">Request access -&gt;</a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
