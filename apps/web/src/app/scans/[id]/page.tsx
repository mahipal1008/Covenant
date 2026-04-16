import { AlertTriangle, CheckCircle2, Code2, GitCommit, ShieldAlert, Wrench } from "lucide-react";
import { AppShell } from "@/components/product/app-shell";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { getScan } from "@/lib/api";
import { formatDate, severityTone } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ScanReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scan = await getScan(id);

  return (
    <AppShell active="Scan reports">
      <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-ember/20 bg-ember/10 text-ember">Deploy {scan.status}</Badge>
            <Badge>{scan.repositoryName}</Badge>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-ink">Multi-tenant leak report</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-graphite/74">
            Covenant analyzed {scan.filesAnalyzed} files, {scan.endpointsAnalyzed} endpoints, and {scan.queriesAnalyzed} database access points on commit {scan.commitSha}.
          </p>
        </div>
        <ButtonLink href="/repositories/new">Run another scan</ButtonLink>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Summary label="Risk score" value={String(scan.riskScore)} tone="text-ember" />
        <Summary label="Open findings" value={String(scan.findings.length)} tone="text-amber" />
        <Summary label="Branch" value={scan.branch} tone="text-cobalt" />
        <Summary label="Completed" value={formatDate(scan.completedAt)} tone="text-teal" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_0.75fr]">
        <Panel>
          <PanelHeader title="Ranked findings" eyebrow="Evidence" />
          <div className="divide-y divide-line">
            {scan.findings.map((finding) => (
              <article key={finding.id} className="px-5 py-5">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${severityTone(finding.severity)}`}>
                    {finding.severity}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/55">{finding.ruleId}</span>
                </div>
                <h2 className="text-lg font-semibold text-ink">{finding.title}</h2>
                <p className="mt-2 text-sm leading-6 text-graphite/74">{finding.summary}</p>
                <div className="mt-4 rounded-panel border border-line bg-paper p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-graphite/55">
                    <Code2 size={14} />
                    Evidence
                  </div>
                  <code className="block overflow-x-auto whitespace-pre-wrap text-sm font-semibold text-ink">{finding.evidence}</code>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-panel border border-line bg-white p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
                      <ShieldAlert size={16} className="text-ember" />
                      Impact
                    </div>
                    <p className="text-sm leading-6 text-graphite/74">{finding.impact}</p>
                  </div>
                  <div className="rounded-panel border border-line bg-white p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
                      <Wrench size={16} className="text-teal" />
                      Suggested fix
                    </div>
                    <p className="text-sm leading-6 text-graphite/74">{finding.suggestedFix}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <div className="grid gap-4">
          <Panel>
            <PanelHeader title="Exploit chain" eyebrow="Reproduction" />
            <div className="p-5">
              <ol className="space-y-3">
                {scan.findings[0]?.exploitSteps.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-white">{index + 1}</span>
                    <span className="text-sm leading-6 text-graphite/76">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Merge gate" eyebrow="CI/CD" />
            <div className="space-y-4 p-5">
              <GateRow icon={AlertTriangle} title="Critical finding present" text="Block production deploy until billing report query is tenant-scoped." />
              <GateRow icon={GitCommit} title="Commit context" text={`Commit ${scan.commitSha} on ${scan.branch} changed a protected query surface.`} />
              <GateRow icon={CheckCircle2} title="PR comment ready" text="Reviewer briefing includes affected endpoint, exploit steps, and remediation." />
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

function Summary({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <Panel className="p-5">
      <div className={`text-2xl font-bold ${tone}`}>{value}</div>
      <div className="mt-1 text-sm font-semibold text-graphite/65">{label}</div>
    </Panel>
  );
}

function GateRow({
  icon: Icon,
  title,
  text
}: {
  icon: typeof AlertTriangle;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-panel bg-mist text-ink">
        <Icon size={16} />
      </span>
      <div>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-graphite/70">{text}</p>
      </div>
    </div>
  );
}
