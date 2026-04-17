import { Download, FileArchive } from "lucide-react";
import { AppShell } from "@/components/product/app-shell";
import { SettingsLayout } from "@/components/product/settings-layout";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { getDataExports } from "@/lib/api";

export const dynamic = "force-dynamic";

function formatBytes(b: number | null) {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} MB`;
  return `${(b / 1024 ** 3).toFixed(2)} GB`;
}

const statusStyles: Record<string, string> = {
  ready: "bg-teal/10 text-teal",
  running: "bg-amber/15 text-amber",
  queued: "bg-mist text-graphite",
  expired: "bg-ember/10 text-ember"
};

export default async function DataPage() {
  const { items } = await getDataExports();

  return (
    <AppShell active="Settings">
      <SettingsLayout active="Data & exports">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Privacy controls</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">Data & exports</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-graphite/74">
            Request a full machine-readable export of every artefact owned by this workspace. Available for 7 days, encrypted at rest.
          </p>
        </header>

        <Panel>
          <PanelHeader
            title="Request a new export"
            eyebrow="GDPR Art. 20 / CCPA §1798.110"
            action={<Button>Request export</Button>}
          />
          <p className="px-5 py-4 text-sm leading-6 text-graphite/85">
            Includes: repositories, scans, findings, contracts, audit log, billing history, team membership, webhook configuration.
          </p>
        </Panel>

        <Panel className="mt-4">
          <PanelHeader title="History" eyebrow="Last 90 days" />
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-mist/40 text-left text-xs uppercase tracking-[0.14em] text-graphite/65">
                <tr>
                  <th className="px-5 py-3 font-semibold">Job</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Requested</th>
                  <th className="px-5 py-3 font-semibold">Size</th>
                  <th className="px-5 py-3 font-semibold sr-only">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((j) => (
                  <tr key={j.id}>
                    <td className="px-5 py-3 font-mono text-xs text-ink">
                      <span className="inline-flex items-center gap-2">
                        <FileArchive size={14} className="text-graphite/60" />
                        {j.id}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold ${statusStyles[j.status] ?? "bg-mist text-graphite"}`}>
                        {j.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-graphite/74">{new Date(j.requestedAt).toLocaleString()}</td>
                    <td className="px-5 py-3 text-graphite/74">{formatBytes(j.bytes)}</td>
                    <td className="px-5 py-3 text-right">
                      {j.status === "ready" ? (
                        <Button variant="secondary" className="h-8 px-3 text-xs">
                          <Download size={12} /> Download
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-graphite/65">
                      No exports yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel className="mt-4">
          <PanelHeader title="Retention & residency" eyebrow="Defaults" />
          <dl className="grid gap-4 px-5 py-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/65">Region</dt>
              <dd className="mt-1 text-sm font-semibold text-ink">us-east-1 (default)</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/65">Findings retention</dt>
              <dd className="mt-1 text-sm font-semibold text-ink">365 days</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/65">Audit retention</dt>
              <dd className="mt-1 text-sm font-semibold text-ink">365 days</dd>
            </div>
          </dl>
        </Panel>
      </SettingsLayout>
    </AppShell>
  );
}
