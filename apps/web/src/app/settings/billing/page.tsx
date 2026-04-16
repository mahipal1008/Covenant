import { CheckCircle2, CreditCard, Gauge, Users } from "lucide-react";
import { AppShell } from "@/components/product/app-shell";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { getBilling } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const billing = await getBilling();

  return (
    <AppShell active="Billing">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Billing and usage</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">Startup plan is active.</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-graphite/74">
          Local billing uses a Stripe stub, with production-ready plan structure and usage surfaces.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Usage icon={CreditCard} label="Current plan" value={billing.currentPlan} />
        <Usage icon={Gauge} label="Scans this month" value={String(billing.usage.scansThisMonth)} />
        <Usage icon={Users} label="Seats" value={String(billing.usage.seats)} />
      </div>

      <Panel className="mt-4">
        <PanelHeader title="Plans" eyebrow="Monetization" />
        <div className="grid gap-4 p-5 lg:grid-cols-4">
          {billing.plans.map((plan) => (
            <article key={plan.id} className={`rounded-panel border p-4 ${plan.highlighted ? "border-ink bg-ink text-white" : "border-line bg-paper text-ink"}`}>
              <div className="text-sm font-semibold opacity-75">{plan.name}</div>
              <div className="mt-3 text-3xl font-bold">${plan.priceMonthly}</div>
              <div className="text-sm font-semibold opacity-75">per month</div>
              <p className="mt-4 min-h-16 text-sm leading-6 opacity-80">{plan.description}</p>
              <div className="mt-5 space-y-2">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2 text-sm font-medium">
                    <CheckCircle2 size={16} className={plan.highlighted ? "text-teal" : "text-teal"} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}

function Usage({ icon: Icon, label, value }: { icon: typeof CreditCard; label: string; value: string }) {
  return (
    <Panel className="p-5">
      <Icon size={18} className="text-teal" />
      <div className="mt-5 text-3xl font-bold text-ink">{value}</div>
      <div className="mt-1 text-sm font-semibold text-graphite/65">{label}</div>
    </Panel>
  );
}
