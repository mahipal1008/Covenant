import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { demoAgents, type AgentDefinition } from "@covenant/shared";
import { CheckCircle2, CircleDot, Clock } from "lucide-react";

export const metadata = { title: "Agents - Covenant" };

const layerOrder = ["Understanding", "Documentation", "Security", "Intent", "Compliance", "Economics", "Team"] as const;

const statusTone: Record<AgentDefinition["status"], { label: string; classes: string; icon: typeof CheckCircle2 }> = {
  live: { label: "Live", classes: "bg-teal/10 text-teal", icon: CheckCircle2 },
  beta: { label: "Beta", classes: "bg-amber/10 text-amber", icon: CircleDot },
  planned: { label: "Planned", classes: "bg-mist text-graphite/74", icon: Clock }
};

const liveSurface: Record<number, { href: string; label: string }> = {
  2: { href: "/intelligence#decision-log", label: "Open decision log" },
  3: { href: "/intelligence#contracts", label: "Open service contracts" },
  15: { href: "/intelligence#trends", label: "Open time machine" },
  16: { href: "/intelligence#regressions", label: "Open regression report" },
  17: { href: "/intelligence#tech-debt", label: "Open debt economist" },
  19: { href: "/intelligence#tour", label: "Open onboarding tour" },
  20: { href: "/intelligence#pr-context", label: "Open PR briefs" }
};

export default function AgentsPage() {
  const grouped = layerOrder.map((layer) => ({
    layer,
    agents: demoAgents.filter((a) => a.layer === layer)
  }));
  const counts = {
    live: demoAgents.filter((a) => a.status === "live").length,
    beta: demoAgents.filter((a) => a.status === "beta").length,
    planned: demoAgents.filter((a) => a.status === "planned").length
  };

  return (
    <main className="min-h-screen">
      <SiteHeader active="Agents" />

      <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Agents</p>
        <h1 className="mt-3 text-4xl font-bold text-ink sm:text-6xl">20 agents. One brain.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-graphite/76">
          Covenant is composed of 20 agents across 6 layers. Each one runs on every commit. Together
          they form a living intelligence layer your codebase grows into.
        </p>
        <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-line bg-white px-5 py-2 text-xs font-semibold text-graphite">
          <span className="text-teal">{counts.live} live</span>
          <span className="text-graphite/35">|</span>
          <span className="text-amber">{counts.beta} beta</span>
          <span className="text-graphite/35">|</span>
          <span className="text-graphite/74">{counts.planned} planned</span>
        </div>
        <div className="mt-6">
          <a
            href="/intelligence"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-ink px-5 py-2 text-xs font-semibold text-white hover:bg-graphite"
          >
            Explore the live intelligence surfaces -&gt;
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {grouped.map((group) => (
            <div key={group.layer}>
              <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-graphite/65">Layer {layerOrder.indexOf(group.layer) + 1} - {group.layer}</h2>
              <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.agents.map((agent) => {
                  const tone = statusTone[agent.status];
                  const Icon = tone.icon;
                  return (
                    <article key={agent.id} className="rounded-panel border border-line bg-white p-5 shadow-crisp">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-[0.14em] text-graphite/55">Agent {agent.number}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${tone.classes}`}>
                          <Icon size={10} />
                          {tone.label}
                        </span>
                      </div>
                      <h3 className="mt-2 text-base font-semibold text-ink">{agent.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-graphite/74">{agent.oneLine}</p>
                      <p className="mt-3 rounded-panel border border-line bg-paper px-3 py-2 text-xs leading-5 text-graphite">{agent.output}</p>
                      {liveSurface[agent.number] ? (
                        <a
                          href={liveSurface[agent.number]!.href}
                          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal hover:underline"
                        >
                          {liveSurface[agent.number]!.label} -&gt;
                        </a>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
