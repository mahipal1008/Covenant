import { ArrowRight, Building2, HeartPulse, ShieldCheck, ShoppingCart, Stethoscope, Users } from "lucide-react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Panel } from "@/components/ui/panel";
import { ButtonLink } from "@/components/ui/button";

export const metadata = {
  title: "Solutions - Covenant",
  description: "Covenant for B2B SaaS, healthcare, fintech, hospitality, and field service teams."
};

const byRole = [
  {
    icon: ShieldCheck,
    role: "Security engineering",
    headline: "Catch tenant boundary regressions on every PR.",
    bullets: [
      "Static + behavioral scans on push and PR",
      "Exploit chain reproduction with evidence",
      "Block merges with a one-click rationale"
    ],
    href: "/security"
  },
  {
    icon: Building2,
    role: "Platform engineering",
    headline: "A living map of every service, route, and model.",
    bullets: [
      "Semantic graph kept current automatically",
      "Capability trends and SLA forecasts",
      "Drift detection across environments"
    ],
    href: "/platform"
  },
  {
    icon: Users,
    role: "Engineering leaders",
    headline: "Ship faster with fewer late-night incidents.",
    bullets: [
      "Onboard new hires in days, not weeks",
      "Plain-English intent contracts as a paper trail",
      "Slack briefings tuned per audience"
    ],
    href: "/dashboard"
  }
];

const byIndustry = [
  { icon: HeartPulse, name: "Hospitality SaaS", line: "Booking engines, billing, multi-property tenants." },
  { icon: Stethoscope, name: "Healthcare", line: "PHI-safe multi-tenant analytics with HIPAA evidence." },
  { icon: ShoppingCart, name: "Commerce platforms", line: "Marketplace separation across merchants and storefronts." },
  { icon: Building2, name: "Fintech", line: "Account-level isolation, audit-ready compliance trail." }
];

export default function SolutionsPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="border-b border-line bg-paper">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Solutions</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold text-ink sm:text-5xl">
              Built for the teams who carry the pager.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-graphite/76">
              Covenant adapts to the role you play and the industry you ship into.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-graphite/60">By role</h2>
          <div className="mt-4 grid gap-6 lg:grid-cols-3">
            {byRole.map((card) => {
              const Icon = card.icon;
              return (
                <Panel key={card.role} className="flex flex-col p-6">
                  <span className="grid size-10 place-items-center rounded-panel bg-ink text-white">
                    <Icon size={18} />
                  </span>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-graphite/60">{card.role}</p>
                  <h3 className="mt-1 text-lg font-semibold text-ink">{card.headline}</h3>
                  <ul className="mt-4 space-y-2 text-sm text-graphite/76">
                    {card.bullets.map((b) => (
                      <li key={b} className="flex gap-2"><span className="mt-2 block size-1.5 rounded-full bg-teal" />{b}</li>
                    ))}
                  </ul>
                  <Link href={card.href} className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-ink hover:text-teal">
                    Learn more <ArrowRight size={14} />
                  </Link>
                </Panel>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-graphite/60">By industry</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {byIndustry.map((item) => {
              const Icon = item.icon;
              return (
                <Panel key={item.name} className="p-5">
                  <Icon size={20} className="text-teal" />
                  <h3 className="mt-3 text-base font-semibold text-ink">{item.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-graphite/76">{item.line}</p>
                </Panel>
              );
            })}
          </div>
        </section>

        <section className="border-t border-line bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-ink">Not sure which solution fits?</h2>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/contact" variant="secondary">Talk to us</ButtonLink>
              <ButtonLink href="/signup">Start free <ArrowRight size={16} /></ButtonLink>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
