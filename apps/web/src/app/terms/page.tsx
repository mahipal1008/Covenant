import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "Terms - Covenant" };

const sections = [
  { h: "Service", b: "Covenant Security, Inc. provides automated codebase analysis services as described at covenant.app. By using the service you accept these terms." },
  { h: "Accounts", b: "You are responsible for maintaining your credentials and the actions of users in your organization. You will not share login credentials across humans." },
  { h: "Acceptable use", b: "You will not use Covenant to scan code you do not have rights to scan, attempt to disrupt the service, or reverse-engineer detection logic for resale." },
  { h: "Customer data", b: "You retain all rights to your code, findings, and configuration. We process them only to provide the service and never use them to train shared models." },
  { h: "Fees and refunds", b: "Plans are billed monthly or annually. We offer pro-rated refunds within 14 days for annual plans. Monthly plans cancel at the end of the current billing period." },
  { h: "Termination", b: "Either party may terminate for convenience with 30 days' notice. We may terminate immediately for material breach (acceptable use violations, non-payment after 30 days)." },
  { h: "Warranty disclaimer", b: "The service is provided as-is. Findings are best-effort - they do not constitute legal or compliance advice. You remain responsible for shipping decisions." },
  { h: "Limitation of liability", b: "Aggregate liability is capped at fees paid in the prior 12 months, except for fraud, willful misconduct, or breach of confidentiality." },
  { h: "Governing law", b: "Delaware, USA for U.S. customers; India for India customers; the customer's primary place of business otherwise." },
  { h: "Contact", b: "Questions: legal@covenant.app." }
];

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Terms of service</p>
        <h1 className="mt-3 text-4xl font-bold text-ink">Terms of service.</h1>
        <p className="mt-3 text-sm text-graphite/65">Last updated April 26, 2026.</p>
        <div className="mt-10 space-y-8">
          {sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-xl font-semibold text-ink">{s.h}</h2>
              <p className="mt-2 text-sm leading-7 text-graphite/76">{s.b}</p>
            </section>
          ))}
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
