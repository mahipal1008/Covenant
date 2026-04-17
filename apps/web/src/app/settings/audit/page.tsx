import { AppShell } from "@/components/product/app-shell";
import { SettingsLayout } from "@/components/product/settings-layout";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { getAuditLog } from "@/lib/api";

export const dynamic = "force-dynamic";

const actionStyles: Record<string, string> = {
  auth: "bg-cobalt/10 text-cobalt",
  scan: "bg-teal/10 text-teal",
  contract: "bg-amber/15 text-amber",
  webhook: "bg-mist text-graphite",
  billing: "bg-ember/10 text-ember",
  token: "bg-cobalt/10 text-cobalt",
  team: "bg-teal/10 text-teal",
  settings: "bg-mist text-graphite",
  data: "bg-amber/15 text-amber",
  repo: "bg-teal/10 text-teal"
};

function actionPrefix(action: string) {
  return action.split(".")[0] ?? "event";
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ q?: string; action?: string }> }) {
  const sp = await searchParams;
  const { items, total } = await getAuditLog(sp);

  return (
    <AppShell active="Settings">
      <SettingsLayout active="Audit log">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Forensics</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">Audit log</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-graphite/74">
            Every privileged action across this workspace. Retained for 365 days, exportable as JSON.
          </p>
        </header>

        <form method="get" className="mb-4 flex flex-wrap items-center gap-2">
          <input
            type="search"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Search actor, action, resource…"
            className="focus-ring h-10 flex-1 min-w-[240px] rounded-panel border border-line bg-white px-3 text-sm"
          />
          <select
            name="action"
            defaultValue={sp.action ?? ""}
            className="focus-ring h-10 rounded-panel border border-line bg-white px-3 text-sm"
          >
            <option value="">All actions</option>
            <option value="auth">auth.*</option>
            <option value="scan">scan.*</option>
            <option value="contract">contract.*</option>
            <option value="billing">billing.*</option>
            <option value="token">token.*</option>
            <option value="team">team.*</option>
          </select>
          <button className="h-10 rounded-panel border border-ink bg-ink px-4 text-sm font-semibold text-white">Filter</button>
        </form>

        <Panel>
          <PanelHeader title={`${total} event${total === 1 ? "" : "s"}`} eyebrow="Most recent first" />
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-mist/40 text-left text-xs uppercase tracking-[0.14em] text-graphite/65">
                <tr>
                  <th className="px-5 py-3 font-semibold">When</th>
                  <th className="px-5 py-3 font-semibold">Actor</th>
                  <th className="px-5 py-3 font-semibold">Action</th>
                  <th className="px-5 py-3 font-semibold">Resource</th>
                  <th className="px-5 py-3 font-semibold">IP / agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((e) => (
                  <tr key={e.id}>
                    <td className="px-5 py-3 text-xs text-graphite/74">{new Date(e.at).toLocaleString()}</td>
                    <td className="px-5 py-3 font-semibold text-ink">{e.actor}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold ${actionStyles[actionPrefix(e.action)] ?? "bg-mist text-graphite"}`}>
                        {e.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-graphite">{e.resource}</td>
                    <td className="px-5 py-3 text-xs text-graphite/74">
                      <div>{e.ipAddress}</div>
                      <div className="text-[11px] text-graphite/60">{e.userAgent}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </SettingsLayout>
    </AppShell>
  );
}
