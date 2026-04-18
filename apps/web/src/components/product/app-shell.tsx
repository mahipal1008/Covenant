import {
  Activity,
  BookOpenText,
  Boxes,
  Braces,
  CreditCard,
  FileWarning,
  GitBranch,
  LayoutDashboard,
  LockKeyhole,
  Network,
  Settings,
  ShieldCheck,
  Sparkles,
  Sparkle
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const sideNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/onboarding", label: "Onboarding", icon: Sparkle },
  { href: "/repositories/new", label: "Repositories", icon: GitBranch },
  { href: "/scans/scan_latest", label: "Scan reports", icon: FileWarning },
  { href: "/platform", label: "Semantic graph", icon: Network },
  { href: "/agents", label: "20 agents", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/settings/billing", label: "Billing", icon: CreditCard }
];

// Top tab strip mirrors the plan diagram: Dashboard | Docs | Security | Intent | Economics | Team
const planTabs = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/docs", label: "Docs", icon: BookOpenText },
  { href: "/security", label: "Security", icon: ShieldCheck },
  { href: "/intelligence#contracts", label: "Intent", icon: Braces },
  { href: "/intelligence#trends", label: "Economics", icon: Activity },
  { href: "/intelligence#tour", label: "Team", icon: Boxes }
];

export function AppShell({ children, active }: { children: ReactNode; active: string }) {
  return (
    <div className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-line bg-white/92 px-4 py-5 backdrop-blur lg:block">
        <Link href="/" className="mb-8 flex items-center gap-3 px-2">
          <span className="grid size-10 place-items-center rounded-panel bg-ink text-white">
            <LockKeyhole size={19} />
          </span>
          <span>
            <span className="block text-base font-bold text-ink">Covenant</span>
            <span className="block text-xs font-medium text-graphite/70">Living intelligence layer</span>
          </span>
        </Link>

        <nav className="space-y-1" aria-label="Workspace">
          {sideNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "focus-ring flex h-10 items-center gap-3 rounded-panel px-3 text-sm font-semibold text-graphite transition hover:bg-mist",
                active === item.label && "bg-ink text-white hover:bg-ink"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-8 border-t border-line pt-5">
          <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-graphite/55">Product layers</p>
          <div className="mt-3 space-y-1">
            {planTabs.slice(1).map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="focus-ring flex h-9 items-center gap-3 rounded-panel px-3 text-sm font-medium text-graphite/85 transition hover:bg-mist hover:text-ink"
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <Link
          href="/"
          className="mt-8 block rounded-panel border border-line bg-mist px-3 py-3 text-xs font-medium text-graphite/80 transition hover:border-teal/30 hover:bg-teal/5 hover:text-teal"
        >
          <span className="block font-semibold text-ink">Back to marketing site</span>
          Pricing, docs, agents matrix
        </Link>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-line bg-paper/92 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2 font-bold text-ink lg:hidden">
              <span className="grid size-9 place-items-center rounded-panel bg-ink text-white">
                <LockKeyhole size={16} />
              </span>
              Covenant
            </Link>
            <div className="hidden text-sm font-medium text-graphite/70 lg:block">
              Covenant workspace <span className="text-graphite/40">/</span> sample-saas
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-xs font-semibold text-teal sm:inline-flex">
                Local demo
              </span>
              <ThemeToggle />
              <Link
                className="focus-ring inline-flex h-9 items-center gap-2 rounded-panel border border-line bg-white px-3 text-sm font-semibold text-graphite hover:border-teal/30 hover:text-teal"
                href="/settings/billing"
              >
                <CreditCard size={15} />
                <span className="hidden sm:inline">Billing</span>
              </Link>
            </div>
          </div>
          <nav aria-label="Product layers" className="overflow-x-auto border-t border-line bg-white/60">
            <div className="flex min-w-max gap-1 px-2 py-2 sm:px-4 lg:px-6">
              {planTabs.map((tab) => {
                const isActive = active === tab.label;
                return (
                  <Link
                    key={tab.label}
                    href={tab.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "focus-ring inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                      isActive
                        ? "border-ink bg-ink text-white"
                        : "border-line bg-white text-graphite hover:border-teal/30 hover:text-teal"
                    )}
                  >
                    <tab.icon size={13} />
                    {tab.label}
                  </Link>
                );
              })}
              <span className="mx-2 hidden h-6 w-px bg-line sm:block" aria-hidden="true" />
              <Link
                href="/platform"
                className={cn(
                  "focus-ring inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  active === "Semantic graph"
                    ? "border-teal bg-teal/10 text-teal"
                    : "border-line bg-white text-graphite hover:border-teal/30 hover:text-teal"
                )}
              >
                <Network size={13} />
                Semantic graph
              </Link>
              <Link
                href="/agents"
                className={cn(
                  "focus-ring inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  active === "20 agents"
                    ? "border-teal bg-teal/10 text-teal"
                    : "border-line bg-white text-graphite hover:border-teal/30 hover:text-teal"
                )}
              >
                <Sparkles size={13} />
                20 agents
              </Link>
            </div>
          </nav>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        <footer className="mt-12 border-t border-line bg-white/70 px-4 py-6 text-xs text-graphite/65 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>(c) 2026 Covenant Security, Inc.</span>
            <div className="flex flex-wrap gap-4">
              <Link href="/security" className="hover:text-teal">Security</Link>
              <Link href="/compliance" className="hover:text-teal">Compliance</Link>
              <Link href="/privacy" className="hover:text-teal">Privacy</Link>
              <Link href="/terms" className="hover:text-teal">Terms</Link>
              <Link href="/changelog" className="hover:text-teal">Changelog</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
