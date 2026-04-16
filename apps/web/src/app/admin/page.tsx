import { AlertOctagon, Building2, DollarSign, ShieldCheck, UserCog, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/components/product/app-shell";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const orgs = [
  { id: "org_northwind", name: "Northwind Robotics", plan: "Scale", mrr: 4900, seats: 12, status: "active", signedUp: "Nov 2025" },
  { id: "org_lumen", name: "Lumen Health", plan: "Scale", mrr: 4900, seats: 8, status: "active", signedUp: "Oct 2025" },
  { id: "org_fieldops", name: "FieldOps", plan: "Startup", mrr: 990, seats: 4, status: "trial", signedUp: "Jan 2026" },
  { id: "org_covenant_demo", name: "Covenant demo", plan: "Internal", mrr: 0, seats: 6, status: "active", signedUp: "Aug 2025" }
];

const featureFlags = [
  { key: "byo_llm", label: "BYO LLM keys", on: ["org_northwind"] },
  { key: "scim", label: "SCIM provisioning", on: ["org_northwind", "org_lumen"] },
  { key: "regional_eu", label: "EU residency", on: ["org_lumen"] },
  { key: "white_label", label: "White-label PDFs", on: [] }
];

const supportTickets = [
  { id: "tic_812", org: "Lumen Health", subject: "SCIM mapping for nested groups", priority: "P1", at: "9 min ago" },
  { id: "tic_811", org: "Northwind Robotics", subject: "Stripe invoice missing tax ID", priority: "P3", at: "2 h ago" },
  { id: "tic_810", org: "FieldOps", subject: "Webhook 502 on scan.completed", priority: "P2", at: "yesterday" }
];

const priorityStyles: Record<string, string> = {
  P1: "bg-ember/10 text-ember",
  P2: "bg-amber/15 text-amber",
  P3: "bg-mist text-graphite"
};

const totalMrr = orgs.reduce((acc, o) => acc + o.mrr, 0);

export default function AdminPage() {
  return (
    <AppShell active="Admin">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">Staff only</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">Super-admin console</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-graphite/74">
          Internal-only. Every action emits an audit row to the customer’s log with the impersonating staff identity.
        </p>
      </header>

      <div className="grid gap-3 lg:grid-cols-4">
        <Stat icon={Building2} label="Active orgs" value={`${orgs.filter((o) => o.status === "active").length}`} />
        <Stat icon={Users} label="Seats sold" value={String(orgs.reduce((a, o) => a + o.seats, 0))} />
        <Stat icon={DollarSign} label="Monthly recurring" value={`$${(totalMrr / 100).toLocaleString()}`} />
        <Stat icon={AlertOctagon} label="Open P1 tickets" value="1" />
      </div>

      <Panel className="mt-4">
        <PanelHeader title="Organisations" eyebrow="Cross-tenant view" action={<Button variant="secondary">Export CSV</Button>} />
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-sm">
            <thead className="bg-mist/40 text-left text-xs uppercase tracking-[0.14em] text-graphite/65">
              <tr>
                <th className="px-5 py-3 font-semibold">Org</th>
                <th className="px-5 py-3 font-semibold">Plan</th>
                <th className="px-5 py-3 font-semibold">MRR</th>
                <th className="px-5 py-3 font-semibold">Seats</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
                <th className="px-5 py-3 font-semibold sr-only">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orgs.map((o) => (
                <tr key={o.id}>
                  <td className="px-5 py-3 font-semibold text-ink">{o.name}</td>
                  <td className="px-5 py-3 text-graphite/85">{o.plan}</td>
                  <td className="px-5 py-3 text-graphite/85">${(o.mrr / 100).toLocaleString()}</td>
                  <td className="px-5 py-3 text-graphite/85">{o.seats}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold ${o.status === "active" ? "bg-teal/10 text-teal" : "bg-amber/15 text-amber"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-graphite/74">{o.signedUp}</td>
                  <td className="px-5 py-3 text-right">
                    <Button variant="secondary" className="h-8 px-3 text-xs">
                      <UserCog size={12} /> Impersonate
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Feature flags" eyebrow="Per-org overrides" />
          <ul className="divide-y divide-line">
            {featureFlags.map((f) => (
              <li key={f.key} className="flex items-center justify-between gap-3 px-5 py-3">
                <div>
                  <div className="text-sm font-semibold text-ink">{f.label}</div>
                  <div className="font-mono text-xs text-graphite/65">{f.key}</div>
                </div>
                <span className="text-xs text-graphite/85">
                  {f.on.length === 0 ? "no orgs" : `${f.on.length} org${f.on.length > 1 ? "s" : ""} on`}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <PanelHeader title="Support inbox" eyebrow="Open tickets" />
          <ul className="divide-y divide-line">
            {supportTickets.map((t) => (
              <li key={t.id} className="flex items-start justify-between gap-3 px-5 py-3">
                <div>
                  <div className="text-sm font-semibold text-ink">{t.subject}</div>
                  <div className="text-xs text-graphite/65">
                    {t.org} · {t.id} · {t.at}
                  </div>
                </div>
                <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold ${priorityStyles[t.priority] ?? "bg-mist text-graphite"}`}>
                  {t.priority}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel className="mt-4 border-amber/40">
        <PanelHeader title="Impersonation safety" eyebrow="Always audited" action={<ShieldCheck size={16} className="text-teal" />} />
        <ul className="space-y-1 px-5 py-4 text-sm leading-6 text-graphite/85">
          <li>• Impersonation creates a yellow banner inside the customer dashboard while active.</li>
          <li>• A row is written to the customer audit log: <span className="font-mono text-xs">staff.impersonation.start/end</span>.</li>
          <li>• Maximum session length: 30 minutes; auto-extended only with an open P1 ticket.</li>
          <li>• Read-only impersonation by default; write access requires a second staff approval.</li>
        </ul>
      </Panel>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-panel border border-line bg-white p-4 shadow-crisp">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-graphite/65">
        <Icon size={14} /> {label}
      </div>
      <div className="mt-2 text-2xl font-bold text-ink">{value}</div>
    </div>
  );
}
