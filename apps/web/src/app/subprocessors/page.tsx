import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Subprocessors | Covenant",
  description: "Authorised subprocessors used to deliver the Covenant Service."
};

type Sub = { name: string; purpose: string; region: string; data: string; updated: string };

const subprocessors: Sub[] = [
  { name: "Amazon Web Services", purpose: "Primary cloud hosting (compute, storage, KMS)", region: "us-east-1, eu-west-1", data: "All customer data", updated: "2026-01-08" },
  { name: "Cloudflare", purpose: "Edge CDN, DDoS protection, WAF", region: "Global", data: "Request metadata, IPs", updated: "2026-01-08" },
  { name: "Stripe", purpose: "Payment processing & invoicing", region: "US, EU", data: "Billing identifiers, payment metadata", updated: "2026-01-08" },
  { name: "Auth0 (Okta)", purpose: "Authentication & SSO brokering", region: "US, EU", data: "Email, name, login metadata", updated: "2026-01-08" },
  { name: "PagerDuty", purpose: "On-call routing for service incidents", region: "US", data: "Internal alert metadata only", updated: "2026-01-08" },
  { name: "Sentry", purpose: "Error monitoring (PII-scrubbed)", region: "US", data: "Error stack traces, request IDs", updated: "2026-01-08" },
  { name: "Datadog", purpose: "Logs, metrics, APM", region: "US, EU", data: "Internal telemetry only", updated: "2026-01-08" },
  { name: "Resend", purpose: "Transactional email", region: "US", data: "Email address, message content", updated: "2026-01-08" },
  { name: "OpenAI", purpose: "Default LLM provider for AI agents (opt-in, BYO available)", region: "US", data: "Prompt + redacted code excerpts", updated: "2026-01-08" },
  { name: "Anthropic", purpose: "Alternate LLM provider (opt-in)", region: "US", data: "Prompt + redacted code excerpts", updated: "2026-01-08" }
];

export default function SubprocessorsPage() {
  return (
    <main className="bg-paper text-ink">
      <SiteHeader />
      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Vendors</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-ink sm:text-5xl">Authorised subprocessors</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-graphite/85">
            We give 30 days written notice before adding any new subprocessor. Subscribe to the changelog RSS or email
            <a href="mailto:legal@covenant.dev" className="font-semibold text-ink underline"> legal@covenant.dev</a> to be
            notified.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="overflow-x-auto rounded-panel border border-line bg-white">
          <table className="min-w-full divide-y divide-line text-sm">
            <thead className="bg-mist/40 text-left text-xs uppercase tracking-[0.14em] text-graphite/65">
              <tr>
                <th className="px-5 py-3 font-semibold">Subprocessor</th>
                <th className="px-5 py-3 font-semibold">Purpose</th>
                <th className="px-5 py-3 font-semibold">Region</th>
                <th className="px-5 py-3 font-semibold">Data shared</th>
                <th className="px-5 py-3 font-semibold">Last reviewed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {subprocessors.map((s) => (
                <tr key={s.name}>
                  <td className="px-5 py-3 font-semibold text-ink">{s.name}</td>
                  <td className="px-5 py-3 text-graphite/85">{s.purpose}</td>
                  <td className="px-5 py-3 text-graphite/74">{s.region}</td>
                  <td className="px-5 py-3 text-graphite/74">{s.data}</td>
                  <td className="px-5 py-3 text-graphite/74">{s.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-graphite/65">
          Last full review: 2026-01-08. EU residency available for AWS, Cloudflare, Stripe, Datadog on Scale plan and
          above.
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}
