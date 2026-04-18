import {
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
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/settings", label: "Overview", icon: Database, exact: true },
  { href: "/settings/billing", label: "Billing & usage", icon: CreditCard },
  { href: "/settings/team", label: "Team", icon: Users },
  { href: "/settings/tokens", label: "API tokens", icon: KeyRound },
  { href: "/settings/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/settings/audit", label: "Audit log", icon: ScrollText },
  { href: "/settings/data", label: "Data & exports", icon: Database },
  { href: "/settings/danger", label: "Danger zone", icon: Trash2 }
];

export function SettingsLayout({ active, children }: { active: string; children: ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <nav aria-label="Settings" className="lg:sticky lg:top-32 lg:self-start">
        <p className="px-3 text-xs font-semibold uppercase tracking-[0.16em] text-graphite/55">Workspace settings</p>
        <ul className="mt-2 space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.label === active;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "focus-ring flex h-9 items-center gap-2 rounded-panel px-3 text-sm font-semibold transition",
                    isActive
                      ? "bg-ink text-white"
                      : "text-graphite hover:bg-mist hover:text-ink"
                  )}
                >
                  <Icon size={15} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
