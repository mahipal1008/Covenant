import {
  ArrowUpRight,
  Bell,
  CreditCard,
  Database,
  KeyRound,
  ScrollText,
  Trash2,
  Users,
  Webhook
} from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/product/app-shell";
import { SettingsLayout } from "@/components/product/settings-layout";

export const dynamic = "force-dynamic";

const cards = [
  { href: "/settings/billing", title: "Billing & usage", desc: "Plan, invoices, metered limits, trial status.", icon: CreditCard },
  { href: "/settings/team", title: "Team", desc: "Invite teammates, set roles, manage seats.", icon: Users },
  { href: "/settings/tokens", title: "API tokens", desc: "Issue scoped tokens for CI and integrations.", icon: KeyRound },
  { href: "/settings/webhooks", title: "Webhooks", desc: "Stream scan + finding events to your stack.", icon: Webhook },
  { href: "/settings/notifications", title: "Notifications", desc: "Per-event channel routing.", icon: Bell },
  { href: "/settings/audit", title: "Audit log", desc: "Every privileged action, every time.", icon: ScrollText },
  { href: "/settings/data", title: "Data & exports", desc: "GDPR export, retention, residency.", icon: Database },
  { href: "/settings/danger", title: "Danger zone", desc: "Transfer ownership, delete the workspace.", icon: Trash2 }
];

export default function SettingsIndex() {
  return (
    <AppShell active="Settings">
      <SettingsLayout active="Overview">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Workspace settings</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">Northwind Robotics</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-graphite/74">
            Everything that controls how your tenants, AI guardrails, and humans interact with Covenant.
          </p>
        </header>
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map(({ href, title, desc, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="focus-ring group flex items-start gap-3 rounded-panel border border-line bg-white p-4 transition hover:-translate-y-0.5 hover:border-graphite/35 hover:shadow-crisp"
            >
              <div className="grid h-9 w-9 flex-none place-items-center rounded-panel bg-mist text-ink">
                <Icon size={16} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                  {title}
                  <ArrowUpRight size={14} className="opacity-0 transition group-hover:opacity-100" />
                </div>
                <p className="mt-1 text-xs leading-5 text-graphite/74">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </SettingsLayout>
    </AppShell>
  );
}
