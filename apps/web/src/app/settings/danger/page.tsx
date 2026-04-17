import { AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/product/app-shell";
import { SettingsLayout } from "@/components/product/settings-layout";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function DangerPage() {
  return (
    <AppShell active="Settings">
      <SettingsLayout active="Danger zone">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">Irreversible</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">Danger zone</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-graphite/74">
            These actions destroy data after a 7-day soft-delete grace period. We email all admins on each step.
          </p>
        </header>

        <Panel className="border-amber/40">
          <PanelHeader title="Transfer ownership" eyebrow="Reversible" />
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <p className="max-w-xl text-sm leading-6 text-graphite/85">
              Hand the workspace to another admin. You stay as a regular member until you choose to leave.
            </p>
            <Button variant="secondary">Transfer…</Button>
          </div>
        </Panel>

        <Panel className="mt-4 border-ember/50">
          <PanelHeader title="Pause workspace" eyebrow="No new scans" />
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <p className="max-w-xl text-sm leading-6 text-graphite/85">
              Freeze scans, webhooks, and integrations while keeping data intact. Reversible at any time.
            </p>
            <Button variant="secondary">Pause workspace</Button>
          </div>
        </Panel>

        <Panel className="mt-4 border-ember">
          <PanelHeader
            title="Delete workspace"
            eyebrow="7-day grace period"
            action={<AlertTriangle size={18} className="text-ember" />}
          />
          <div className="space-y-4 px-5 py-4">
            <p className="text-sm leading-6 text-graphite/85">
              This will permanently delete every repository, scan, finding, contract, audit entry, and webhook on day 8. We email all admins each day until the timer expires.
            </p>
            <ul className="space-y-1 text-xs leading-5 text-graphite/74">
              <li>• Day 0 — soft-delete starts, all access read-only</li>
              <li>• Day 1–6 — restore available with one click</li>
              <li>• Day 7 — final warning email</li>
              <li>• Day 8 — hard delete + crypto-shredding of customer keys</li>
            </ul>
            <Button variant="danger">I understand — delete workspace</Button>
          </div>
        </Panel>
      </SettingsLayout>
    </AppShell>
  );
}
