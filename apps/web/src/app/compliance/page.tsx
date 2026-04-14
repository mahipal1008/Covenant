import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { demoRegulations, type RegulationEntry } from "@covenant/shared";
import { AlertOctagon, CheckCircle2, Clock, FileLock2 } from "lucide-react";

export const metadata = { title: "Compliance - Covenant" };

const tone: Record<RegulationEntry["status"], { label: string; classes: string; icon: typeof CheckCircle2 }> = {
  compliant: { label: "Compliant", classes: "border-teal/30 bg-teal/10 text-teal", icon: CheckCircle2 },
  "at-risk": { label: "At risk", classes: "border-amber/30 bg-amber/10 text-amber", icon: Clock },
  violating: { label: "Violating", classes: "border-ember/30 bg-ember/10 text-ember", icon: AlertOctagon }
};

const mapping = [
  { control: "GDPR Article 25", text: "Data minimization", target: "src/middleware/serializer.ts" },
  { control: "GDPR Article 17", text: "Right to erasure", target: "src/jobs/gdpr-delete.ts" },
  { control: "DPDP Act Section 8", text: "Data principal rights", target: "src/routes/customers.ts" },
  { control: "EU AI Act Article 13", text: "Logging and transparency", target: "src/integrations/ai.ts" },
  { control: "SOC2 CC6.1", text: "Logical access controls", target: "src/middleware/requireAuth.ts" },
  { control: "SOC2 CC6.6", text: "Authentication", target: "src/middleware/rateLimit.ts" },
  { control: "SOC2 CC7.2", text: "System monitoring", target: "src/observability/audit.ts" }
];

export default function CompliancePage() {
  const next = demoRegulations.filter((r) => r.daysUntil > 0).sort((a, b) => a.daysUntil - b.daysUntil)[0];

  return (
    <main className="min-h-screen">
      <SiteHeader />

      <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Compliance</p>
        <h1 className="mt-3 text-4xl font-bold text-ink sm:text-6xl">From law text to line of code.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-graphite/76">
          Covenant maps every regulation to the exact files and middleware responsible. The
          Regulatory Horizon Scanner catches enforcement dates before they catch you.
        </p>
        {next ? (
          <div className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full border border-amber/30 bg-amber/10 px-5 py-2 text-sm font-semibold text-amber">
            <Clock size={14} />
            Next enforcement in {next.daysUntil} days: {next.name}
          </div>
        ) : null}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-ink">Regulatory horizon</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {demoRegulations.map((reg) => {
            const t = tone[reg.status];
            const Icon = t.icon;
            return (
              <article key={reg.id} className="rounded-panel border border-line bg-white p-6 shadow-crisp">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-graphite/65">{reg.region}</p>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] ${t.classes}`}>
                    <Icon size={11} />
                    {t.label}
                  </span>
                </div>
                <h3 className="mt-2 text-base font-semibold text-ink">{reg.name}</h3>
                <p className="mt-2 text-sm leading-6 text-graphite/74">{reg.summary}</p>
                <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-graphite">
                  <div>
                    <p className="font-bold uppercase tracking-[0.14em] text-graphite/55">Enforcement</p>
                    <p className="mt-1 font-semibold text-ink">
                      {new Date(reg.enforcementDate).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold uppercase tracking-[0.14em] text-graphite/55">Mapped files</p>
                    <ul className="mt-1 space-y-1 text-ink">
                      {reg.mappedFiles.map((f) => (
                        <li key={f} className="font-mono text-[11px]">{f}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <FileLock2 size={20} className="text-teal" />
            <h2 className="text-2xl font-bold text-ink">Compliance-to-code mapping</h2>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-graphite/74">
            Every regulatory control resolves to one or more files in your repository. One-click
            evidence for SOC2, ISO 27001, GDPR, and DPDP audits.
          </p>
          <div className="mt-8 overflow-hidden rounded-panel border border-line">
            <div className="grid grid-cols-3 border-b border-line bg-paper px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-graphite/65">
              <span>Control</span>
              <span>Description</span>
              <span>File</span>
            </div>
            {mapping.map((row) => (
              <div key={row.control} className="grid grid-cols-3 items-center border-b border-line/70 bg-white px-5 py-3 text-sm last:border-b-0">
                <span className="font-semibold text-ink">{row.control}</span>
                <span className="text-graphite/74">{row.text}</span>
                <span className="font-mono text-xs text-ink">{row.target}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
