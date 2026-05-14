# Test Hardening Plan — Edge, Security, E2E & Integration

> Status: **Planned**. Owner: TBD. Target: incremental rollout over the next 6–8 sprints.
>
> Goal: take Covenant from "happy-path covered" to "production-grade, adversarial-grade" test coverage. Every public surface (HTTP route, queue worker, CLI command, webhook, scanner, IDE plugin, browser flow) must have:
>
> 1. Happy-path tests
> 2. Edge-case tests (boundary values, empty/null/huge inputs, unicode, timezone, concurrency)
> 3. Security tests (authz, tenant isolation, injection, SSRF, secrets, rate-limits, replay)
> 4. Failure-mode tests (network partitions, DB down, queue full, partial writes, retries)
> 5. Real-user E2E flows (Playwright, multi-tenant, multi-role)
> 6. Integration tests against real services in containers (no mocks for the contract boundary)
>
> Definition of done for the whole plan: ≥90 % branch coverage on `packages/*` and `apps/api/src/routes`, ≥80 % on `apps/web`, mutation score ≥70 % on `packages/analyzer` and `packages/db`, zero high/critical findings in ZAP + Semgrep + npm-audit on CI.

---

## 0. Foundations (Sprint 0 — must land first)

These unblock everything below. Land them before opening any of the per-area tickets.

- [ ] **Test taxonomy doc** — agree on the four tiers below and tag every test file:
  - `*.unit.test.ts` — pure, no I/O, < 50 ms
  - `*.int.test.ts` — Postgres + Redis via Testcontainers, < 5 s
  - `*.contract.test.ts` — Pact / OpenAPI schema checks, no runtime
  - `*.e2e.spec.ts` — Playwright against `docker-compose up`
- [ ] **Coverage gates in CI** — `vitest --coverage` + `c8 check-coverage --branches 90 --functions 90 --lines 90 --statements 90` per package; fail PR on regression.
- [ ] **Mutation testing** — add Stryker for `packages/analyzer`, `packages/db`, `apps/api/src/lib/tenant-guard`. Threshold: 70 %.
- [ ] **Test-data factories** — replace ad-hoc object literals with `@faker-js/faker` + typed builders in `packages/shared/src/test/factories/*`. One factory per Prisma model.
- [ ] **Deterministic clock + RNG** — `vi.useFakeTimers()` helper + seeded `crypto.randomBytes` shim exported from `packages/shared/src/test/clock.ts`.
- [ ] **Property-based testing** — adopt `fast-check` for `packages/analyzer` parsers and `packages/shared/src/validation/*`.
- [ ] **Seed-data script** — `packages/db/prisma/seed.test.ts` that produces 3 tenants × 5 users × 50 scans for E2E.
- [ ] **Testcontainers harness** — single `packages/shared/src/test/containers.ts` exporting `withPostgres()`, `withRedis()`, `withMinio()`, `withMailhog()`, `withWiremock()`. Reuse across all `*.int.test.ts`.
- [ ] **CI matrix** — split GitHub Actions job into `unit`, `int`, `contract`, `e2e`, `security`, `mutation`. Parallel; total wall time ≤ 12 min.

---

## 1. `apps/api` — HTTP routes, queue workers, webhooks

### 1.1 Per-route edge & negative tests
For every route under `apps/api/src/routes/**` create `<route>.edge.test.ts` covering:

- [ ] **Auth matrix** — anonymous, expired JWT, revoked JWT, wrong tenant JWT, valid-but-insufficient role, valid admin. Assert exact status (401 / 403) and that no body leaks resource existence.
- [ ] **Tenant isolation** — tenant A cannot read/write/list tenant B resources by guessing IDs (incl. UUID enumeration, integer ID, slug). One row of each model is created in tenant B in `beforeEach`; every test asserts 404 (not 403) when accessed from tenant A.
- [ ] **Input fuzzing** — `fast-check` arbitraries for body, query, params, headers. Assert: never 500, always typed JSON error, never echoes raw input back.
- [ ] **Boundary values** — `''`, `' '`, max-length+1, unicode (`'𝒜🔥👨‍👩‍👧'`), RTL, NUL byte, JSON in JSON, deeply nested (10 k levels), 10 MB body, chunked transfer, gzip bomb (rejected).
- [ ] **Method / content-type negotiation** — wrong verb → 405; wrong `Content-Type` → 415; missing `Accept` → default JSON.
- [ ] **Rate limiting** — burst above limit returns 429 with `Retry-After`; per-tenant bucket, not global; bypass attempts via header spoofing fail.
- [ ] **Idempotency** — POSTs that accept `Idempotency-Key` return same response on retry within 24 h, different key → new resource.
- [ ] **Concurrency** — `Promise.all` of 50 conflicting writes; assert exactly one winner, others get 409, no row corruption (verified by post-condition query).
- [ ] **Pagination** — cursor stability under concurrent inserts/deletes, `limit=0`, `limit=10000` (clamped), invalid cursor → 400.

### 1.2 Webhook endpoints (`/webhooks/github`, `/webhooks/stripe`, `/webhooks/slack`)
- [ ] Signature verification: missing, wrong, replayed (timestamp > 5 min old), wrong algorithm, length-extension attempt.
- [ ] Replay protection: same `delivery-id` twice → idempotent.
- [ ] Out-of-order delivery: install → uninstall → install within 1 s; final state is "installed".
- [ ] Payload size > 25 MB → 413.
- [ ] Malformed JSON → 400, no stack trace.
- [ ] Stripe event types not in allow-list → ignored with 200 (logged), no DB write.
- [ ] Slack URL-verification challenge round-trip.

### 1.3 Queue workers (`apps/api/src/workers/**`)
- [ ] Job retried after worker crash (kill signal mid-process) — exactly-once side-effect via outbox table.
- [ ] Poison message → moved to DLQ after N attempts, alert fired.
- [ ] Slow consumer: 1 000 jobs queued, all drain within SLA.
- [ ] Visibility timeout exceeded → job re-claimed by another worker, no duplicate writes (assert via unique constraint).
- [ ] Graceful shutdown on SIGTERM: in-flight jobs finish, no new jobs claimed, queue closes cleanly within 30 s.

---

## 2. `packages/analyzer` — scanner core

- [ ] **Property tests** with `fast-check` for every parser: round-trip `parse(serialize(x)) === x` for any valid AST.
- [ ] **Malformed input corpus** — drop in `packages/analyzer/test/corpus/malformed/*` with files from oss-fuzz crashes for tree-sitter, semgrep, esprima. Each must exit cleanly (no panic, no OOM > 256 MB, no hang > 5 s).
- [ ] **Mutation testing** target ≥75 %.
- [ ] **Symlink / path-traversal** — repo with `../../etc/passwd` symlink must be skipped, logged, not followed.
- [ ] **Zip-slip / tar-bomb** — uploaded archive with `..` paths or 1 GB expansion is rejected before extraction.
- [ ] **Resource limits** — file > 10 MB skipped with `FILE_TOO_LARGE` finding; repo > 5 GB rejected at clone time.
- [ ] **Unicode normalization** — identifiers using NFC vs NFD must be treated as same symbol; homoglyph (Cyrillic `а` vs Latin `a`) flagged as finding.
- [ ] **Determinism** — same repo + same rules → byte-identical report (sort findings, fix timestamps).
- [ ] **Snapshot tests** for each rule against `tools/sample-repos/*` (already listed in `docs/sample-repos.md`).

---

## 3. `packages/db` — Prisma layer & migrations

- [ ] **Migration round-trip** — for every migration: apply on empty DB, apply on prod-snapshot, rollback (down.sql), re-apply. Compare `pg_dump --schema-only` to golden file.
- [ ] **Tenant-guard middleware** — property test: for any random query built via the Prisma client, the generated SQL must contain `WHERE "tenantId" = $1`. Use `prisma.$on('query')` to capture and assert.
- [ ] **Concurrent transactions** — repeatable-read isolation tests for `acquireLock`, `incrementUsage`, `markScanComplete`.
- [ ] **Connection-pool exhaustion** — 200 concurrent requests with pool size 10; all succeed, p99 < 2 s, no `P1017`.
- [ ] **Backup/restore drill** — `pg_basebackup` → restore to fresh container → all integration tests pass against restored DB. Schedule monthly in CI.
- [ ] **Row-level-security** — if RLS is on (check `pg_policies`), test with a user that bypasses Prisma and connects with a tenant role; cross-tenant SELECT must return 0 rows.

---

## 4. `apps/web` — Next.js UI

### 4.1 Component / unit
- [ ] Storybook + `@storybook/test` for every interactive component; play-functions assert keyboard nav, focus trap, ARIA.
- [ ] `axe-core` per story → zero violations gate.
- [ ] Visual regression via `@chromatic-com/playwright` or `loki`; baseline checked in.

### 4.2 E2E (Playwright, `apps/web/e2e/**`)
Real-user flows, run against `docker-compose up` (Postgres + Redis + API + web):

- [ ] **Onboarding** — sign up → verify email (mailhog) → install GitHub App (wiremock GitHub API) → first scan → see findings.
- [ ] **Multi-tenant switcher** — user in 2 orgs; switch context; URLs and data update; no data from prior tenant remains in memory (assert via DOM + network).
- [ ] **Role matrix** — owner / admin / member / viewer; for each, walk all primary nav items, assert allowed actions present and forbidden actions absent (no greyed-out forbidden buttons).
- [ ] **Billing** — Stripe test mode: subscribe → upgrade → downgrade → cancel → resubscribe; webhook lag simulated (5 s); UI eventually consistent.
- [ ] **Slow network** — Playwright `route.continue({ delay: 3000 })`; loading states visible, no double-submit, no stale data after navigation.
- [ ] **Offline / flaky** — service-worker offline mode; queued mutations replay on reconnect.
- [ ] **Accessibility full-page** — axe scan on every visited route; 0 critical, 0 serious.
- [ ] **i18n** — run full E2E in `en`, `es`, `ja`, `ar` (RTL); no overflow, no missing keys.
- [ ] **Mobile viewport** — iPhone 14, Pixel 7, iPad; tap targets ≥ 44 px; no horizontal scroll.
- [ ] **Browser matrix** — Chromium, Firefox, WebKit on CI.
- [ ] **Long session** — 8 h idle then click; token refresh transparent; no logout.

---

## 5. Integration — cross-service contracts

- [ ] **Pact** consumer tests in `apps/web` and `packages/cli`; provider verification in `apps/api`. Broker = local file in CI artifact.
- [ ] **OpenAPI conformance** — `apps/api/openapi.yaml` validated against every route at boot (Zod-to-OpenAPI). `dredd` runs the spec against the live API in CI.
- [ ] **GitHub App** — wiremock fixtures for: install, uninstall, repo added/removed, push, PR opened, check_run requested, rate-limit 403, secondary rate-limit. Each replayed in `apps/api/test/integration/github/*.int.test.ts`.
- [ ] **Stripe** — `stripe-mock` container; full subscription lifecycle + dispute + refund + tax-id update.
- [ ] **Slack** — slash command, interactive button, modal submit; signature verification end-to-end.
- [ ] **VS Code extension** ↔ API — `@vscode/test-electron` headless; sign-in flow, scan-from-editor, jump-to-finding, settings sync.
- [ ] **JetBrains plugin** ↔ API — Gradle `runIdeForUiTests` + Robot plugin; same three flows.
- [ ] **CLI** — `packages/cli` against ephemeral API container; `covenant scan`, `covenant login`, `covenant report --format sarif|json|md`; SARIF validated against schema.
- [ ] **Helm chart** — `helm template` + `kubeval` + `kube-score` in CI; deploy to `kind` cluster, run smoke E2E.

---

## 6. Security — adversarial test pack

> One folder: `tests/security/**`. Run nightly + on PRs touching auth, billing, or webhooks.

- [ ] **OWASP Top-10 ZAP** baseline + full scan against ephemeral stack. Rules in `tools/security/zap-rules.tsv` already exist — wire them in.
- [ ] **Semgrep** ruleset: `p/owasp-top-ten`, `p/javascript`, `p/typescript`, `p/react`, `p/nextjs`, `p/secrets`, plus custom rules for tenant-guard bypass.
- [ ] **Trivy** for container images and SBOM (CycloneDX).
- [ ] **`npm audit --audit-level=high`** gate; Renovate already auto-PRs.
- [ ] **Secret scanning** — `gitleaks` + `trufflehog filesystem` in pre-commit + CI.
- [ ] **Authz fuzzer** — generate random `(actor, action, resource)` triples; assert against policy file; any drift fails build.
- [ ] **Tenant-leak red-team script** — `tools/security/tenant-leak-probe.ts` already referenced in `content/blog/anatomy-of-a-tenant-leak.mdx`; wire as scheduled CI job.
- [ ] **JWT abuse** — `alg=none`, key-confusion (RS256→HS256), expired, wrong issuer, wrong audience, kid traversal, JWKS cache poisoning.
- [ ] **SSRF** — every URL-accepting input (webhook target, repo URL, OAuth callback) tested against `169.254.169.254`, `localhost`, `0.0.0.0`, IPv6 `::1`, DNS rebinding (via `httpbin` + custom resolver).
- [ ] **Open redirect** — `?next=https://evil.com` rejected; only same-origin or allow-listed.
- [ ] **CSRF** — state-changing routes require `Origin` / `Sec-Fetch-Site` checks or CSRF token; missing → 403.
- [ ] **CORS** — allow-list enforced; `*` only on truly public endpoints; credentials never with `*`.
- [ ] **CSP** — Playwright captures violations; zero allowed in production build.
- [ ] **Cookie flags** — `HttpOnly`, `Secure`, `SameSite=Lax|Strict`; tested in E2E.
- [ ] **Password / API-token policy** — bcrypt cost ≥ 12, tokens ≥ 32 bytes, rotated on privilege change; brute-force lockout after 10 attempts / 15 min.
- [ ] **Prototype-pollution** — fuzz body parser; `__proto__`, `constructor.prototype` keys stripped or rejected.
- [ ] **ReDoS** — every regex run through `safe-regex` lint; long-pump inputs (`'a'.repeat(100_000)`) finish < 100 ms.
- [ ] **GraphQL** (if introduced) — depth limit, complexity limit, introspection off in prod.
- [ ] **File upload** — magic-byte sniff, MIME mismatch rejected, AV scan via ClamAV container, stored outside webroot, served with `Content-Disposition: attachment`.
- [ ] **Logging** — assert no PII / secret / token / cookie / auth-header in logs (regex scan over captured pino output in tests).
- [ ] **Error responses** — stack traces never returned in prod mode; verified by snapshot.

---

## 7. Failure-mode & chaos (already partial — `tools/chaos/kill-workers.mjs`)

- [ ] **Toxiproxy** between API ↔ Postgres, API ↔ Redis: latency 500 ms, 50 % packet loss, full outage 30 s. Assert no 5xx visible to user (degraded responses with `Retry-After` ok).
- [ ] **Disk full** simulation in container; writes fail gracefully, alerts fire.
- [ ] **Clock skew** ± 5 min between services; signed requests still validate within tolerance.
- [ ] **Out-of-memory** — worker hits cgroup limit; restarted by orchestrator; queue resumes.
- [ ] **DR drill** — quarterly, scripted in `docs/runbooks/dr-drill.md`; produce RTO / RPO report.
- [ ] **Load test** — `tools/loadtest/k6-baseline.js` gate: p95 < 300 ms at 200 RPS, error rate < 0.1 %.

---

## 8. Observability of tests themselves

- [ ] Tests emit OpenTelemetry spans → Jaeger in CI artifact for the slowest 10.
- [ ] Flaky-test detector: tag any test that fails ≥ 1 of last 50 runs; auto-issue.
- [ ] Coverage diff posted as PR comment.
- [ ] Test-runtime budget per file (annotate with `@maxDuration`).

---

## 9. Rollout schedule (suggested)

| Sprint | Focus                                               | Exit criteria                                        |
| ------ | --------------------------------------------------- | ---------------------------------------------------- |
| 0      | Foundations §0                                      | CI tiers split, factories + containers helpers land  |
| 1      | API edge & tenant-isolation §1.1, §1.2              | 100 % routes have `*.edge.test.ts`                   |
| 2      | Analyzer fuzz & mutation §2                         | Mutation ≥ 70 %, fuzz corpus in CI                   |
| 3      | DB migrations & tenant-guard property tests §3      | Schema diff gate green                               |
| 4      | Web E2E onboarding + role matrix §4.2 (first half)  | 5 critical user journeys green on 3 browsers         |
| 5      | Web E2E billing + a11y + i18n §4.2 (second half)    | axe 0 critical, all 4 locales pass                   |
| 6      | Integration §5 (Pact, OpenAPI, GitHub, Stripe)     | Provider verification green                          |
| 7      | Security pack §6                                    | ZAP + Semgrep + authz-fuzzer 0 high/critical         |
| 8      | Chaos + observability §7, §8                        | Toxiproxy suite + flaky detector live                |

---

## 10. Open questions to resolve before Sprint 1

- Mutation tool: Stryker vs custom? (Default: Stryker.)
- Visual-regression hosting: Chromatic (paid) vs self-hosted Loki? (Default: Loki for OSS, Chromatic for prod.)
- Pact broker: Pactflow vs file-artifact? (Default: file-artifact until ≥ 3 consumers.)
- Browser matrix in CI cost — keep WebKit on PRs or only nightly?
- Where do scheduled red-team scripts run — separate repo or here under `tests/security/redteam/`?

---

_Plan authored: 2026-04-30. Revisit at end of every sprint and check items off._
