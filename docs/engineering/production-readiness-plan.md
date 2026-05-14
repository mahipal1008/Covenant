# Production-Readiness Plan

> Authored: May 14, 2026. Generated from 5 parallel Claude Opus 4.7 subagent reviews
> (API security, frontend, data/analyzer, build/CI/deploy, real-user readiness).
>
> Overall completion estimate to **charge real paying users: ~55–60%**.
> Backend surface is mature; auth UI, billing UX, demoStore gating, integrations,
> webhook idempotency, and compliance honesty are the gates.

---

## How to read this

- `[C#]` = critical (data-leak, auth-bypass, broken build).
- `[H#]` = high (likely incident at scale or before first 10 paying customers).
- `[M#]` = medium (technical debt with real impact).
- `[L#]` = low (polish).
- ☑ = fixed in this pass. ☐ = open.

## Wave 0 — CRITICAL (must land before any external traffic)

### Auth & isolation
- ☑ **[C1-api]** `isPublicPath()` in `apps/api/src/auth/rbac.ts` used unanchored `startsWith(p)` — every URL beginning with a public prefix (e.g. `/v1/leads/admin`) skipped Bearer-check + Casbin + tenant ALS. Fix: require exact match or `/`-segment match.
- ☑ **[C2-api]** Evidence vault `Map<string, …>` keyed by `${category}/${name}` — no tenant id; `GET /v1/evidence` returned every tenant's evidence. Fix: prefix key with `${organizationId}/`, scope `listEvidence` to caller's org.
- ☑ **[C3-api]** Production guard `process.env["NODE_ENV"] === "production"` evaluated independently in 5+ files — single misconfig flipped auth off. Fix: centralize in `config.ts` (`config.isProduction`) and have JWT key loader **fail boot** when keys absent in production.
- ☑ **[C1-web]** No `apps/web/middleware.ts` — `/dashboard`, `/repositories`, `/scans`, `/settings`, `/admin` all rendered for anonymous visitors with a hardcoded `x-organization-id: org_covenant_demo`. Fix: add a `middleware.ts` that redirects to `/login` when no session cookie.
- ☑ **[C2-web]** `/login` and `/signup` pages just called `setSuccess(true)` — no API call. Fix: wire to `POST /v1/auth/login` / `POST /v1/auth/signup`, set session cookie, propagate errors.
- ☑ **[C3-web]** `/admin/console` (super-admin console) was a public route accepting an admin token in an input field. Fix: remove from public routing; gate behind middleware and session role check.

### Data layer
- ☑ **[1.1]** Three models (`NpsResponse`, `Lead`, `DataSubjectRequest`) exist in `schema.prisma` with **no migration**. `prisma migrate deploy` to a clean DB would diverge from the generated client. Fix: emit a consolidating migration.
- ☑ **[6.1]** `docker-compose.yml` shipped `POSTGRES_USER/PASSWORD: covenant`, bound to `0.0.0.0:5433`. Fix: bind to `127.0.0.1`, read password from `${POSTGRES_PASSWORD}`, add healthchecks.
- ☑ **[6.2]** Redis exposed on `0.0.0.0:6380` with no auth. Fix: bind localhost + optional `--requirepass`.
- ☑ **[7.2]** `.env.example` `DATABASE_URL` used port `5432`, compose published `5433`. `db:seed` failed out of the box. Fix: align to `5433`.

### Analyzer correctness (the product's core promise)
- ☑ **[2.1]** Tenant-leak detector blind to `findUniqueOrThrow`, `findFirstOrThrow`, `aggregate`, `groupBy`, `count`, `upsert`. Fix: add to `queryMethods`.
- ☐ **[2.1b]** Detector still blind to dynamic property keys, spread expressions, and externally-imported `where` constants. Add symbol-walk follow-through. *Deferred — bigger surgery.*
- ☐ **[2.2]** `sensitiveDataPattern` hits legitimate `prisma.user.findMany` / `adminAuditLog`. Add inline `// covenant:allow tenant-cross-tenant` suppression + config allowlist (`Organization`, `User`, `FeatureFlag`). *Deferred.*

### Demo / fixture hygiene
- ☑ **[3.1]** Seeds + analyzer fixtures used `AKIA…` and `sk_live_…` literals — every secret scanner (TruffleHog, GitGuardian, GitHub push protection) alerts. Fix: use canonical example values (`AKIAIOSFODNN7EXAMPLE`, `sk_test_EXAMPLE_…`, `whsec_test_EXAMPLE_…`).

---

## Wave 1 — HIGH (first 30 days)

### API
- ☑ **[H1-api]** Stripe webhook had no event-id dedup. Fix: persist `event.id` in a `ProcessedWebhookEvent` table with unique constraint and short-circuit on conflict.
- ☑ **[H3-api]** `POST /v1/jobs/scan` accepted unvalidated body + foreign `repositoryId`. Fix: Zod schema + `repository.findUnique` ownership check via tenant-guarded client.
- ☑ **[H5-api]** Helmet CSP `connect-src` interpolated raw `corsOrigin` CSV string → invalid directive. Fix: spread the parsed array.
- ☐ **[H2-api]** Stripe webhook still trusts `sub.metadata.organizationId` to bind. Build a server-side `customer→organization` mapping and reject events whose claimed org doesn't match.
- ☐ **[H4-api]** `/v1/leads` and `/v1/nps` need per-endpoint rate limits (currently global only).
- ☐ **[H6-api]** CSRF guard skips when refresh cookie absent — tighten to "any auth cookie present → fail closed".
- ☐ **[H7-api]** *Combined with C3 fix* — JWT loader now throws in production if private/public JWK env vars missing.
- ☐ **[H8-api]** Webhook subscription SSRF guard: also resolve DNS at delivery time and reject private IPs.

### Web
- ☑ **[H3-web]** Added strict security headers (`Content-Security-Policy`, `Strict-Transport-Security`, `Referrer-Policy`, `X-Content-Type-Options`, `Permissions-Policy`, `X-Frame-Options`) in `next.config.mjs`.
- ☑ **[H5-web]** PostHog inline-script env interpolation now wrapped in `JSON.stringify`.
- ☑ **[H6-web]** `blog/[slug]` and `help/[slug]` use async `params` (Next 16 requirement).
- ☑ **[M1-web]** Added `app/error.tsx` (global), `app/loading.tsx`, plus per-segment boundaries for `dashboard`, `scans/[id]`, `intelligence`, `status`.
- ☐ **[H7-web]** Service worker still caches credentialed responses too eagerly. Restrict `isStaticAsset` to `/_next/static/`; never cache when `Vary: Cookie` is present.
- ☐ **[H8-web]** `getJson` falls back to demo data on 401/403 — should throw and let auth flow kick in.
- ☐ **[H10-web]** Share `@covenant/shared` Zod schemas for client-side validation parity.

### Persistence & integrations
- ☑ **[B3]** Removed `demoStore` fallbacks from production paths (gated behind `!isProduction`); errors now propagate to the 500 handler with structured error response.
- ☐ **[B4]** Stripe Checkout + Customer Portal session endpoints + UI buttons; plan-enforcement middleware.
- ☐ **[B6]** Replace `createStubAdapter` for GitHub / Slack / Stripe / AI with real adapters wired to env credentials.
- ☐ **[B8]** Idempotency-Key header support on `POST /v1/scans`, `POST /v1/repositories`.

### Data layer
- ☐ **[1.3]** Add `@@index([organizationId])` (or composite with most-selective column) on every tenant-scoped model — single migration.
- ☐ **[1.4]** `@@unique([organizationId, provider, remoteUrl])` on `Repository`.
- ☐ **[1.6]** `Finding.exploitSteps Json @default("[]")`.
- ☐ **[1.8]** Composite `[organizationId, createdAt(sort: Desc)]` index on Scan / Finding / Repository / IntentContract / Notification.
- ☐ **[1.9]** Switch `Invoice`, `AuditEvent`, `DataSubjectRequest` FKs to `onDelete: Restrict` (compliance immutability).
- ☐ **[1.11]** Add `NODE_ENV === "production"` guard at top of seed `main()`.

### Build / CI / deploy
- ☐ **[10.1]** `.github/workflows/` is `.gitignore`d — CI never runs on push. Either un-ignore or replicate on alternative provider. **Launch blocker.**
- ☐ **[10.2]** `deploy/docker/{api,web,worker}.Dockerfile` referenced by `release-images.yml` don't exist.
- ☐ **[6.1-helm]** Worker container `command: ["node","dist/worker.js"]` — but `apps/api/build` is `tsc --noEmit`. Either emit JS or switch to `tsx`.
- ☐ **[6.2-helm]** Web/worker have no `livenessProbe`/`readinessProbe`.
- ☐ **[8.1-vsx]** `extensions/vscode/media/icon.png` missing — `vsce package` fails.
- ☐ **[9.1-jb]** JetBrains plugin pinned to platform `243.*`; today's IDEs are `251+`. Widen `untilBuild`.
- ☐ **[11.1-tools]** `tools/loadtest/k6-baseline.js` hits non-existent `/v1/findings` and `/healthz`. Fix endpoints.
- ☐ **[12.1-tools]** `tools/chaos/kill-workers.mjs` selector mismatches Helm labels.
- ☐ **[14.1-docs]** Runbooks reference npm scripts (`rotate:jwt`, `seed:loadtest`, …) that don't exist.

### Compliance & legal
- ☐ **[B5]** Rewrite `/compliance` to honestly state SOC 2 Type II is *in progress*, not shipped.
- ☐ **[M8]** Counsel-reviewed `/privacy`, `/terms`, `/dpa`, `/subprocessors`.
- ☐ **[M9]** Cookie consent banner before PostHog/Plausible fire.

---

## Wave 2 — MEDIUM (first 90 days)

API
- `[M3-api]` Fastify logger `redact` for `req.headers.authorization`, `cookie`, `x-csrf-token`, `*.password`, `*.passwordHash`, `*.refreshTokenHash`.
- `[M4-api]` Protect `/metrics` with static bearer token or bind on localhost-only port.
- `[M5-api]` Replace `try { … } catch { reply.notFound() }` with typed error handling so 401/500 don't get masked as 404.
- `[M7-api]` Zod-validate audit `q`/`action` query params.
- `[M8-api]` Persist SSO `state` for one-time use.
- `[M10-api]` Tenant-guard: prefer `where: { id, organizationId }` over post-filter when possible.

Web
- `[M2-web]` `AbortSignal.timeout(3000)` on all SSR `fetch()`s in `force-dynamic` server components.
- `[M3-web]` Pin `timeZone: "UTC"` + explicit locale in all server-side `Intl.*` calls.
- `[M8-web]` Slug allow-list `^[a-z0-9-]+$` guard before `fs.readFileSync` in `lib/blog.tsx` / `lib/help.tsx`.
- `[M13-web]` Replace `new Function("m","return import(m)")` Sentry hack with real dynamic `import()`.
- `[M14-web]` Sentry `beforeSend` PII scrubber + source-map upload.

Data layer
- `[1.2]` Bound `User.passwordHash` length + add Prisma result-mask extension.
- `[1.5]` `Invoice.amountCents BigInt` + ISO-4217 check constraint.
- `[1.10]` `User.deletedAt` for GDPR-tombstone.
- `[1.12]` Document Prisma connection-pool / pgbouncer DSN params in `.env.example`.
- `[1.13]` `prismaReplica.$extends` rejecting all write ops.
- `[1.14]` Remove `packages/db/.env` from tracking; rotate any creds.
- `[2.3]` Iterative AST visit with depth guard.
- `[2.4]` Branch parse mode on file extension (TSX/JSX/TS/JS); skip unsupported langs with warning.
- `[2.6]` Finding shape: add `column`, `endLine`, `endColumn`, `codeFlow`.

Shared / CLI
- `[3.2]` Zod schemas for every cross-package model; derive `type` via `z.infer`.
- `[3.3]` Add `organizationId` to `findingSchema`.
- `[4.1]` `covenant login` prompts and writes `~/.config/covenant/credentials.json` mode 0o600.
- `[4.3]` Use commander/yargs for CLI arg parsing.

Build / CI
- `[2.1-ci]` Root `npm test` covers every workspace; add a coverage gate.
- `[3.1-ci]` Root flat ESLint + Prettier; pre-commit hook (lefthook).
- `[4.1-ci]` Root `typecheck` covers db + cli.
- `[10.4-ci]` `concurrency:` group on ci.yml.
- `[10.5-ci]` `helm lint`, `size-limit`, `prisma validate` in CI.

---

## Wave 3 — LOW / polish

- `L1-L15` API: helmet style nonces, slug random suffix, per-account login lockout, evidence body-size cap, admin route grants leak, etc.
- `L1-L10` Web: dead i18n + dead components removal, unused Tailwind tokens, metadata descriptions, Twitter card image, OG image verification.
- `1.16, 1.17` Down-migrations doc + `Lead` dedup constraint.
- `MP1-MP9` Sentry DSN doc, demo flag, read-replica wiring, README/PROJECT_SUMMARY drift, OpenAPI from-code generation.

---

## Verification gates

Before shipping:

1. `npm run typecheck` clean across **every** workspace.
2. `npm test` green across every package (add new specs for each fix above).
3. `prisma migrate diff --from-migrations ./migrations --to-schema-datamodel ./schema.prisma --exit-code` returns 0.
4. `prisma migrate deploy` against a fresh Postgres + `npm run db:seed` runs to completion.
5. `helm lint deploy/helm/covenant` 0 errors.
6. `gitleaks detect`, `trufflehog filesystem .` 0 alerts.
7. ZAP baseline against `docker compose up` 0 High/Critical.
8. Playwright smoke: anonymous → `/dashboard` redirects to `/login`; logged-in → `/dashboard` renders.

---

_Revisit this plan at the end of every sprint. Cross out as items land._
