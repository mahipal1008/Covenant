import { CheckCircle2, CircleDashed, Loader2, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { ButtonLink } from "@/components/ui/button";

export const metadata = {
  title: "Roadmap - Covenant",
  description: "What we have shipped, what is in progress, and what is coming next."
};

type Status = "shipped" | "in-progress" | "planned";

type Item = {
  title: string;
  detail: string;
  status: Status;
  category: string;
};

const items: Item[] = [
  // Shipped
  { title: "20 specialized agents live", detail: "Discovery, Tenancy, Auth, Trust, Surface, Storage, Quality, Posture, Drift, Cost, Compliance, Lineage, Risk, Reviewer, Memory, Onboard, Knowledge, Decision, Forecast, Steward.", status: "shipped", category: "Intelligence" },
  { title: "Semantic graph engine", detail: "Routes, services, models, tenant boundaries, external systems with risk scoring and Mermaid diagrams.", status: "shipped", category: "Platform" },
  { title: "Multi-tenant leak scanner", detail: "Static analysis with severity ranking, exploit chain reproduction, evidence snippets, and fix suggestions.", status: "shipped", category: "Security" },
  { title: "PR merge gate", detail: "Allow / warn / block decisions with rationale, failing and passing checks, ready-to-paste PR comments.", status: "shipped", category: "CI/CD" },
  { title: "Slack digest integration", detail: "Channel-aware briefings for security, posture, drift, cost, and compliance audiences.", status: "shipped", category: "Integrations" },
  { title: "GitHub webhook handler", detail: "Verified push and pull_request events trigger scans and post inline comments.", status: "shipped", category: "Integrations" },
  { title: "Intent contracts", detail: "Plain-English controls compiled into runtime checks across services.", status: "shipped", category: "Platform" },
  { title: "Behavioral regression detection", detail: "Capability trends, drift, and SLA forecasts surfaced in the dashboard.", status: "shipped", category: "Intelligence" },
  { title: "OpenAPI 3.1 spec + explorer", detail: "28 documented endpoints with try-it-now widget and copy-as-curl.", status: "shipped", category: "Developer" },
  { title: "Marketing site", detail: "Platform, agents, pricing, security, compliance, docs, contact, about, login, signup.", status: "shipped", category: "Marketing" },

  // In progress
  { title: "Persistent storage backend", detail: "Postgres / Prisma migrations behind feature flag - currently in-memory demo store.", status: "in-progress", category: "Platform" },
  { title: "BYO LLM (Anthropic / OpenAI / Bedrock)", detail: "Adapter layer drafted; connector marketplace in design review.", status: "in-progress", category: "Intelligence" },
  { title: "SOC 2 Type II", detail: "Controls implemented; observation window underway with our auditor.", status: "in-progress", category: "Compliance" },

  // Planned
  { title: "Native GitLab + Bitbucket support", detail: "Webhook parity, PR commenting, and SSO mappings.", status: "planned", category: "Integrations" },
  { title: "VS Code + JetBrains extension", detail: "Inline contract previews and tenant-leak hints right in the editor.", status: "planned", category: "Developer" },
  { title: "Compliance evidence vault", detail: "Auto-generated SOC 2, ISO 27001, HIPAA evidence with cryptographic signing.", status: "planned", category: "Compliance" },
  { title: "Multi-region residency", detail: "EU, US, and APAC data planes for regulated customers.", status: "planned", category: "Platform" },
  { title: "Real-time agent collaboration", detail: "Cross-agent chat surface so teams can intervene mid-investigation.", status: "planned", category: "Intelligence" }
];

const statusMeta: Record<Status, { label: string; icon: typeof CheckCircle2; tone: string }> = {
  shipped: { label: "Shipped", icon: CheckCircle2, tone: "border-teal/30 bg-teal/10 text-teal" },
  "in-progress": { label: "In progress", icon: Loader2, tone: "border-amber-300/40 bg-amber-100/60 text-amber-700" },
  planned: { label: "Planned", icon: CircleDashed, tone: "border-line bg-mist text-graphite" }
};

function Group({ status }: { status: Status }) {
  const meta = statusMeta[status];
  const groupItems = items.filter((i) => i.status === status);
  const Icon = meta.icon;
  return (
    <Panel>
      <PanelHeader
        title={meta.label}
        eyebrow={`${groupItems.length} item${groupItems.length === 1 ? "" : "s"}`}
        action={<span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${meta.tone}`}><Icon size={13} />{meta.label}</span>}
      />
      <ul className="divide-y divide-line">
        {groupItems.map((item) => (
          <li key={item.title} className="px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-graphite/60">{item.category}</span>
            </div>
            <h3 className="mt-1 text-base font-semibold text-ink">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-graphite/76">{item.detail}</p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export default function RoadmapPage() {
  const totals = {
    shipped: items.filter((i) => i.status === "shipped").length,
    inProgress: items.filter((i) => i.status === "in-progress").length,
    planned: items.filter((i) => i.status === "planned").length
  };
  const total = items.length;
  const shippedPct = Math.round((totals.shipped / total) * 100);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="mb-10 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Roadmap</p>
            <h1 className="mt-3 text-4xl font-bold text-ink sm:text-5xl">What we have shipped, and what is next.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-graphite/76">
              Covenant is being built in public. Every milestone below is verifiable in the
              product or scheduled with a real owner. No vapor.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/signup">Start a free trial</ButtonLink>
              <ButtonLink href="/changelog" variant="secondary">Read changelog</ButtonLink>
            </div>
          </div>
          <Panel className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-graphite/55">Build progress</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-5xl font-bold text-ink">{shippedPct}%</span>
              <span className="text-sm text-graphite/70">shipped of GA scope</span>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-mist">
              <div className="h-full rounded-full bg-teal" style={{ width: `${shippedPct}%` }} />
            </div>
            <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
              <Stat label="Shipped" value={totals.shipped} tone="text-teal" />
              <Stat label="In progress" value={totals.inProgress} tone="text-amber" />
              <Stat label="Planned" value={totals.planned} tone="text-graphite" />
            </dl>
          </Panel>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <Group status="shipped" />
          <Group status="in-progress" />
          <Group status="planned" />
        </div>

        <section className="mt-12 rounded-panel border border-line bg-white p-8 shadow-crisp">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-panel bg-ink text-white">
                <Sparkles size={18} />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-ink">Help shape what ships next.</h2>
                <p className="text-sm text-graphite/74">Vote on planned items or request something new in 90 seconds.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/contact" variant="secondary">Request a feature</ButtonLink>
              <ButtonLink href="/changelog">See latest ship</ButtonLink>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-panel border border-line bg-paper p-3">
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/55">{label}</dt>
      <dd className={`mt-1 text-2xl font-bold ${tone}`}>{value}</dd>
    </div>
  );
}
