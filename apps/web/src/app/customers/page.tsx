import { ArrowRight, Quote, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Panel } from "@/components/ui/panel";
import { ButtonLink } from "@/components/ui/button";

export const metadata = {
  title: "Customers - Covenant",
  description: "How modern B2B SaaS teams use Covenant to enforce tenant isolation and ship faster."
};

const stats = [
  { label: "Tenant leaks prevented", value: "1,284", icon: ShieldCheck },
  { label: "Average review time", value: "-72%", icon: TrendingUp },
  { label: "Engineers onboarded", value: "3,400+", icon: Users }
];

const stories = [
  {
    company: "Northwind Hospitality",
    industry: "Hotel SaaS",
    quote: "Covenant caught a billing query that would have leaked invoices across hostels. The PR comment had the fix already drafted.",
    author: "Anika R.",
    role: "Staff Engineer",
    metric: "0 cross-tenant incidents in 9 months",
    tone: "border-teal/30 bg-teal/5 text-teal"
  },
  {
    company: "Lumen Health",
    industry: "Healthcare",
    quote: "We replaced three security tools and a quarterly pen test with Covenant's continuous scanner. Auditors loved the evidence trail.",
    author: "Marco T.",
    role: "Head of Platform",
    metric: "SOC 2 + HIPAA evidence in one click",
    tone: "border-cobalt/30 bg-cobalt/5 text-cobalt"
  },
  {
    company: "FieldOps Pro",
    industry: "Field service",
    quote: "Onboarding new engineers used to take a month. With Covenant's living docs, juniors ship safely in their first week.",
    author: "Devika S.",
    role: "VP Engineering",
    metric: "Onboarding cut from 28 to 6 days",
    tone: "border-amber-300/40 bg-amber-100/40 text-amber-700"
  }
];

const logos = ["Northwind", "Lumen Health", "FieldOps", "Atlas Books", "Helix CRM", "Pier 9", "Verdant", "Brightline"];

export default function CustomersPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="border-b border-line bg-paper">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Customers</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold text-ink sm:text-5xl">
              Trusted by B2B SaaS teams that cannot afford a tenant leak.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-graphite/76">
              From hospitality to healthcare, Covenant enforces multi-tenant boundaries the moment code lands.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Panel key={stat.label} className="p-5">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-graphite/60">
                      <Icon size={14} className="text-teal" />
                      {stat.label}
                    </div>
                    <p className="mt-2 text-3xl font-bold text-ink">{stat.value}</p>
                  </Panel>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-graphite/60">Selected customers</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {logos.map((name) => (
              <div key={name} className="flex h-14 items-center justify-center rounded-panel border border-line bg-white text-sm font-semibold text-graphite/70 shadow-crisp">
                {name}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-ink">Stories from teams shipping safer code.</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {stories.map((story) => (
              <Panel key={story.company} className="flex flex-col p-6">
                <Quote size={22} className="text-teal" />
                <p className="mt-4 text-base leading-7 text-graphite/85">{story.quote}</p>
                <div className="mt-6 flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-mist text-sm font-bold text-ink">
                    {story.author.split(" ").map((n) => n[0]).join("")}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{story.author}</p>
                    <p className="text-xs text-graphite/65">{story.role}, {story.company}</p>
                  </div>
                </div>
                <div className={`mt-5 inline-flex items-center justify-between rounded-panel border px-3 py-2 text-xs font-semibold ${story.tone}`}>
                  <span>{story.industry}</span>
                  <span>{story.metric}</span>
                </div>
              </Panel>
            ))}
          </div>
        </section>

        <section className="border-t border-line bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-12 sm:px-6 lg:px-8">
            <div>
              <h2 className="text-2xl font-bold text-ink">Ready to be the next case study?</h2>
              <p className="mt-2 text-sm text-graphite/74">Run your first scan in under five minutes.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/signup">Start free <ArrowRight size={16} /></ButtonLink>
              <ButtonLink href="/contact" variant="secondary">Talk to sales</ButtonLink>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
