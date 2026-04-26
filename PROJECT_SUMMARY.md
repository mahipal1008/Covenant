# Covenant — Full Project Summary

_Last verified: April 26, 2026 — `npm run build` clean (33 routes), 19/19 tests pass, typecheck clean across 4 packages._

## 1. What Covenant is

A **living intelligence layer for B2B SaaS codebases**. It continuously scans
multi-tenant code for boundary leaks, keeps a semantic graph of every route /
service / model, compiles plain-English **intent contracts** into runtime
checks, and gates PRs with allow / warn / block decisions. Built around a
fleet of **20 specialized agents** (not one giant prompt).

Tagline: _"The promises your code makes — enforced automatically, forever."_

## 2. Architecture

Monorepo (npm workspaces):

```
Covenant/
  apps/
    api/      Fastify 5.8.5 + helmet + cors + rate-limit + sensible + Zod
    web/      Next.js 16.2.4 (Turbopack) + React 18 + Tailwind 3.4.17
  packages/
    shared/   Cross-package types
    analyzer/ Tenant-leak detector with vitest tests
    db/       Prisma schema + seed
  docker-compose.yml
  tsconfig.base.json
```

- **Dev:** `npm run dev` (concurrently runs api on :4000 + web on :3000)
- **TypeScript:** 5.7 strict, `exactOptionalPropertyTypes: true`
- **Tailwind:** custom theme (ink, paper, mist, line, teal, cobalt, ember, amber, graphite); `darkMode: "class"`
- **API base:** all routes under `/v1/*` (28 documented OpenAPI 3.1 paths)

## 3. The 20 agents (all live)

Discovery · Tenancy · Auth · Trust · Surface · Storage · Quality · Posture ·
Drift · Cost · Compliance · Lineage · Risk · Reviewer · Memory · Onboard ·
Knowledge · Decision · Forecast · Steward

Each has its own Fastify route with seeded demo data so the dashboard,
intelligence page, and PR gate light up immediately.

## 4. Web route map (33 routes)

### Marketing site (uses `SiteHeader` + `SiteFooter`)
| Route | Purpose |
|-------|---------|
| `/` | Hero, agents matrix, social proof |
| `/platform` | Semantic graph + Slack digest + PR gate live demos |
| `/agents` | All 20 agents organized into 7 layer panels |
| `/solutions` | By role (security / platform / leaders) + by industry |
| `/pricing` | Tier cards |
| `/customers` | Stats + logo wall + 3 case studies |
| `/integrations` | 12 connectors (live / beta / planned) |
| `/docs` + `/docs/api` | Docs index + interactive OpenAPI explorer |
| `/security` | Trust posture |
| `/compliance` | SOC 2 / HIPAA / ISO posture |
| `/about` | Company |
| `/contact` | Sales / partnerships |
| `/blog` | 6 engineering / research posts |
| `/changelog` | Recent ships |
| `/roadmap` | Shipped (10) / In progress (3) / Planned (5) — 56% GA bar |
| `/status` | Live probes + 30-day SLOs + recent incidents |
| `/help` | Help tiles + 6 FAQs |
| `/privacy`, `/terms` | Legal |
| `/login`, `/signup` | Auth stubs |
| `/intelligence` | Decision log + capability trends + onboarding tour |
| `/not-found` | 404 |

### Plus generated assets
`/icon`, `/opengraph-image`, `/manifest.webmanifest`, `/robots.txt`, `/sitemap.xml`

### In-product (wrapped by `AppShell`)
| Route | Active tab |
|-------|------------|
| `/dashboard` | Dashboard |
| `/repositories/new` | Repositories |
| `/scans/[id]` | Scan reports |
| `/settings/billing` | Billing |

## 5. AppShell — matches the plan diagram

`apps/web/src/components/product/app-shell.tsx` renders three layers:

1. **Left rail (lg+):** Dashboard · Repositories · Scan reports · Semantic graph · 20 agents · Billing, plus a "Product layers" group (Docs · Security · Intent · Economics · Team) and a "Back to marketing site" card.
2. **Sticky header:** workspace label, Local demo badge, theme toggle, Billing button.
3. **Top tab strip (mirrors plan):** `Dashboard | Docs | Security | Intent | Economics | Team` — followed by `Semantic graph` and `20 agents` quick links.
4. **Footer:** Security · Compliance · Privacy · Terms · Changelog.

## 6. Dashboard ShipStatus widget

`apps/web/src/components/product/ship-status.tsx` — answers _"what we do, what's remaining"_:

- **Overall GA scope:** 69%
- **Discovery & graph:** 5/5 ✓ — _Next: Live diff overlays_
- **Security & isolation:** 6/7 — _In progress: Behavioral fuzzer · Next: Cross-tenant fuzz harness_
- **Intent contracts:** 4/5 — _In progress: Versioning UI · Next: Approval workflows_
- **Economics & cost:** 3/4 — _Next: Budget alerts_
- **Compliance & evidence:** 3/6 — _In progress: SOC 2 Type II window · Next: ISO 27001 mapping_
- **Integrations:** 3/8 — _In progress: Jira / Linear / PagerDuty · Next: GitLab + Bitbucket_

## 7. Phases completed in this conversation

1. **Phase 1 — Built all 20 agents.** Routes, seeded data, dashboard panels.
2. **Phase 2 — Brand cleanup.** Removed every DineSync reference; rebranded to Covenant.
3. **Phase 3 — Verification.** 19/19 tests pass, typecheck clean, 26 routes built.
4. **Phase 4 — Pre-launch hardening.** Added `@fastify/helmet`, `@fastify/rate-limit`, `robots.txt`, `sitemap.xml`, `icon.tsx`, `opengraph-image.tsx`, `manifest.ts`, env defaults.
5. **Phase 5 — In-product polish.** Rebuilt `AppShell` so all four in-product pages literally match the plan diagram (Dashboard | Docs | Security | Intent | Economics | Team tabs).
6. **Phase 6 — SaaS-grade IA.** Added 7 helper pages (`/roadmap`, `/status`, `/customers`, `/integrations`, `/help`, `/solutions`, `/blog`) + `ShipStatus` widget on `/dashboard`. Refreshed header (6 nav links, lg breakpoint) and footer (4 columns: Product / Solutions / Resources / Company).

## 8. Verified build state

- `npm run build -w @covenant/web` — ✓ 33 routes, all green
- `npm run typecheck` — ✓ clean across `@covenant/api`, `@covenant/web`, `@covenant/analyzer`, `@covenant/shared`
- Tests — ✓ 19/19 passing (api app.test.ts + analyzer tenant-leak-detector.test.ts)
- Live screenshots — `/dashboard` and `/roadmap` confirmed industry-grade visuals

## 9. Notable files

- `apps/web/src/components/product/app-shell.tsx` — plan-diagram-aligned in-product chrome
- `apps/web/src/components/product/ship-status.tsx` — what's-shipped widget
- `apps/web/src/components/site-header.tsx` — 6-link top nav
- `apps/web/src/components/site-footer.tsx` — 4-column footer
- `apps/api/src/server.ts` — Fastify bootstrap with hardening
- `apps/api/src/routes/*.ts` — billing, contracts, dashboard, health, integrations, intelligence, openapi, platform, repositories, scans
- `packages/analyzer/src/index.ts` — tenant-leak detector (TS AST)
- `packages/db/prisma/schema.prisma` — data model + seed

## 10. Known not-yet-done (tracked on `/roadmap`)

**In progress:** Postgres persistence (currently in-memory demo store), BYO LLM connector marketplace, SOC 2 Type II observation window.

**Planned:** GitLab/Bitbucket parity, VS Code + JetBrains extension, compliance evidence vault, multi-region residency (EU/US/APAC), real-time agent collaboration surface.
