import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CheckCircle2, Database, Eye, FileLock2, KeyRound, Lock, Network, Server, ShieldCheck } from "lucide-react";

export const metadata = { title: "Security - Covenant" };

const principles = [
  { icon: Lock, title: "Encryption at rest and in transit", text: "AES-256 at rest, TLS 1.3 in transit. Per-organization KMS keys for sensitive secrets." },
  { icon: Server, title: "Tenant isolation enforced at the API", text: "Every /v1/* request requires an x-organization-id and is scoped at the boundary, not at the database read." },
  { icon: Eye, title: "Source code never trains shared models", text: "Customer code is processed in isolated workers and discarded after analysis. Zero shared embeddings." },
  { icon: KeyRound, title: "SSO and SCIM for Enterprise", text: "SAML 2.0, OIDC, and SCIM provisioning. MFA enforced for all admin actions." },
  { icon: Network, title: "Webhook payloads HMAC-signed", text: "Replay protection via timestamp and nonce. Failed signature verifications are logged and alerted." },
  { icon: Database, title: "Audit trail for every action", text: "Every deploy gate decision, scan trigger, and finding state change is recorded immutably for 7 years." }
];

const certs = [
  { title: "SOC2 Type II", state: "In progress", target: "Q3 2026" },
  { title: "ISO 27001", state: "Planned", target: "Q1 2027" },
  { title: "GDPR", state: "Compliant", target: "Live" },
  { title: "DPDP Act", state: "Compliant", target: "Live" }
];

export default function SecurityPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader active="Security" />

      <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Security</p>
        <h1 className="mt-3 text-4xl font-bold text-ink sm:text-6xl">We hold ourselves to the standard we ship.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-graphite/76">
          Covenant scans codebases for tenant isolation. We do not get to compromise on our own.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {principles.map((p) => (
            <article key={p.title} className="rounded-panel border border-line bg-white p-6 shadow-crisp">
              <span className="grid size-10 place-items-center rounded-panel bg-teal/10 text-teal">
                <p.icon size={18} />
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink">{p.title}</h3>
              <p className="mt-2 text-sm leading-6 text-graphite/74">{p.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <FileLock2 size={20} className="text-teal" />
            <h2 className="text-3xl font-bold text-ink">Compliance.</h2>
          </div>
          <div className="mt-8 overflow-hidden rounded-panel border border-line">
            <div className="grid grid-cols-3 border-b border-line bg-paper px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-graphite/65">
              <span>Framework</span>
              <span>Status</span>
              <span>Target</span>
            </div>
            {certs.map((c) => (
              <div key={c.title} className="grid grid-cols-3 items-center border-b border-line/70 bg-white px-5 py-3 text-sm last:border-b-0">
                <span className="font-semibold text-ink">{c.title}</span>
                <span className={c.state === "Compliant" ? "text-teal" : c.state === "In progress" ? "text-amber" : "text-graphite/65"}>
                  <span className="inline-flex items-center gap-1">
                    {c.state === "Compliant" ? <CheckCircle2 size={14} /> : null}
                    {c.state}
                  </span>
                </span>
                <span className="text-graphite/74">{c.target}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-3xl text-sm leading-6 text-graphite/74">
            Email <a href="mailto:security@covenant.app" className="font-semibold text-teal hover:underline">security@covenant.app</a> for our latest SOC2 progress letter, pen-test summary, and DPA.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-panel border border-line bg-ink p-8 text-white">
          <ShieldCheck size={22} className="text-teal" />
          <h3 className="mt-4 text-2xl font-bold">Found a vulnerability?</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">
            Email <a className="underline" href="mailto:security@covenant.app">security@covenant.app</a> with a description and reproduction. We acknowledge within 24 hours and pay bounties for valid reports. We will not pursue legal action against good-faith research.
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
