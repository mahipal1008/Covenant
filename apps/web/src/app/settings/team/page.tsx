import { Crown, Mail, Plus, Shield, User } from "lucide-react";
import { AppShell } from "@/components/product/app-shell";
import { SettingsLayout } from "@/components/product/settings-layout";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const team = [
  { name: "Anika Mehta", email: "anika@northwind.dev", role: "Owner", lastActive: "Active now", icon: Crown },
  { name: "Marco Dias", email: "marco@lumen.health", role: "Admin", lastActive: "12 min ago", icon: Shield },
  { name: "Devika Rao", email: "devika@fieldops.io", role: "Engineer", lastActive: "1 h ago", icon: User },
  { name: "Hiro Tanaka", email: "hiro@covenant.dev", role: "Viewer", lastActive: "Yesterday", icon: User }
];

const pending = [
  { email: "rachel@northwind.dev", role: "Engineer", invitedAt: "2 hours ago" },
  { email: "compliance@northwind.dev", role: "Viewer", invitedAt: "Yesterday" }
];

export default function TeamPage() {
  return (
    <AppShell active="Settings">
      <SettingsLayout active="Team">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Workspace</p>
            <h1 className="mt-2 text-3xl font-bold text-ink">Team & seats</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-graphite/74">
              4 of 8 seats used. Roles map directly to scan and contract permissions.
            </p>
          </div>
          <Button>
            <Plus size={14} /> Invite teammate
          </Button>
        </header>

        <Panel>
          <PanelHeader title="Members" eyebrow="Active" />
          <ul className="divide-y divide-line">
            {team.map((m) => {
              const Icon = m.icon;
              return (
                <li key={m.email} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-mist text-ink">
                      <Icon size={15} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-ink">{m.name}</div>
                      <div className="text-xs text-graphite/65">{m.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-mist px-2.5 py-1 text-xs font-semibold text-graphite">{m.role}</span>
                    <span className="hidden text-xs text-graphite/65 sm:block">{m.lastActive}</span>
                    <Button variant="secondary" className="h-8 px-3 text-xs">
                      Manage
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel className="mt-4">
          <PanelHeader title="Pending invitations" eyebrow={`${pending.length} outstanding`} />
          <ul className="divide-y divide-line">
            {pending.map((p) => (
              <li key={p.email} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="flex items-center gap-3">
                  <Mail size={15} className="text-graphite/60" />
                  <div>
                    <div className="text-sm font-semibold text-ink">{p.email}</div>
                    <div className="text-xs text-graphite/65">Invited {p.invitedAt} as {p.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" className="h-8 px-3 text-xs">Resend</Button>
                  <Button variant="ghost" className="h-8 px-3 text-xs">Revoke</Button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </SettingsLayout>
    </AppShell>
  );
}
