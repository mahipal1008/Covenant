import Link from "next/link";
import { ArrowRight, CheckCircle2, MinusCircle, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { billingPlans } from "@covenant/shared";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const featureMatrix: Array<{ feature: string; tiers: Record<string, boolean | string> }> = [
  { feature: "Repositories", tiers: { Indie: "1", Startup: "5", Scale: "25", Enterprise: "Unlimited" } },
  { feature: "Tenant leak detection", tiers: { Indie: true, Startup: true, Scale: true, Enterprise: true } },
  { feature: "Auth coverage heatmap", tiers: { Indie: false, Startup: true, Scale: true, Enterprise: true } },
  { feature: "Intent contracts", tiers: { Indie: false, Startup: true, Scale: true, Enterprise: true } },
  { feature: "Slack and email digests", tiers: { Indie: "Email", Startup: true, Scale: true, Enterprise: true } },
  { feature: "PR deploy gate", tiers: { Indie: false, Startup: true, Scale: true, Enterprise: true } },
  { feature: "Exploit reproduction", tiers: { Indie: false, Startup: false, Scale: true, Enterprise: true } },
  { feature: "SOC2 evidence package", tiers: { Indie: false, Startup: false, Scale: true, Enterprise: true } },
  { feature: "Decision logs and archaeology", tiers: { Indie: false, Startup: false, Scale: true, Enterprise: true } },
  { feature: "Self-hosted deployment", tiers: { Indie: false, Startup: false, Scale: false, Enterprise: true } },
  { feature: "SSO and SAML", tiers: { Indie: false, Startup: false, Scale: false, Enterprise: true } },
  { feature: "Dedicated support", tiers: { Indie: "Email", Startup: "Email", Scale: "Priority", Enterprise: "Dedicated" } }
];

const guarantees = [
  { title: "First scan free", text: "Connect any repository and see your first risk report before you pay anything." },
  { title: "Cancel any time", text: "Monthly and annual plans both cancel cleanly. No data hostage." },
  { title: "Every plan includes the leak detector", text: "We will not gate the multi-tenant scanner. That is the wedge and it works on day one." }
];

export const metadata = { title: "Pricing — Covenant" };

// Session 6 §9 — fully-static read-heavy route, safe for edge runtime.
export const runtime = "edge";

export default function PricingPage() {
  const tierOrder = ["Indie", "Startup", "Scale", "Enterprise"] as const;

  return (
    <main className="min-h-screen">
      <SiteHeader active="Pricing" />

      <section className="mx-auto max-w-5xl px-4 pb-12 pt-16 text-center sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Pricing</p>
        <h1 className="mt-4 text-4xl font-bold text-ink sm:text-6xl">Cheaper than the breach.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-graphite/76">
          Every plan is annual-billed and cancellable at any time. One avoided SOC2 finding pays for
          twelve months on the Scale plan. Every plan ships the multi-tenant leak detector.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {billingPlans.map((plan) => (
            <article
              key={plan.id}
              className={
                plan.highlighted
                  ? "relative rounded-panel border-2 border-ink bg-ink p-6 text-white shadow-quiet"
                  : "relative rounded-panel border border-line bg-white p-6"
              }
            >
              {plan.highlighted ? (
                <span className="absolute -top-3 left-6 rounded-full bg-teal px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                  Most popular
                </span>
              ) : null}
              <h3 className={plan.highlighted ? "text-lg font-semibold text-white" : "text-lg font-semibold text-ink"}>
                {plan.name}
              </h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold">${plan.priceMonthly}</span>
                <span className={plan.highlighted ? "text-xs text-white/65" : "text-xs text-graphite/65"}>per month</span>
              </div>
              <p className={plan.highlighted ? "mt-3 text-sm leading-6 text-white/76" : "mt-3 text-sm leading-6 text-graphite/74"}>
                {plan.description}
              </p>
              <ul className="mt-5 space-y-2 text-sm">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-teal" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <ButtonLink
                href={plan.id === "enterprise" ? "/pricing#contact" : "/repositories/new"}
                variant={plan.highlighted ? "primary" : "secondary"}
                className={plan.highlighted ? "mt-6 w-full border-white bg-white text-ink hover:bg-white/85" : "mt-6 w-full"}
              >
                {plan.id === "enterprise" ? "Contact sales" : "Start free scan"}
                <ArrowRight size={16} />
              </ButtonLink>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="text-3xl font-bold text-ink">Compare every feature.</h2>
            <p className="hidden max-w-md text-sm text-graphite/74 sm:block">
              All plans include the multi-tenant leak detector and unlimited scans on connected
              repositories.
            </p>
          </div>
          <div className="overflow-x-auto rounded-panel border border-line">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-paper text-xs font-semibold uppercase tracking-[0.16em] text-graphite/65">
                <tr>
                  <th className="px-6 py-4 font-semibold">Feature</th>
                  {tierOrder.map((t) => (
                    <th key={t} className={t === "Startup" ? "px-6 py-4 text-center font-semibold text-teal" : "px-6 py-4 text-center font-semibold"}>
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70 bg-white">
                {featureMatrix.map((row) => (
                  <tr key={row.feature}>
                    <td className="px-6 py-4 font-semibold text-ink">{row.feature}</td>
                    {tierOrder.map((t) => {
                      const value = row.tiers[t];
                      return (
                        <td key={t} className="px-6 py-4 text-center text-sm text-graphite">
                          {value === true ? (
                            <CheckCircle2 size={18} className="mx-auto text-teal" />
                          ) : value === false ? (
                            <MinusCircle size={18} className="mx-auto text-graphite/35" />
                          ) : (
                            <span className="font-semibold text-ink">{value}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {guarantees.map((g) => (
            <article key={g.title} className="rounded-panel border border-line bg-white p-6 shadow-crisp">
              <ShieldCheck size={20} className="text-teal" />
              <h3 className="mt-4 text-lg font-semibold text-ink">{g.title}</h3>
              <p className="mt-2 text-sm leading-6 text-graphite/74">{g.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="contact" className="bg-ink text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:px-8">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">Need a self-hosted or regulated deployment?</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/72">
              Enterprise customers run Covenant entirely inside their VPC. Bring your own Postgres,
              your own Redis, and your own SSO provider. Talk to us about regulated industries.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <ButtonLink href="mailto:sales@covenant.app" className="border-white bg-white text-ink hover:bg-white/85">
              Contact sales
              <ArrowRight size={16} />
            </ButtonLink>
            <ButtonLink href="/docs" variant="ghost" className="border-white/20 text-white hover:bg-white/10">
              Architecture docs
            </ButtonLink>
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-paper">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-xs text-graphite/65 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>(c) 2026 Covenant Security, Inc.</span>
          <Link href="/" className="hover:text-ink">Back to home</Link>
        </div>
      </footer>
    </main>
  );
}
