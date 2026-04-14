import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Data Processing Addendum | Covenant",
  description: "Covenant's standard DPA: GDPR Art. 28, SCCs, and how to sign."
};

const sections: { title: string; body: string[] }[] = [
  {
    title: "1. Scope",
    body: [
      "This Data Processing Addendum (\"DPA\") forms part of the Covenant Master Subscription Agreement between the customer (\"Controller\") and Covenant Technologies Inc. (\"Processor\"). It governs the Processing of Personal Data under GDPR, UK GDPR, and applicable U.S. state privacy law."
    ]
  },
  {
    title: "2. Subject matter and duration",
    body: [
      "Processor processes Personal Data on Controller's behalf strictly to deliver the Covenant Service. The duration matches the Subscription Term plus the storage windows described in §6."
    ]
  },
  {
    title: "3. Nature and purpose",
    body: [
      "Personal Data is processed to: index source code, run multi-tenant security analyses, manage authentication, deliver notifications, and produce audit and compliance evidence. Categories of Personal Data include name, email, IP address, user agent, and source code authorship metadata."
    ]
  },
  {
    title: "4. Sub-processors",
    body: [
      "Controller authorises the sub-processors listed at /subprocessors. Processor will give 30 days written notice (RSS feed + email) before engaging a new sub-processor. Controller may object on reasonable grounds and terminate the affected portion of the Service if not resolved."
    ]
  },
  {
    title: "5. International transfers",
    body: [
      "Where Personal Data is transferred outside the EEA / UK, the parties incorporate the EU Standard Contractual Clauses (Module Two) and the UK International Data Transfer Addendum by reference. Controller is the Data Exporter; Processor is the Data Importer."
    ]
  },
  {
    title: "6. Security",
    body: [
      "Processor maintains the technical and organisational measures listed at /trust, which meet or exceed Annex II of the SCCs. Encryption in transit (TLS 1.3) and at rest (AES-256-GCM) is mandatory."
    ]
  },
  {
    title: "7. Personal Data Breach",
    body: [
      "Processor notifies Controller within 72 hours of becoming aware of a Personal Data Breach affecting Controller's data, with a written summary of facts known and remediation steps."
    ]
  },
  {
    title: "8. Data subject rights",
    body: [
      "Processor provides self-serve export (Art. 20), deletion (Art. 17), and rectification tools in /settings/data and /settings/danger. Processor will assist Controller in responding to data subject requests within 30 days."
    ]
  },
  {
    title: "9. Audit",
    body: [
      "Once per twelve-month period, Controller may request a copy of Processor's most recent SOC 2 Type II report under NDA. On-site audits are available for Enterprise customers with 30 days notice."
    ]
  },
  {
    title: "10. Deletion",
    body: [
      "On termination, Processor deletes or returns all Personal Data within 30 days (90 days for backup tapes) and provides a written certificate of deletion on request."
    ]
  }
];

export default function DpaPage() {
  return (
    <main className="bg-paper text-ink">
      <SiteHeader />
      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Legal</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-ink sm:text-5xl">Data Processing Addendum</h1>
          <p className="mt-4 text-base leading-7 text-graphite/85">
            This is the standard DPA we counter-sign for every paid customer. If your legal team prefers a redline, send
            it to <a className="font-semibold text-ink underline" href="mailto:legal@covenant.dev">legal@covenant.dev</a>{" "}
            — turnaround is typically two business days.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="mailto:legal@covenant.dev?subject=DPA%20signature%20request"
              className="focus-ring inline-flex h-10 items-center rounded-panel border border-ink bg-ink px-4 text-sm font-semibold text-white"
            >
              Request signed copy
            </a>
            <Link
              href="/subprocessors"
              className="focus-ring inline-flex h-10 items-center rounded-panel border border-line bg-white px-4 text-sm font-semibold text-ink"
            >
              View subprocessors
            </Link>
          </div>
        </div>
      </section>
      <article className="mx-auto max-w-3xl px-6 py-14">
        <div className="space-y-8 text-sm leading-7 text-graphite/85">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-lg font-bold text-ink">{s.title}</h2>
              {s.body.map((p, i) => (
                <p key={i} className="mt-2">
                  {p}
                </p>
              ))}
            </section>
          ))}
          <p className="rounded-panel border border-line bg-white p-4 text-xs leading-5 text-graphite/74">
            Document version 2026-01. This page is informational; the executed copy provided by Covenant prevails. Last
            reviewed by counsel: January 2026.
          </p>
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
