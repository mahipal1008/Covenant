# Pre-launch Pen Test — Session 8 §4

> Pass condition: zero unresolved Critical or High findings; every Medium
> has a triage note with either a fix PR or an explicit risk acceptance
> signed by the security owner.

We run a two-track program: an **automated** pass on every release
branch (OWASP ZAP) and a **manual** pass before each major launch
(this checklist, optionally augmented by a paid engagement).

## Track 1 — Automated (OWASP ZAP)

- Baseline scan runs in CI on `release/*` and `main` (see `.github/workflows/zap-scan.yml`).
- Full active scan runs weekly and on demand via workflow dispatch.
- Rule overrides live in `tools/security/zap-rules.tsv` — every override has a written reason.
- Findings auto-open as GitHub issues labelled `security/zap`.

## Track 2 — Manual (OWASP Top 10 + tenant-isolation)

For each item: **status** (✓ pass / ✗ fail / N/A), **evidence link**, **owner**.

### A01 Broken Access Control
- [ ] Tenant-guard extension covers every Prisma model with `@sensitivity:` annotation.
- [ ] Cross-org access attempt returns 404 (not 403) — verified via `apps/api/src/tenant-guard.test.ts`.
- [ ] Admin-only routes reject non-admin tokens.
- [ ] IDOR on `/v1/scans/:id`, `/v1/findings/:id`, `/v1/repos/:id`.

### A02 Cryptographic Failures
- [ ] All secrets at rest encrypted (KMS-managed keys).
- [ ] TLS 1.2+ enforced on every public endpoint.
- [ ] Webhook payloads signed with HMAC; constant-time compare.
- [ ] No customer data in logs (PII redaction tested).

### A03 Injection
- [ ] Every Prisma query is parameterised (no `$queryRawUnsafe` without allow-listed inputs).
- [ ] Shell-out paths in CLI use `execFile`, never `exec`.
- [ ] HTML rendering escapes user content (verified in components and MDX).

### A04 Insecure Design
- [ ] Threat model reviewed for new surfaces in this release.
- [ ] Session 5 ADR cadence followed: every new public route has an ADR.

### A05 Security Misconfiguration
- [ ] CSP enforced (not report-only) on app subdomain.
- [ ] HSTS, X-Frame-Options, Referrer-Policy headers present.
- [ ] No verbose error responses in prod (`NODE_ENV=production`).
- [ ] Default Postgres / Redis ports closed at the security group.

### A06 Vulnerable and Outdated Components
- [ ] `npm audit --omit=dev` returns no Critical / High.
- [ ] Renovate up-to-date (no PRs older than 14 days unless deferred with rationale).
- [ ] Container base images pinned by digest; rebuilt within last 30 days.

### A07 Identification & Authentication Failures
- [ ] WorkOS SSO test org logs in successfully.
- [ ] Magic-link tokens are single-use, short-lived, and bound to IP+UA.
- [ ] Session cookies HttpOnly, Secure, SameSite=Lax.
- [ ] Brute-force throttling on login + password reset.

### A08 Software & Data Integrity Failures
- [ ] CI artifacts signed (cosign keyless via OIDC — workflow shipped Session 7 §9).
- [ ] CLI npm publish includes provenance attestation (Session 7 §3).
- [ ] PyPI publish via Trusted Publisher OIDC (Session 7 §4).

### A09 Security Logging & Monitoring Failures
- [ ] Every privileged action emits an `AuditEvent` row.
- [ ] Failed-login spike triggers Sentry + PagerDuty.
- [ ] Statuspage incident automation tested.

### A10 SSRF
- [ ] Outbound HTTP calls go through the SSRF allow-list.
- [ ] User-supplied URLs (webhooks, repo URLs) are validated against private/loopback ranges.

### Tenant-isolation specific
- [ ] Forced-browse with another org's scan ID returns 404.
- [ ] JWT for org A cannot read org B's evidence files (S3 prefix isolation).
- [ ] Prisma extension blocks cross-org joins (caught in `tenant-guard.test.ts`).
- [ ] Worker job payload carries `organizationId` and is re-validated on every step.

## Optional paid engagement

If budget allows ($5–15k), we recommend a 5-day grey-box engagement with:

- A scoped staging environment with three tenants (Indie / Startup / Enterprise) pre-seeded.
- Read-only Prisma schema and the tenant-guard extension shared up-front.
- Focus areas: tenant isolation, webhook integrity, CLI/SDK auth, PR-comment XSS.

Vendor selection is outside the scope of this runbook.

## Sign-off

- [ ] All Critical & High items closed.
- [ ] Medium items either fixed or signed off with a risk-acceptance note.
- [ ] Pen-test report archived in `docs/postmortems/pentest-<YYYY-MM-DD>.md`.
- [ ] CISO (or acting security owner) signature recorded.
