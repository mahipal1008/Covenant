import { CheckCircle2, FileBadge, Globe2, Lock, ScanSearch, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Trust | Covenant",
  description: "How Covenant secures your data, our subprocessors, and how to request audit reports."
};

const controls = [
  { name: "Encryption in transit", detail: "TLS 1.3 enforced everywhere; HSTS preload list submitted." },
  { name: "Encryption at rest", detail: "AES-256-GCM with per-tenant data keys; HSM-managed root." },
  { name: "Tenant isolation", detail: "Logical isolation enforced by Covenant’s own multi-tenant analyzer." },
  { name: "Identity & access", detail: "Per-org RBAC, scoped API tokens, audit log, mandatory MFA on staff accounts." },
  { name: "Vulnerability management", detail: "Continuous SCA + SAST; dependabot + Renovate; quarterly third-party pentest." },
  { name: "Backups & DR", detail: "Point-in-time restore (15 min RPO), cross-region replicas, quarterly DR drill." },
  { name: "Vendor review", detail: "All subprocessors reviewed annually with SOC 2 / ISO 27001 evidence." },
  { name: "Secret management", detail: "Customer credentials sealed with envelope encryption; rotated every 90 days." }
];

const certifications = [
  { name: "SOC 2 Type I", status: "Audited", icon: ShieldCheck, hint: "Report available under NDA" },
  { name: "SOC 2 Type II", status: "In progress", icon: ShieldCheck, hint: "Observation period started Q1" },
  { name: "ISO 27001", status: "Roadmap — H2", icon: FileBadge, hint: "Gap assessment scheduled" },
  { name: "GDPR", status: "Compliant", icon: Globe2, hint: "DPA available + EU subprocessor option" },
  { name: "HIPAA", status: "BAA available", icon: Lock, hint: "Scale plan and above" },
  { name: "Penetration test", status: "2x / year", icon: ScanSearch, hint: "Latest summary available on request" }
];

export default function TrustPage() {
  return (
    <main className="bg-paper text-ink">
      <SiteHeader />
      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Trust</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight text-ink sm:text-5xl">
            Built so your security team has nothing to argue about.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-graphite/85">
            Covenant analyses sensitive code. We treat every byte like our customers’ customers depend on it — because
            they do. This page lists the controls that ship the day you sign in, and the audits in flight.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dpa"
              className="focus-ring inline-flex h-10 items-center rounded-panel border border-ink bg-ink px-4 text-sm font-semibold text-white"
            >
              Data Processing Addendum
            </Link>
            <Link
              href="/subprocessors"
              className="focus-ring inline-flex h-10 items-center rounded-panel border border-line bg-white px-4 text-sm font-semibold text-ink"
            >
              Subprocessors list
            </Link>
            <Link
              href="/security"
              className="focus-ring inline-flex h-10 items-center rounded-panel border border-line bg-white px-4 text-sm font-semibold text-ink"
            >
              Security architecture
            </Link>
            <a
              href="mailto:trust@covenant.dev"
              className="focus-ring inline-flex h-10 items-center rounded-panel border border-line bg-white px-4 text-sm font-semibold text-ink"
            >
              Request audit reports
            </a>
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-2xl font-bold text-ink">Certifications & assessments</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {certifications.map((c) => {
              const Icon = c.icon;
              return (
                <article key={c.name} className="rounded-panel border border-line bg-white p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-graphite/65">
                    <Icon size={16} className="text-teal" />
                    {c.status}
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-ink">{c.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-graphite/74">{c.hint}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-2xl font-bold text-ink">Security controls</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-graphite/74">
            These are not aspirations — they are enforced by code. Each control maps to evidence rows in the compliance
            evidence vault, sampled monthly.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {controls.map((c) => (
              <li key={c.name} className="rounded-panel border border-line bg-paper p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <CheckCircle2 size={14} className="text-teal" />
                  {c.name}
                </div>
                <p className="mt-1 text-xs leading-5 text-graphite/74">{c.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-2xl font-bold text-ink">Reporting a vulnerability</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-graphite/74">
            We pay the highest legitimate bounty in our budget for every confirmed report. Send an encrypted email to{" "}
            <a className="font-semibold text-ink underline" href="mailto:security@covenant.dev">
              security@covenant.dev
            </a>{" "}
            (PGP key on /security). We respond within one business day and triage within three.
          </p>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
