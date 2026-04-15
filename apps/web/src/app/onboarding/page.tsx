import { Check, ChevronRight, GitBranch, Sparkles, UserPlus } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/product/app-shell";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const steps = [
  {
    id: 1,
    title: "Connect a repository",
    blurb: "Use the GitHub demo provider or paste a public clone URL — Covenant indexes file structure, dependencies, and intent in under 30 seconds.",
    icon: GitBranch,
    cta: { href: "/repositories/new", label: "Connect repository" },
    state: "current"
  },
  {
    id: 2,
    title: "Run your first multi-tenant scan",
    blurb: "We run the 20-agent council on your code. Tenant leakage, IDOR drift, and AI prompt injections are flagged with file + line precision.",
    icon: Sparkles,
    cta: { href: "/scans/scan_latest", label: "View sample scan" },
    state: "next"
  },
  {
    id: 3,
    title: "Author an intent contract",
    blurb: "Pin business invariants — “a tenant must never read another tenant’s rows” — so future PRs that violate it are blocked, not warned.",
    icon: Check,
    cta: { href: "/dashboard", label: "Open dashboard" },
    state: "next"
  },
  {
    id: 4,
    title: "Invite your team",
    blurb: "Bring in security, platform, and product engineers. Roles, audit log, and notification preferences are pre-configured.",
    icon: UserPlus,
    cta: { href: "/settings/team", label: "Manage team" },
    state: "next"
  }
];

const stateStyles: Record<string, string> = {
  done: "bg-teal text-white",
  current: "bg-ink text-white",
  next: "bg-mist text-ink"
};

export default function OnboardingPage() {
  return (
    <AppShell active="Onboarding">
      <header className="mb-6 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Welcome to Covenant</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">Get to first signal in under 5 minutes.</h1>
        <p className="mt-2 text-sm leading-6 text-graphite/74">
          Four steps. Each step ships a real artefact you can show your team — no demo data, no fake PDFs.
        </p>
      </header>

      <ol className="space-y-4">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <li key={step.id}>
              <Panel className={step.state === "current" ? "border-ink" : ""}>
                <div className="flex flex-wrap items-start justify-between gap-4 p-5">
                  <div className="flex items-start gap-4">
                    <div className={`grid h-10 w-10 flex-none place-items-center rounded-full text-sm font-bold ${stateStyles[step.state]!}`}>
                      {step.state === "done" ? <Check size={16} /> : step.id}
                    </div>
                    <div className="max-w-xl">
                      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-graphite/65">
                        <Icon size={13} /> Step {step.id} of {steps.length}
                      </div>
                      <h2 className="mt-1 text-xl font-bold text-ink">{step.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-graphite/85">{step.blurb}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Link
                      href={step.cta.href}
                      className="focus-ring inline-flex h-10 items-center gap-1.5 rounded-panel border border-ink bg-ink px-4 text-sm font-semibold text-white"
                    >
                      {step.cta.label} <ChevronRight size={14} />
                    </Link>
                    {idx < steps.length - 1 ? (
                      <span className="text-xs text-graphite/65">or skip and come back later</span>
                    ) : null}
                  </div>
                </div>
              </Panel>
            </li>
          );
        })}
      </ol>

      <Panel className="mt-6">
        <PanelHeader title="What “first value” looks like" eyebrow="Time to first signal" />
        <ul className="space-y-2 px-5 py-4 text-sm leading-6 text-graphite/85">
          <li>• <span className="font-semibold text-ink">Minute 1.</span> Repository connected, semantic graph rendered.</li>
          <li>• <span className="font-semibold text-ink">Minute 3.</span> First scan complete — concrete tenant-leak finding with file + line.</li>
          <li>• <span className="font-semibold text-ink">Minute 4.</span> Intent contract authored, GitHub PR check installed.</li>
          <li>• <span className="font-semibold text-ink">Minute 5.</span> Two teammates invited, audit log live.</li>
        </ul>
      </Panel>
    </AppShell>
  );
}
