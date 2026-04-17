import { CheckCircle2, XCircle } from "lucide-react";
import { AppShell } from "@/components/product/app-shell";
import { SettingsLayout } from "@/components/product/settings-layout";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { getWebhookDeliveries, getWebhookSubs } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function WebhooksPage() {
  const [{ items: subs, events }, { items: deliveries }] = await Promise.all([
    getWebhookSubs(),
    getWebhookDeliveries()
  ]);

  return (
    <AppShell active="Settings">
      <SettingsLayout active="Webhooks">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Outbound integrations</p>
            <h1 className="mt-2 text-3xl font-bold text-ink">Webhooks</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-graphite/74">
              Each delivery is signed with HMAC-SHA256. We retry with exponential backoff up to 24h.
            </p>
          </div>
          <Button>+ New subscription</Button>
        </header>

        <Panel>
          <PanelHeader title="Subscriptions" eyebrow={`${subs.length} active`} />
          <div className="divide-y divide-line">
            {subs.map((sub) => (
              <div key={sub.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono text-sm text-ink">{sub.url}</div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {sub.events.map((e) => (
                      <span key={e} className="rounded-full bg-mist px-2 py-0.5 text-[11px] font-semibold text-graphite">
                        {e}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-graphite/65">
                    Signing secret prefix: <span className="font-mono">{sub.secretPrefix}…</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold ${sub.active ? "bg-teal/10 text-teal" : "bg-mist text-graphite"}`}>
                    {sub.active ? "Active" : "Paused"}
                  </span>
                  <Button variant="secondary" className="h-8 px-3 text-xs">Test</Button>
                  <Button variant="secondary" className="h-8 px-3 text-xs">Revoke</Button>
                </div>
              </div>
            ))}
            {subs.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-graphite/65">No subscriptions yet.</div>
            ) : null}
          </div>
        </Panel>

        <Panel className="mt-4">
          <PanelHeader title="Recent deliveries" eyebrow="Last 50 attempts" />
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-mist/40 text-left text-xs uppercase tracking-[0.14em] text-graphite/65">
                <tr>
                  <th className="px-5 py-3 font-semibold">Event</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Code</th>
                  <th className="px-5 py-3 font-semibold">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {deliveries.map((d) => (
                  <tr key={d.id}>
                    <td className="px-5 py-3 font-mono text-xs text-ink">{d.event}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${d.status === "delivered" ? "text-teal" : "text-ember"}`}>
                        {d.status === "delivered" ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        {d.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-graphite">{d.responseCode}</td>
                    <td className="px-5 py-3 text-graphite/74">{new Date(d.attemptedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel className="mt-4">
          <PanelHeader title="Available events" eyebrow="Subscribe to any" />
          <div className="flex flex-wrap gap-1.5 px-5 py-4">
            {events.map((e) => (
              <span key={e} className="rounded-full border border-line bg-paper px-2.5 py-1 text-xs font-semibold text-graphite">
                {e}
              </span>
            ))}
          </div>
        </Panel>
      </SettingsLayout>
    </AppShell>
  );
}
