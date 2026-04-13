import Link from "next/link";
import { BookOpenText, Code2, FileText, LockKeyhole, ShieldCheck, Terminal, Webhook } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "Docs — Covenant" };

const sections = [
  { id: "quickstart", title: "Quickstart", icon: Terminal },
  { id: "api", title: "API reference", icon: Code2 },
  { id: "intent", title: "Intent contracts", icon: FileText },
  { id: "compliance", title: "Compliance", icon: ShieldCheck },
  { id: "security", title: "Security model", icon: LockKeyhole },
  { id: "changelog", title: "Changelog", icon: BookOpenText }
];

const apiRoutes: Array<{ method: string; path: string; description: string }> = [
  { method: "GET", path: "/health", description: "Liveness probe" },
  { method: "GET", path: "/v1/dashboard", description: "Tenant isolation overview, agents, risk trend" },
  { method: "GET", path: "/v1/repositories", description: "List connected repositories" },
  { method: "POST", path: "/v1/repositories", description: "Onboard a new repository" },
  { method: "GET", path: "/v1/scans/latest", description: "Most recent scan for the org" },
  { method: "GET", path: "/v1/scans/:scanId", description: "Full scan with findings, evidence, exploit steps" },
  { method: "POST", path: "/v1/scans", description: "Trigger a scan against demo or uploaded sources" },
  { method: "GET", path: "/v1/contracts", description: "Plain-English intent contracts and statuses" },
  { method: "GET", path: "/v1/integrations", description: "Adapter and integration status" },
  { method: "GET", path: "/v1/billing", description: "Plans and current org usage" }
];

export default function DocsPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader active="Docs" />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-graphite/55">On this page</p>
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="flex items-center gap-2 rounded-panel px-3 py-2 text-sm font-semibold text-graphite hover:bg-white hover:text-ink">
                <s.icon size={14} />
                {s.title}
              </a>
            ))}
          </nav>
        </aside>

        <article className="space-y-16 pb-16">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Documentation</p>
            <h1 className="mt-3 text-4xl font-bold text-ink sm:text-5xl">Covenant developer docs.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-graphite/76">
              Everything you need to connect a repository, run scans, wire intent contracts, and ship
              with a deploy gate. The full API surface is REST and version-pinned at <code className="rounded bg-mist px-1 py-0.5 text-sm font-semibold text-ink">/v1</code>.
            </p>
          </header>

          <section id="quickstart">
            <h2 className="text-2xl font-bold text-ink">Quickstart</h2>
            <p className="mt-3 text-sm leading-7 text-graphite/76">
              The dev stack runs on your machine without Postgres or Redis thanks to the in-memory
              demo store.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-panel bg-ink px-5 py-4 text-[13px] leading-7 text-white/90">
{`git clone https://github.com/your-org/covenant
cd covenant
npm install
cp .env.example .env
npm run dev

# web  -> http://localhost:3000
# api  -> http://127.0.0.1:4000`}
            </pre>
            <p className="mt-4 text-sm leading-7 text-graphite/76">
              Optional: bring up Postgres and Redis with Docker Compose.
            </p>
            <pre className="mt-2 overflow-x-auto rounded-panel bg-ink px-5 py-4 text-[13px] leading-7 text-white/90">
{`docker compose up -d
npm run db:generate
npm run db:seed`}
            </pre>
          </section>

          <section id="api">
            <h2 className="text-2xl font-bold text-ink">API reference</h2>
            <p className="mt-3 text-sm leading-7 text-graphite/76">
              Base URL: <code className="rounded bg-mist px-1 py-0.5 text-sm font-semibold text-ink">http://127.0.0.1:4000</code>.
              Every <code className="rounded bg-mist px-1 py-0.5 text-sm font-semibold text-ink">/v1/*</code> route
              requires an <code className="rounded bg-mist px-1 py-0.5 text-sm font-semibold text-ink">x-organization-id</code> header.
              For local dev use <code className="rounded bg-mist px-1 py-0.5 text-sm font-semibold text-ink">org_covenant_demo</code>.
            </p>
            <p className="mt-3 text-sm leading-7 text-graphite/76">
              Looking for an interactive explorer with curl, JavaScript, and Python examples?{" "}
              <Link href="/docs/api" className="font-semibold text-teal hover:underline">
                Open the live API explorer
              </Link>
              . The OpenAPI 3.1 document is published at{" "}
              <code className="rounded bg-mist px-1 py-0.5 text-sm font-semibold text-ink">/openapi.json</code>.
            </p>
            <div className="mt-6 overflow-hidden rounded-panel border border-line">
              <div className="grid grid-cols-[80px_1.4fr_2fr] border-b border-line bg-paper px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-graphite/65">
                <span>Method</span>
                <span>Path</span>
                <span>Description</span>
              </div>
              {apiRoutes.map((r) => (
                <div key={`${r.method}-${r.path}`} className="grid grid-cols-[80px_1.4fr_2fr] items-center border-b border-line/70 bg-white px-5 py-3 text-sm last:border-b-0">
                  <span className={methodTone(r.method)}>{r.method}</span>
                  <code className="font-mono text-sm text-ink">{r.path}</code>
                  <span className="text-graphite/74">{r.description}</span>
                </div>
              ))}
            </div>
            <h3 className="mt-8 text-lg font-semibold text-ink">Trigger a scan</h3>
            <pre className="mt-3 overflow-x-auto rounded-panel bg-ink px-5 py-4 text-[13px] leading-7 text-white/90">
{`curl -s -X POST http://127.0.0.1:4000/v1/scans \\
  -H "Content-Type: application/json" \\
  -H "x-organization-id: org_covenant_demo" \\
  -d '{"repositoryId":"repo_sample_saas","sourceMode":"demo"}'`}
            </pre>
          </section>

          <section id="intent">
            <h2 className="text-2xl font-bold text-ink">Intent contracts</h2>
            <p className="mt-3 text-sm leading-7 text-graphite/76">
              Write product invariants in plain English. Covenant rewrites them as enforceable
              checks the deploy gate can run on every PR.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-panel bg-ink px-5 py-4 text-[13px] leading-7 text-white/90">
{`# covenant.yml

contracts:
  - id: tenant-billing-isolation
    plain_english: "No hostel admin sees another hostel's billing data."
    owner: security
  - id: free-tier-export-limit
    plain_english: "Free tier users cannot access export endpoints."
    owner: product`}
            </pre>
          </section>

          <section id="compliance">
            <h2 className="text-2xl font-bold text-ink">Compliance</h2>
            <p className="mt-3 text-sm leading-7 text-graphite/76">
              Covenant maps regulatory articles to the exact middleware and routes responsible. The
              Scale plan ships SOC2 evidence packages. Enterprise plans include a regulatory horizon
              scanner that maps upcoming GDPR, DPDP, and EU AI Act changes to your codebase before
              their enforcement dates.
            </p>
          </section>

          <section id="security">
            <h2 className="text-2xl font-bold text-ink">Security model</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-graphite">
              <li>- All scans run inside your VPC or our SOC2-aligned cloud. Source code never trains shared models.</li>
              <li>- Tenant isolation is enforced at the API boundary by an <code className="rounded bg-mist px-1 py-0.5 text-sm font-semibold text-ink">x-organization-id</code> context.</li>
              <li>- Webhook payloads are HMAC-signed and replay-protected.</li>
              <li>- Customer secrets are stored encrypted at rest with per-org KMS keys.</li>
            </ul>
            <div className="mt-5 inline-flex items-center gap-2 rounded-panel border border-line bg-paper px-4 py-2 text-xs font-semibold text-graphite">
              <Webhook size={14} className="text-teal" />
              GitHub, Slack, Stripe, and AI provider adapters are stubbed in local dev. Replace any
              env value to wire production behavior.
            </div>
          </section>

          <section id="changelog">
            <h2 className="text-2xl font-bold text-ink">Changelog</h2>
            <ol className="mt-4 space-y-5">
              <li className="rounded-panel border border-line bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">v0.1.0 — April 26, 2026</p>
                <h3 className="mt-1 text-lg font-semibold text-ink">Initial release</h3>
                <ul className="mt-2 list-disc pl-5 text-sm leading-7 text-graphite/76">
                  <li>Multi-tenant leak detector ships across the analyzer, API, and dashboard.</li>
                  <li>Org-scoped Fastify API at /v1 with Zod validation.</li>
                  <li>Next.js 16 product surfaces: dashboard, repository onboarding, scan report, billing.</li>
                  <li>Prisma schema with 17 models and demo seed.</li>
                </ul>
              </li>
            </ol>
          </section>
        </article>
      </div>

      <footer className="border-t border-line bg-paper">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-xs text-graphite/65 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>(c) 2026 Covenant Security, Inc.</span>
          <Link href="/" className="hover:text-ink">Back to home</Link>
        </div>
      </footer>
    </main>
  );
}

function methodTone(method: string) {
  const base = "inline-flex w-fit min-w-[60px] justify-center rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em]";
  if (method === "GET") return `${base} bg-teal/10 text-teal`;
  if (method === "POST") return `${base} bg-cobalt/10 text-cobalt`;
  return `${base} bg-amber/10 text-amber`;
}
