import { ArrowRight, Clock3, DollarSign, FileWarning, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/product/app-shell";
import { AgentCard, type AgentCardProps } from "@/components/product/agent-card";
import { FindingList } from "@/components/product/finding-list";
import { RepositoryTable } from "@/components/product/repository-table";
import { RiskGauge } from "@/components/product/risk-gauge";
import { ShipStatus } from "@/components/product/ship-status";
import { TrendChart } from "@/components/product/trend-chart";
import { ButtonLink } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { getContracts, getDashboard } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [dashboard, contracts] = await Promise.all([getDashboard(), getContracts()]);
  const latestScan = dashboard.latestScan;

  return (
    <AppShell active="Dashboard">
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Security command center</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">Tenant isolation overview</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-graphite/74">
            Latest scan completed {formatDate(latestScan.completedAt)} on commit {latestScan.commitSha}.
          </p>
        </div>
        <ButtonLink href="/repositories/new">
          Run new scan
          <ArrowRight size={16} />
        </ButtonLink>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel className="p-5">
          <RiskGauge score={dashboard.metrics.isolationScore} />
        </Panel>

        <div className="grid gap-4 sm:grid-cols-2">
          <Metric icon={FileWarning} label="Open findings" value={String(dashboard.metrics.openFindings)} tone="text-ember" />
          <Metric icon={ShieldCheck} label="Protected endpoints" value={String(dashboard.metrics.protectedEndpoints)} tone="text-teal" />
          <Metric icon={DollarSign} label="Revenue at risk" value={dashboard.metrics.revenueAtRisk} tone="text-amber" />
          <Metric icon={Clock3} label="Scans this week" value={String(dashboard.metrics.scansThisWeek)} tone="text-cobalt" />
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel>
          <PanelHeader title="Risk trend" eyebrow="Five day score" />
          <div className="px-5 pb-5">
            <TrendChart points={dashboard.riskTrend} />
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Agent activity" eyebrow="Living graph" />
          <div className="grid gap-3 p-4 md:grid-cols-2">
            {dashboard.agentActivity.map((agent) => {
              const state: AgentCardProps["state"] =
                agent.status === "active" ? "ok" : agent.confidence < 70 ? "error" : "warn";
              return (
                <AgentCard
                  key={agent.id}
                  agentId={agent.id}
                  name={agent.name}
                  description={agent.output}
                  state={state}
                  durationMs={Math.max(1, Math.round(agent.confidence * 5))}
                  findings={{ medium: agent.status === "active" ? 0 : 1 }}
                />
              );
            })}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel>
          <PanelHeader
            title="Top findings"
            eyebrow="Deploy blockers"
            action={
              <Link href="/scans/scan_latest" className="text-sm font-semibold text-ink hover:text-teal">
                Full report
              </Link>
            }
          />
          <FindingList findings={latestScan.findings.slice(0, 3)} scanId={latestScan.id} />
        </Panel>

        <Panel>
          <PanelHeader title="Intent contracts" eyebrow="Plain English controls" />
          <div className="divide-y divide-line">
            {contracts.map((contract) => (
              <div key={contract.id} className="px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-ink">{contract.name}</h3>
                  <span className="rounded-full border border-line bg-paper px-2 py-0.5 text-xs font-semibold text-graphite">{contract.status}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-graphite/74">{contract.plainEnglish}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="mt-4">
        <PanelHeader title="Repositories" eyebrow="Connected codebases" action={<ButtonLink href="/repositories/new" variant="secondary">Add repository</ButtonLink>} />
        <RepositoryTable repositories={dashboard.repositories} />
      </Panel>

      <div className="mt-4">
        <ShipStatus />
      </div>
    </AppShell>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <Panel className="p-5">
      <Icon size={18} className={tone} />
      <div className="mt-5 text-3xl font-bold text-ink">{value}</div>
      <div className="mt-1 text-sm font-semibold text-graphite/65">{label}</div>
    </Panel>
  );
}
