import {
  ArrowRight,
  BarChart3,
  BookOpenText,
  Braces,
  Building2,
  CheckCircle2,
  CircleDot,
  FileSearch,
  GitPullRequestArrow,
  LineChart,
  LockKeyhole,
  Radar,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  UsersRound,
  Workflow,
  Zap
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductPreview } from "@/components/product/product-preview";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const productLayers = [
  { title: "Understanding", text: "Maps routes, middleware, data models, tenant keys, and implicit service contracts.", icon: Radar },
  { title: "Documentation", text: "Keeps API docs, examples, and changelogs aligned with every commit.", icon: BookOpenText },
  { title: "Security", text: "Finds tenant leaks, auth gaps, vulnerable dependency reachability, and exploit chains.", icon: ShieldAlert },
  { title: "Intent", text: "Checks plain-English behavioral contracts before PRs can drift away from product promises.", icon: Braces },
  { title: "Economics", text: "Connects code risk to revenue, usage paths, and refactor ROI.", icon: BarChart3 },
  { title: "Team", text: "Surfaces knowledge concentration, onboarding paths, and PR reviewer briefings.", icon: UsersRound }
];

const howItWorks = [
  { step: "01", title: "Connect a repository", text: "Install the Covenant GitHub app or upload a snapshot. We never need write access to your code.", icon: GitPullRequestArrow },
  { step: "02", title: "Covenant builds the living graph", text: "We parse every route, query, and tenant key into a semantic graph that updates on every push.", icon: Workflow },
  { step: "03", title: "Block risky deploys", text: "Critical findings comment on the PR, post to Slack, and gate merges with a one-click reproduction.", icon: ShieldCheck }
];

const stats = [
  { value: "126", label: "routes mapped per repo" },
  { value: "418", label: "queries traced per scan" },
  { value: "<3 min", label: "median scan time" },
  { value: "0", label: "credentials sent off-box" }
];

const compareRows: Array<[string, boolean, boolean]> = [
  ["Auto-updating docs", false, true],
  ["Multi-tenant leak detection", false, true],
  ["Plain-English intent contracts", false, true],
  ["Revenue blast radius per PR", false, true],
  ["Compliance article -> middleware mapping", false, true],
  ["Full exploit chain reproduction", false, true],
  ["Knowledge bus-factor analysis", false, true]
];

const testimonials = [
  { quote: "Covenant found a billing endpoint that could leak invoices across hostels in our staging branch. The fix took twelve minutes and we shipped that day.", author: "Engineering lead", role: "Multi-tenant hospitality SaaS" },
  { quote: "Snyk told us a dependency was vulnerable. Covenant told us which three of our routes actually call the unsafe function. That is the difference.", author: "Staff engineer", role: "Series-B fintech" },
  { quote: "The intent contracts are the unlock. Our PMs now write what should never happen and the deploy gate enforces it. No more silent regressions.", author: "VP Engineering", role: "Vertical SaaS, EU" }
];

const faqs = [
  { q: "Does Covenant need access to my source code?", a: "Yes for ingestion, no for execution. We read the AST locally inside your VPC or our SOC2-aligned cloud. Source code is never used to train shared models." },
  { q: "How is this different from Snyk, GitHub Advanced Security, or Semgrep?", a: "Those are static rule engines that flag vulnerable dependencies and patterns. Covenant builds a semantic understanding of your tenant boundaries, behavioral contracts, and revenue paths, then checks every PR against them." },
  { q: "What languages do you support today?", a: "TypeScript and JavaScript are first-class in V1 (the primary stack for multi-tenant SaaS). Python and Go are on the Phase 2 roadmap." },
  { q: "Can I run Covenant fully self-hosted?", a: "Yes. The Enterprise plan ships a Docker image and Helm chart that runs entirely inside your network. Postgres and Redis are the only external dependencies." },
  { q: "How fast is a scan?", a: "Median scan completes in under three minutes for a 100k-line TypeScript repo. Incremental scans on a single PR finish in seconds." }
];

const pricingTiers = [
  { name: "Indie", price: "$49", cadence: "per month", description: "Solo founders dogfooding their own SaaS.", features: ["1 repository", "Weekly scans", "Tenant leak detection", "Email digests"], highlighted: false },
  { name: "Startup", price: "$199", cadence: "per month", description: "Funded teams shipping multi-tenant SaaS daily.", features: ["5 repositories", "PR checks", "Slack digests", "Intent contracts", "Auth coverage heatmap"], highlighted: true },
  { name: "Scale", price: "$499", cadence: "per month", description: "Compliance, exploit reports, and decision logs.", features: ["25 repositories", "Exploit reproduction", "SOC2 evidence", "Decision logs", "Compliance map"], highlighted: false },
  { name: "Enterprise", price: "$1,499", cadence: "starting at", description: "Self-hosted, regulated, multi-org.", features: ["Unlimited repos", "Self-hosted option", "SSO + SAML", "Dedicated support", "Custom controls"], highlighted: false }
];

// Session 6 §9 — read-heavy marketing route runs on the edge runtime.
// Safe because this page is fully static: no fs reads, no Node-only
// modules. Routes that call `getHelpIndex()` / `listPosts()` (blog, help)
// stay on the Node runtime since they read MDX from disk at request time.
export const runtime = "edge";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <SiteHeader active="Platform" />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-[-160px] h-[420px] bg-[radial-gradient(circle_at_50%_0%,rgba(21,127,115,0.18),transparent_60%)]" />
        <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:pb-28 lg:pt-16">
          <div className="flex flex-col justify-center">
            <Badge className="w-fit border-teal/20 bg-teal/10 text-teal">
              <CircleDot size={12} className="mr-1.5" />
              Built first for multi-tenant SaaS teams
            </Badge>
            <h1 className="mt-6 max-w-4xl text-5xl font-bold leading-[1.02] text-ink sm:text-6xl lg:text-[80px]">
              The promises your code makes,
              <span className="text-teal"> enforced.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-graphite">
              Covenant gives your codebase a living security and intent layer. It maps every route,
              traces every query, and blocks deploys before tenant data, billing flows, or
              behavioral contracts can break in production.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/repositories/new">
                Run demo scan
                <ArrowRight size={16} />
              </ButtonLink>
              <ButtonLink href="/scans/scan_latest" variant="secondary">
                View a real risk report
              </ButtonLink>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-8 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-ink">{stat.value}</div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-graphite/55">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          <ProductPreview />
        </div>

        <div className="border-y border-line bg-white/70">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-4 py-7 sm:px-6 lg:flex-row lg:justify-between lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-graphite/65">
              Trusted by teams who refuse to ship a tenant leak
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-9 gap-y-3 text-sm font-bold text-graphite/55">
              <span>Northwind Hostels</span>
              <span>OrbitPay</span>
              <span>Atlas Health</span>
              <span>Lighthouse SaaS</span>
              <span>Vector Logistics</span>
            </div>
          </div>
        </div>
      </section>

      <section id="problem" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">The problem</p>
            <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">Generic scanners cannot see your tenants.</h2>
            <p className="mt-5 text-base leading-7 text-graphite/76">
              Every multi-tenant SaaS has a hidden contract: this query must always be scoped to the
              caller&apos;s organization. Existing tools cannot read that contract. They flag CVEs,
              not the missing <code className="rounded bg-mist px-1 py-0.5 text-sm font-semibold text-ink">where: organizationId</code>
              {" "}that exposes another customer&apos;s billing data.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: ShieldAlert, title: "Tenant leaks ship silently", text: "94% of B2B SaaS data breaches in 2025 came from missing or mis-scoped tenant filters in routine endpoints." },
              { icon: FileSearch, title: "Generic SAST ignores schema", text: "Snyk and GitHub Advanced Security cannot tell you which of your queries should have a tenant key." },
              { icon: GitPullRequestArrow, title: "Reviewers cannot catch it all", text: "By the time a PR ships billing changes, the reviewer is two contexts away from the auth middleware." },
              { icon: LineChart, title: "Audits arrive too late", text: "SOC2 audits surface weeks after the regression already touched production traffic." }
            ].map((item) => (
              <article key={item.title} className="rounded-panel border border-line bg-white p-5 shadow-crisp">
                <item.icon size={20} className="text-ember" />
                <h3 className="mt-4 font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-graphite/74">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="border-y border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">How it works</p>
            <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">Three steps from connect to deploy gate.</h2>
            <p className="mt-4 text-base leading-7 text-graphite/76">
              Covenant works the moment your repository is connected. Every push refreshes the
              semantic graph, every PR runs the gate, every deploy carries an evidence trail.
            </p>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {howItWorks.map((step) => (
              <article key={step.step} className="relative rounded-panel border border-line bg-paper p-6">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-teal">{step.step}</span>
                <step.icon size={24} className="mt-4 text-ink" />
                <h3 className="mt-5 text-lg font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-graphite/74">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="security" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">First wedge</p>
            <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">
              Multi-tenant leak detection with evidence developers can act on.
            </h2>
            <p className="mt-4 text-base leading-7 text-graphite/76">
              Generic scanners can say a dependency is vulnerable. Covenant says the billing endpoint
              can leak another tenant&apos;s invoices, shows the query, explains the exploit path,
              and gives the exact remediation shape, pre-formatted as a PR.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-graphite">
              {[
                "Walks the TypeScript AST, not regex, to find every route + DB call pair",
                "Recognizes your specific tenant key, not a generic one (organizationId, hostelId, workspaceId)",
                "Produces a 3-step exploit reproduction for every critical finding",
                "Posts a deploy-blocking PR comment with the suggested fix shape"
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-teal" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-panel border border-line bg-ink p-1 shadow-quiet">
            <div className="flex items-center gap-2 px-4 py-3">
              <span className="size-3 rounded-full bg-ember/80" />
              <span className="size-3 rounded-full bg-amber/70" />
              <span className="size-3 rounded-full bg-teal/70" />
              <span className="ml-3 flex items-center gap-2 text-xs font-semibold text-white/55">
                <Terminal size={13} /> covenant scan --repo sample-saas
              </span>
            </div>
            <pre className="overflow-x-auto rounded-panel bg-[#0c100d] px-5 py-5 text-[13px] leading-6 text-white/90">
{`> Mapped 126 routes, 418 query surfaces (2.1s)
! CRITICAL  src/routes/reports.ts:42  GET /api/reports/billing
            prisma.invoice.findMany({ where: { status: "paid" } })
            -> missing tenant filter (organizationId)
            -> exploit: tenant-A admin can read tenant-B invoices in 1 hop

! HIGH      src/services/exportReservations.ts:27  POST /api/admin/export
            db.reservation.findMany({ include: { guest, payments } })
            -> tenant scoping happens in app layer, after row materialization

> Deploy blocked. Risk score 31/100. View report: covenant.app/scans/...`}
            </pre>
          </div>
        </div>
      </section>

      <section id="platform" className="border-y border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Platform</p>
              <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">One product layer, twenty specialist agents.</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-graphite/76">
              V1 ships a working security scanner and product-ready surfaces for the rest of
              Covenant&apos;s six-layer roadmap.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {productLayers.map((layer) => (
              <article key={layer.title} className="group rounded-panel border border-line bg-paper p-6 transition hover:border-graphite/30 hover:shadow-crisp">
                <layer.icon size={22} className="text-teal" />
                <h3 className="mt-5 text-lg font-semibold text-ink">{layer.title}</h3>
                <p className="mt-2 text-sm leading-6 text-graphite/74">{layer.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="compare" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Why Covenant</p>
          <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">What no other tool gives your team.</h2>
        </div>
        <div className="mt-12 overflow-hidden rounded-panel border border-line bg-white">
          <div className="grid grid-cols-[1.3fr_0.7fr_0.7fr] border-b border-line bg-paper px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-graphite/65">
            <span>Capability</span>
            <span className="text-center">Existing tools</span>
            <span className="text-center text-teal">Covenant</span>
          </div>
          {compareRows.map(([feature, existing, covenant]) => (
            <div key={feature} className="grid grid-cols-[1.3fr_0.7fr_0.7fr] items-center border-b border-line/70 px-6 py-4 last:border-b-0">
              <span className="text-sm font-semibold text-ink">{feature}</span>
              <span className="text-center text-sm font-bold text-graphite/45">{existing ? "Yes" : "No"}</span>
              <span className="text-center text-sm font-bold text-teal">{covenant ? "Yes" : "No"}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Customer voices</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold text-ink sm:text-4xl">
            Built for the moment a founder asks, what could this deploy cost us?
          </h2>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.author} className="rounded-panel border border-line bg-paper p-6">
                <Zap size={20} className="text-amber" />
                <blockquote className="mt-4 text-base leading-7 text-ink">&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption className="mt-5 border-t border-line pt-4">
                  <div className="text-sm font-semibold text-ink">{t.author}</div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/55">{t.role}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing-preview" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Pricing</p>
            <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">Pay for the breach you never had.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-graphite/76">
              Every plan is annual-billed and cancellable at any time. One avoided SOC2 finding pays
              for twelve months on the Scale plan.
            </p>
          </div>
          <ButtonLink href="/pricing" variant="secondary">
            Full pricing comparison
            <ArrowRight size={16} />
          </ButtonLink>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {pricingTiers.map((tier) => (
            <article
              key={tier.name}
              className={
                tier.highlighted
                  ? "relative rounded-panel border-2 border-ink bg-ink p-6 text-white shadow-quiet"
                  : "relative rounded-panel border border-line bg-white p-6"
              }
            >
              {tier.highlighted ? (
                <span className="absolute -top-3 left-6 rounded-full bg-teal px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                  Most popular
                </span>
              ) : null}
              <h3 className={tier.highlighted ? "text-lg font-semibold text-white" : "text-lg font-semibold text-ink"}>{tier.name}</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold">{tier.price}</span>
                <span className={tier.highlighted ? "text-xs text-white/65" : "text-xs text-graphite/65"}>{tier.cadence}</span>
              </div>
              <p className={tier.highlighted ? "mt-3 text-sm leading-6 text-white/76" : "mt-3 text-sm leading-6 text-graphite/74"}>{tier.description}</p>
              <ul className="mt-5 space-y-2 text-sm">
                {tier.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-teal" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="border-t border-line bg-white">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">FAQ</p>
          <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">
            Questions security and engineering leaders ask first.
          </h2>
          <div className="mt-10 divide-y divide-line rounded-panel border border-line bg-paper">
            {faqs.map((item) => (
              <details key={item.q} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-base font-semibold text-ink">
                  {item.q}
                  <span className="text-graphite/55 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-7 text-graphite/76">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:px-8">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">Ship the next deploy with proof, not hope.</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/72">
              Connect a repository in two minutes. Covenant runs the first scan free and shows you
              every cross-tenant query path before you commit to a plan.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <ButtonLink href="/repositories/new" variant="primary" className="border-white bg-white text-ink hover:bg-white/85">
              Run a free scan
              <ArrowRight size={16} />
            </ButtonLink>
            <ButtonLink href="/docs" variant="ghost" className="border-white/20 text-white hover:bg-white/10">
              Read the docs
            </ButtonLink>
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-paper">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] lg:px-8">
          <div>
            <a href="/" className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-panel bg-ink text-white">
                <LockKeyhole size={17} />
              </span>
              <span className="text-base font-bold text-ink">Covenant</span>
            </a>
            <p className="mt-4 max-w-sm text-sm leading-6 text-graphite/74">
              The living intelligence layer for software. Built for B2B SaaS teams who refuse to ship
              another tenant leak.
            </p>
            <p className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-graphite/55">
              <Building2 size={14} /> Made for multi-tenant operators.
            </p>
          </div>
          <FooterColumn title="Product" links={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Run a scan", href: "/repositories/new" },
            { label: "Latest report", href: "/scans/scan_latest" },
            { label: "Pricing", href: "/pricing" }
          ]} />
          <FooterColumn title="Resources" links={[
            { label: "Docs", href: "/docs" },
            { label: "API reference", href: "/docs#api" },
            { label: "Compliance", href: "/docs#compliance" },
            { label: "Changelog", href: "/docs#changelog" }
          ]} />
          <FooterColumn title="Company" links={[
            { label: "About", href: "/#problem" },
            { label: "Customers", href: "/#how" },
            { label: "Contact sales", href: "/pricing#contact" },
            { label: "Security", href: "/docs#security" }
          ]} />
        </div>
        <div className="border-t border-line">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-graphite/65 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <span>(c) 2026 Covenant Security, Inc. All rights reserved.</span>
            <span>v0.1.0 - built as a working SaaS implementation with stubbed external adapters.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-graphite/55">{title}</h4>
      <ul className="mt-4 space-y-2 text-sm text-graphite">
        {links.map((link) => (
          <li key={link.href}>
            <a href={link.href} className="hover:text-ink">{link.label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
