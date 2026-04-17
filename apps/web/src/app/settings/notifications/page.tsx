import { Check } from "lucide-react";
import { AppShell } from "@/components/product/app-shell";
import { SettingsLayout } from "@/components/product/settings-layout";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { getNotificationPreferences } from "@/lib/api";

export const dynamic = "force-dynamic";

const channels = [
  { key: "email", label: "Email" },
  { key: "slack", label: "Slack" },
  { key: "in_app", label: "In-app" }
];

export default async function NotificationsPage() {
  const { events, prefs } = await getNotificationPreferences();

  return (
    <AppShell active="Settings">
      <SettingsLayout active="Notifications">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Routing</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">Notifications</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-graphite/74">
            Choose where each event goes. Slack and email respect quiet hours; in-app is always on.
          </p>
        </header>

        <Panel>
          <PanelHeader title="Per-event delivery" eyebrow="Workspace defaults" action={<Button variant="secondary">Save preferences</Button>} />
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-mist/40 text-left text-xs uppercase tracking-[0.14em] text-graphite/65">
                <tr>
                  <th className="px-5 py-3 font-semibold">Event</th>
                  {channels.map((c) => (
                    <th key={c.key} className="px-5 py-3 text-center font-semibold">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {events.map((event) => (
                  <tr key={event}>
                    <td className="px-5 py-3 font-mono text-xs text-ink">{event}</td>
                    {channels.map((c) => {
                      const enabled = prefs[event]?.[c.key] ?? false;
                      return (
                        <td key={c.key} className="px-5 py-3 text-center">
                          <label className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-line bg-white">
                            <input type="checkbox" defaultChecked={enabled} className="peer sr-only" />
                            <span aria-hidden className={`grid h-5 w-5 place-items-center rounded ${enabled ? "bg-ink text-white" : "bg-mist text-transparent"}`}>
                              <Check size={12} />
                            </span>
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel className="mt-4">
          <PanelHeader title="Quiet hours" eyebrow="Workspace-wide" />
          <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-ink">
              Start
              <input type="time" defaultValue="22:00" className="focus-ring mt-1.5 block h-10 w-full rounded-panel border border-line bg-white px-3 text-sm font-normal" />
            </label>
            <label className="text-sm font-semibold text-ink">
              End
              <input type="time" defaultValue="07:00" className="focus-ring mt-1.5 block h-10 w-full rounded-panel border border-line bg-white px-3 text-sm font-normal" />
            </label>
          </div>
        </Panel>
      </SettingsLayout>
    </AppShell>
  );
}
