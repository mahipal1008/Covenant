# Covenant

> The living intelligence layer for software.
> Your codebase gets a brain that documents, secures, audits, predicts, and enforces itself — forever.

Covenant is a B2B SaaS platform that gives a multi-tenant codebase a continuous, AI-grade
security and intent layer. The first shipping module is a **multi-tenant leak detector**
that maps routes, traces database queries, and blocks deploys when sensitive data can
cross tenant boundaries.

This repository is the full working implementation: marketing site, product dashboard,
REST API, scan engine, database schema, and integration adapters.

---

## Table of contents

1. [Why Covenant](#why-covenant)
2. [Architecture](#architecture)
3. [Tech stack](#tech-stack)
4. [Repository layout](#repository-layout)
5. [Quick start](#quick-start)
6. [Environment variables](#environment-variables)
7. [Available scripts](#available-scripts)
8. [API reference](#api-reference)
9. [Database](#database)
10. [Scan engine](#scan-engine)
11. [Frontend pages](#frontend-pages)
12. [Testing](#testing)
13. [Production build](#production-build)
14. [Roadmap](#roadmap)
15. [License](#license)

---

## Why Covenant

Generic scanners can tell you a dependency has a CVE. Covenant tells you that
`/api/reports/billing` can return another tenant's invoices, shows the exact query,
explains the exploit chain, and gives a remediation that fits your schema.

The product is organized as **six layers, twenty agents**. V1 ships Layer 3
(Multi-Tenant Leak Detector) end-to-end and ships product-grade surfaces for the rest
of the roadmap (Understanding, Documentation, Intent, Economics, Team).

| Layer          | Purpose                                                | V1 status |
| -------------- | ------------------------------------------------------ | --------- |
| Understanding  | Map routes, models, tenant keys, implicit contracts    | UI + agent activity feed |
| Documentation  | Living docs, examples, changelog narration             | Roadmap   |
| Security       | Tenant leak detection, auth audit, exploit simulation  | **Shipping** — analyzer + scan reports |
| Intent         | Plain-English behavioral contracts checked per PR      | UI + contract registry |
| Economics      | Tie code risk to revenue and refactor ROI              | UI + revenue-at-risk metric |
| Team           | Bus-factor analysis, onboarding, PR enrichment         | Roadmap   |

---

## Architecture

```
                  Browser (Next.js App Router)
                              │
                              ▼
            ┌──────────────────────────────────┐
            │   apps/web   (Next.js 16, React) │
            │   marketing site + product UI    │
            └──────────────┬───────────────────┘
                           │ fetch (x-organization-id)
                           ▼
            ┌──────────────────────────────────┐
            │   apps/api   (Fastify 5, Node)   │
            │   /v1 REST + Zod validation      │
            └──────────────┬───────────────────┘
                           │
       ┌───────────────────┼─────────────────────────┐
       ▼                   ▼                         ▼
┌────────────────┐  ┌──────────────────┐   ┌────────────────────┐
│ packages/      │  │ packages/db      │   │ apps/api/          │
│   analyzer     │  │ Prisma + Postgres│   │   integrations/    │
│ TS scan engine │  │ 32 models        │   │ GitHub/Slack/Stripe│
└────────────────┘  └──────────────────┘   │ stub adapters      │
                                           └────────────────────┘
```

Multi-tenancy is enforced at the API boundary by an `x-organization-id` header that is
resolved into a `request.covenant` context. Every route asserts the org scope before
returning data. The analyzer itself runs the same rule against your code that the API
enforces at runtime, closing the loop between *what we say* and *what we ship*.

---

## Tech stack

The right tool was chosen for each layer, not one language for everything.

| Concern              | Choice                          | Why                                                      |
| -------------------- | ------------------------------- | -------------------------------------------------------- |
| Frontend             | **TypeScript + Next.js 16**     | App Router, server components, typed routes, fast SSR    |
| Styling              | **Tailwind CSS 3**              | Premium design system without a heavy component library  |
| Icons                | **lucide-react**                | Consistent, tree-shakable                                |
| API                  | **TypeScript + Fastify 5**      | High-throughput Node server with first-class schema      |
| Validation           | **Zod**                         | Single source of truth for request and domain schemas    |
| Background jobs      | **BullMQ + Redis**              | Durable scan queue (wired, runs in-process for V1)       |
| Database             | **PostgreSQL 16**               | Strong relational guarantees for tenant data             |
| ORM / migrations     | **Prisma 6**                    | Type-safe queries against a 32-model schema              |
| Scan engine          | **TypeScript Compiler API**     | Real AST parsing, not regex — finds calls and queries    |
| Containers           | **Docker Compose**              | Local Postgres + Redis with one command                  |
| Monorepo             | **npm workspaces**              | No extra tooling, native to Node 20+                     |

Node `>=20.11` is required (the repo is tested on Node 24).

---

## Repository layout

```
covenant/
├── apps/
│   ├── api/                  Fastify REST API (TypeScript)
│   │   └── src/
│   │       ├── app.ts        Server composition + plugins
│   │       ├── server.ts     Entry point
│   │       ├── context.ts    Per-request org-scope decorator
│   │       ├── config.ts     Typed env loader
│   │       ├── routes/       /health /dashboard /repositories /scans
│   │       │                 /contracts /integrations /billing
│   │       ├── services/     scanner-service, demo-store
│   │       ├── integrations/ GitHub / Slack / Stripe / AI adapters
│   │       └── jobs/         BullMQ queue wiring
│   └── web/                  Next.js 16 App Router
│       └── src/
│           ├── app/          /, /dashboard, /repositories/new,
│           │                 /scans/[id], /settings/billing
│           ├── components/   ui/ + product/ (gauge, charts, tables, forms)
│           └── lib/          api client, formatting helpers
├── packages/
│   ├── analyzer/             TypeScript Compiler-API scan engine
│   ├── db/                   Prisma schema + seed
│   └── shared/               Zod schemas, demo data, types (single source of truth)
├── docker-compose.yml        Postgres + Redis
├── tsconfig.base.json        Strict TS, path aliases for workspaces
├── package.json              Root workspaces + dev/build/test scripts
└── .env.example
```

---

## Quick start

### Prerequisites

- Node.js `>=20.11`
- npm `>=10`
- Docker (optional — only needed for the live Postgres + Redis stack)

### 1. Install

```bash
git clone <this repo>
cd covenant
npm install
cp .env.example .env
```

### 2. Run the dev stack

```bash
npm run dev
```

This starts the API on `http://127.0.0.1:4000` and the web app on
`http://localhost:3000`. The product works **out of the box without Postgres or Redis** —
the API serves a deterministic in-memory `demoStore` so you can demo the scan flow
immediately.

### 3. Optional: real database

```bash
docker compose up -d        # boots Postgres 16 and Redis 7
npm run db:generate         # generate Prisma client
npm run db:seed             # seed the demo organization and findings
```

---

## Environment variables

`.env.example` documents every variable the project reads:

```env
NODE_ENV=development
API_PORT=4000
NEXT_PUBLIC_API_URL=http://127.0.0.1:4000
DATABASE_URL=postgresql://covenant:covenant@localhost:5432/covenant?schema=public
REDIS_URL=redis://localhost:6379
GITHUB_CLIENT_ID=stub
GITHUB_CLIENT_SECRET=stub
STRIPE_SECRET_KEY=stub
SLACK_SIGNING_SECRET=stub
AI_PROVIDER=stub
```

External integrations are intentionally adapter-backed and stubbed in local
development — replace any `stub` value with a real credential to wire production
behavior.

---

## Available scripts

Run from the repo root:

| Script                | Effect                                                       |
| --------------------- | ------------------------------------------------------------ |
| `npm run dev`         | Run API and web concurrently with hot reload                 |
| `npm run dev:api`     | API only (Fastify + tsx watch)                               |
| `npm run dev:web`     | Web only (Next.js dev server)                                |
| `npm run build`       | Typecheck shared/analyzer/api, build Next.js production bundle |
| `npm run typecheck`   | Strict TS check across all four packages                     |
| `npm run test`        | Analyzer unit tests + API integration tests                  |
| `npm run db:generate` | Generate Prisma client                                       |
| `npm run db:seed`     | Seed Postgres with the demo organization                     |

---

## API reference

Base URL: `http://127.0.0.1:4000`. Every `/v1/*` route requires an
`x-organization-id` header. For local development use `org_covenant_demo`.

| Method | Path                  | Description                                          |
| ------ | --------------------- | ---------------------------------------------------- |
| GET    | `/health`             | Liveness probe                                       |
| GET    | `/v1/dashboard`       | Tenant isolation overview, agents, risk trend        |
| GET    | `/v1/repositories`    | Connected repositories                               |
| POST   | `/v1/repositories`    | Onboard a new repository                             |
| GET    | `/v1/scans/latest`    | Most recent scan for the org                         |
| GET    | `/v1/scans/:scanId`   | Full scan, findings, exploit steps, evidence         |
| POST   | `/v1/scans`           | Trigger a scan against demo or uploaded sources      |
| GET    | `/v1/contracts`       | Plain-English intent contracts and their status      |
| GET    | `/v1/integrations`    | GitHub / Slack / Stripe / AI adapter status          |
| GET    | `/v1/billing`         | Plans + current org usage                            |

### Example: trigger a scan

```bash
curl -s -X POST http://127.0.0.1:4000/v1/scans \
  -H "Content-Type: application/json" \
  -H "x-organization-id: org_covenant_demo" \
  -d '{"repositoryId":"repo_sample_saas","sourceMode":"demo"}'
```

The response is a full `Scan` document with status (`passed` / `blocked`),
risk score (0-100), findings, and exploit-reproduction steps for each finding.

---

## Database

The Prisma schema in `packages/db/prisma/schema.prisma` models the full SaaS
surface:

- **Tenancy:** `Organization`, `User`, `Membership` (role-aware join table).
- **Code graph:** `Project`, `Repository`, `Commit`, `Endpoint`, `DataModel`,
  `QueryTrace`, `TenantBoundary`.
- **Security:** `Scan`, `Finding` (severity, exploit steps as JSON), `Report`.
- **Product:** `IntentContract`, `Integration`, `Subscription`, `Notification`,
  `AuditEvent`.

Enums (`ScanStatus`, `Severity`, `FindingStatus`, `IntegrationStatus`,
`ContractStatus`) are mirrored in `packages/shared` as Zod schemas, so API
responses, the database, and the frontend all share one type definition.

---

## Scan engine

`packages/analyzer/src/index.ts` is the heart of the security layer. It walks
the TypeScript AST (using the official compiler API) to:

1. Collect every HTTP route declaration (`router.get(...)`, Next.js route handlers, …).
2. Trace every database call expression (`prisma.invoice.findMany`, `db.query`,
   raw SQL template tags, etc.).
3. Pair each query with the nearest enclosing route.
4. Flag queries that touch sensitive tables (`invoice`, `billing`, `payment`,
   `reservation`, `customer`, `report`, `export`, `admin`, …) without an
   explicit tenant key (`organizationId`, `tenantId`, `workspaceId`, `hostelId`, …).

Each finding includes severity, file + line, route + HTTP method, evidence
snippet, business impact, suggested fix, and a three-step reproduction recipe.

---

## Frontend pages

Industry-grade SaaS surface, custom designed (no off-the-shelf component kit):

| Route                       | Purpose                                                        |
| --------------------------- | -------------------------------------------------------------- |
| `/`                         | Marketing site — hero, product layers, roadmap, pricing        |
| `/dashboard`                | Security command center — risk gauge, agents, top findings    |
| `/repositories/new`         | Onboard a repo (GitHub, GitLab, or upload) and trigger a scan |
| `/scans/[id]`               | Full scan report with per-finding exploit chain and fix        |
| `/settings/billing`         | Plans, usage, and Stripe-ready subscription panel              |

The design system uses a custom Tailwind palette (`ink`, `graphite`, `mist`,
`paper`, `line`, `ember`, `amber`, `teal`, `cobalt`) defined in
`apps/web/tailwind.config.ts` for a calm, editorial feel that scales across
product and marketing.

---

## Testing

```bash
npm run test
```

Currently runs:

- **Analyzer unit tests** — verify that sensitive Prisma reads without tenant
  filters are flagged, that org-scoped queries are *not* flagged, and that raw
  SQL against sensitive tables is caught.
- **API integration tests** (Fastify `inject`) — assert that the dashboard is
  org-scoped, unknown organizations get 404s, and the scan endpoint produces
  findings end-to-end.

All six tests pass on a clean checkout.

---

## Production build

```bash
npm run build
```

Builds in this order:

1. `@covenant/shared` — strict typecheck of Zod schemas and demo fixtures.
2. `@covenant/analyzer` — strict typecheck of the scan engine.
3. `@covenant/api` — strict typecheck of all Fastify routes and services.
4. `@covenant/web` — full Next.js production build with Turbopack, generating
   the static landing page and dynamic product routes.

Expected Next.js output:

```
Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /dashboard
├ ƒ /repositories/new
├ ƒ /scans/[id]
└ ƒ /settings/billing
```

`○` = static, `ƒ` = dynamic / server-rendered on demand.

---

## Roadmap

V1 ships the wedge. The product roadmap layers on top of the same semantic core:

1. **Multi-tenant leak detector** — *shipping*
2. **Intent drift monitor** — plain-English contracts checked per PR
3. **Auth coverage heatmap** — protected vs. unprotected route audit
4. **Economic blast radius** — Stripe-tagged revenue risk per change
5. **Compliance-to-code mapper** — GDPR / SOC2 / DPDP article → middleware
6. **Codebase archaeologist** — git-history reasoning, decision logs

See `project idea plan .txt` for the long-form product narrative and pricing model.

---

## License

Proprietary — all rights reserved. This repository is the working implementation
of the Covenant product and is not currently open-sourced.
