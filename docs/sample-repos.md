# Reference apps for Covenant — Session 6 §3

Three small, deliberately-flawed reference applications live in a
sibling repository: **covenant-demo-repo** (TypeScript-first SaaS),
**covenant-demo-marketplace** (multi-tenant marketplace), and
**covenant-demo-internal-tool** (internal admin app). Each ships
with Covenant pre-installed and a labelled exercise so a new user
can verify their setup against a known answer key.

## covenant-demo-repo (small SaaS)

Stack: Next.js 15, Fastify, Prisma, Postgres.

Planted issues (find them all to graduate):

1. `apps/api/src/routes/bookings.ts` — missing `organizationId`
   predicate on `prisma.booking.findMany` (CRITICAL, A7).
2. `apps/web/src/app/api/checkout/route.ts` — Stripe live key in
   `vercel.json` (HIGH, A11).
3. `packages/db/prisma/schema.prisma` — `User.email` not unique
   per-tenant (MEDIUM, A4).
4. `apps/api/src/services/notify.ts` — empty `catch` swallows a
   webhook signature failure (MEDIUM, A6).

## covenant-demo-marketplace (multi-tenant marketplace)

Stack: Remix, Drizzle, MySQL.

Planted issues:

1. RLS off on `listings` after a forgotten migration (CRITICAL, A7).
2. CORS wildcard with credentials on the seller API (HIGH, A16).
3. Unverified Stripe webhook handler (HIGH, A15).
4. Cron job retries indefinitely without a DLQ (MEDIUM, A14).

## covenant-demo-internal-tool

Stack: Vite + React, Hono on Cloudflare Workers, D1.

Planted issues:

1. Admin route bypass via `?role=admin` query string (CRITICAL, A8).
2. PII (email, phone) logged at info level (MEDIUM, A13).
3. Service worker caches `/admin` responses across users (HIGH, A7).
4. AGPL dependency in a closed-source build (MEDIUM, A12).

## Exercise format

Each repo's README includes:

- A `find-these.md` answer key (severity, agent, file, line).
- A `make scan` target that runs Covenant locally and checks the
  output against the key.
- A "graduation" workflow that fails CI until every planted issue
  is resolved by the user's PR.

## Updating the references

The reference repos are versioned independently. Tag releases
follow `covenant-demo-repo@vYYYY.MM.DD`. When a new agent ships,
add at least one planted issue that exercises it across the three
reference apps so the answer keys grow with the platform.
