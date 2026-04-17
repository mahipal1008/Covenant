import { KeyRound, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/product/app-shell";
import { SettingsLayout } from "@/components/product/settings-layout";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { getTokens } from "@/lib/api";

export const dynamic = "force-dynamic";

const scopeStyles: Record<string, string> = {
  read: "bg-mist text-ink",
  write: "bg-teal/10 text-teal",
  admin: "bg-ember/10 text-ember"
};

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString();
}

export default async function TokensPage() {
  const { items } = await getTokens();

  return (
    <AppShell active="Settings">
      <SettingsLayout active="API tokens">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Programmatic access</p>
            <h1 className="mt-2 text-3xl font-bold text-ink">API tokens</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-graphite/74">
              Tokens are stored as SHA-256 hashes — the plaintext is shown once at creation. Rotate at least every 90 days.
            </p>
          </div>
          <Button>+ Issue token</Button>
        </header>

        <Panel>
          <PanelHeader
            title={`${items.length} active token${items.length === 1 ? "" : "s"}`}
            eyebrow="Hashed at rest"
            action={
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-graphite">
                <ShieldCheck size={14} className="text-teal" />
                Last rotated audit: 14 days ago
              </span>
            }
          />
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-mist/40 text-left text-xs uppercase tracking-[0.14em] text-graphite/65">
                <tr>
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Scope</th>
                  <th className="px-5 py-3 font-semibold">Prefix</th>
                  <th className="px-5 py-3 font-semibold">Created</th>
                  <th className="px-5 py-3 font-semibold">Last used</th>
                  <th className="px-5 py-3 font-semibold sr-only">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((token) => (
                  <tr key={token.id} className="text-ink">
                    <td className="px-5 py-3 font-semibold">
                      <span className="inline-flex items-center gap-2">
                        <KeyRound size={14} className="text-graphite/60" />
                        {token.name}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold ${scopeStyles[token.scope] ?? "bg-mist text-ink"}`}>
                        {token.scope}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-graphite">{token.prefix}…</td>
                    <td className="px-5 py-3 text-graphite/74">{formatDate(token.createdAt)}</td>
                    <td className="px-5 py-3 text-graphite/74">{formatDate(token.lastUsedAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <Button variant="secondary" className="h-8 px-3 text-xs">Revoke</Button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-graphite/65">
                      No tokens yet. Issue one to authenticate CI or your CLI.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel className="mt-4">
          <PanelHeader title="Best practices" eyebrow="Hardening" />
          <ul className="space-y-2 px-5 py-4 text-sm leading-6 text-graphite/85">
            <li>• Use <code className="rounded bg-mist px-1.5 py-0.5 text-xs">read</code> tokens for dashboards and reporting.</li>
            <li>• Use <code className="rounded bg-mist px-1.5 py-0.5 text-xs">write</code> tokens for CI runners that post scan triggers.</li>
            <li>• Reserve <code className="rounded bg-mist px-1.5 py-0.5 text-xs">admin</code> tokens for break-glass automation only.</li>
            <li>• Tokens never appear in logs — only their prefix is recorded.</li>
          </ul>
        </Panel>
      </SettingsLayout>
    </AppShell>
  );
}
