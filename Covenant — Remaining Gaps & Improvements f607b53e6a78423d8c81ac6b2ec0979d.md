# Covenant — Remaining Gaps & Improvements

## Overview

<aside>
🎯

The master plan covers the **core build** — DB, backend, 28 routes, 20 agents, dashboard, integrations, hardening. This addendum covers what is **not yet planned** but a senior engineer would expect before calling Covenant a complete, sellable, production-grade SaaS.

</aside>

This is a **gap list**, not a rewrite. Each section below is a category of work that is missing or under-specified in the master plan. Hand any section to the implementing AI as its own scoped initiative.

**Reading order:** sections 1–4 are blockers for charging real money; 5–8 are blockers for enterprise; 9–12 are blockers for trust; 13–16 round out a true product surface; 17–18 are the ops + growth scaffolding that lets the company scale beyond engineering.

## Your Preferences

- **No code in this addendum** — only what is missing, why it matters, and what "done" looks like. Implementing AI will write the code.
- **Local-only git** preference preserved across every section.
- **Definition of Done** from the master plan applies to every gap closed here.
- Every gap section can be its own PR or its own dedicated phase; do not force them into the original A→F sequence.
- Priorities (P0 / P1 / P2) are tagged on every section so the AI can sequence by business impact.

## Implementation Plan

### Step 1: 1. Customer-facing account surface (P0)

What is missing today: there is no real **self-serve account control** beyond login. A paying customer cannot fully run their account without emailing support.

**Gaps to close:**

- **Personal API tokens** — issue / list / revoke; scoped (read / write / admin); shown once at create; hashed at rest; per-token rate limit.
- **Outbound webhooks for customers** — allow customers to subscribe to events (`scan.completed`, `finding.created`, `contract.violated`); HMAC-signed; replay protection; delivery log + manual retry UI.
- **Audit log UI** — show every action taken in the org with actor, IP, user-agent; filter and export to CSV/JSON; required for SOC 2.
- **Notification preferences** — per-user matrix (email / Slack / in-app) × event type; quiet hours; digest vs realtime.
- **Data export (GDPR Article 20)** — one-click full org export as a signed, downloadable archive. Background job, email when ready.
- **Account deletion / org deletion** — staged: deactivate → 30-day soft delete → hard purge; confirmation typed phrase; admin override.
- **Email transactional templates** — Resend or Postmark; React Email components; verified domain; bounce + complaint handling.
- **Cookie banner + consent** — GDPR/CCPA compliant; analytics opt-out wired through PostHog/Plausible.
- **First-run onboarding wizard** — 4 steps: connect repo → select branch → run first scan → invite teammates. Skippable but high-conversion.

### Step 2: 2. Billing depth (P0)

The master plan adds Stripe Checkout but stops there. A real billing surface needs more.

**Gaps to close:**

- **Metered usage** — count scans, repos, contracts evaluated; Stripe usage records; overage tiers.
- **Plan quotas with soft and hard limits** — soft = warning banner + email; hard = feature blocked with upgrade CTA.
- **Trial logic** — 14-day free trial on every paid plan; trial-end email sequence; auto-downgrade to free.
- **Dunning** — 3-stage email sequence on failed payment; in-app banner; pause workspace at day 14.
- **Invoice PDFs** — generated from Stripe; downloadable from `/settings/billing`.
- **Tax / VAT / GST** — Stripe Tax enabled; address collection; B2B reverse charge for EU.
- **Coupons & promos** — admin can issue; tracked per org.
- **Annual vs monthly toggle** — discount surfaced; proration handled by Stripe.
- **Customer Portal deep link** — for self-serve plan changes, payment method, invoice history.
- **Reseller / partner billing** — flag on org; bills go to partner not end customer (needed for agencies).

### Step 3: 3. Trust, compliance & legal surface (P0 for enterprise sales)

Security customers ask for a trust portal in the first 5 minutes. Without it, no enterprise sale closes.

**Gaps to close:**

- **Trust portal (`/trust`)** — single page with: SOC 2 Type II report (under NDA via Drata or Vanta), penetration test summary, encryption posture, data flow diagram, list of subprocessors with last-update date, status page link.
- **DPA (Data Processing Agreement)** — published, signable in-app for self-serve; pre-signed for enterprise.
- **Subprocessor list page** — auto-updated when adding a new vendor; email customers 30 days before adding.
- **Privacy policy & ToS rewrite** — by counsel; covers AI training (Covenant does not train on customer code), retention, deletion, breach notification.
- **SOC 2 Type II observation window** — start date, controls in scope, evidence collection automated where possible (audit log, access reviews, change management).
- **Penetration test** — scoped 3rd-party engagement before GA; remediations tracked.
- **Bug bounty program** — HackerOne or Intigriti; scope, rewards, safe-harbor language.
- **Cookie audit** — every cookie classified (strictly necessary / functional / analytics); honored by consent banner.
- **Subprocessor email notification system** — required by DPA.
- **Data residency disclosure** — even if you are US-only at launch, say so explicitly.

### Step 4: 4. Reliability engineering (P0 for paid customers)

The master plan has logs, traces, and metrics. It does not have **a reliability practice**.

**Gaps to close:**

- **SLO / SLI / SLA definitions** — published targets: API availability 99.9%, dashboard p95 < 250ms, scan completion p95 < 5min for repos < 1M LOC. Tied to error budget policy.
- **Error budget policy** — when budget is burned: freeze feature work, only reliability fixes ship.
- **On-call rotation + PagerDuty** — runbooks for top 10 alerts: API down, queue stuck, DB high CPU, Stripe webhook failed, GitHub webhook delayed, scan timeout, OOM, disk full, certificate expiring, deploy failed.
- **Incident response process** — severity matrix (Sev1 / Sev2 / Sev3); commander role; comms templates; postmortem template (blameless, action-item-driven).
- **Status page** — [Statuspage.io](http://Statuspage.io) or Atlassian Statuspage; auto-updated from probes; subscribe via email/Slack/RSS.
- **Backup verification** — nightly backup + weekly **restore test** to a scratch DB; alert if restore fails.
- **Point-in-time recovery** — Postgres WAL archiving; 7-day PITR window; tested.
- **Disaster recovery plan** — RTO 4h, RPO 15min; tabletop exercise quarterly.
- **Chaos drills** — monthly: kill a worker, fail a Redis, blackhole an integration; verify graceful degradation.
- **Cost monitoring per tenant** — aggregate LLM, DB, queue, egress cost per org; flag outliers; cap daily spend per tenant.

### Step 5: 5. Enterprise tier features (P1)

Sold separately, gated by feature flag, billed at $1,499+/mo per the original plan.

**Gaps to close:**

- **SSO (SAML 2.0 + OIDC)** — via WorkOS or BoxyHQ Jackson; tested with Okta, Azure AD, Google Workspace; SP-initiated and IdP-initiated.
- **SCIM 2.0 provisioning** — auto-create / update / deactivate users from the IdP.
- **IP allowlist per org** — CIDR list; admin UI; enforced at API gateway.
- **Just-in-time access requests** — temporary elevation with approval workflow; audit logged.
- **Custom data retention policies** — configurable per org (30 / 90 / 365 days / forever).
- **BYO LLM keys** — per-org OpenAI / Anthropic / Azure / Bedrock; key stored in KMS; falls back to platform key if absent.
- **Custom contracts (Intent DSL)** — dedicated namespace, versioning, approval workflow; per the original `/roadmap`.
- **Private deployment / VPC peering** — single-tenant cluster on customer's preferred region.
- **Custom SLAs and signed agreements** — managed via legal, not self-serve.
- **White-labeling** — custom domain, logo, accent color, email-from address (resellers only).

### Step 6: 6. Self-hosted / air-gapped option (P1 for high-security buyers)

Covenant is a *security* product. Banks and defense will ask for self-host. Plan it now even if it ships in v1.5.

**Gaps to close:**

- **Helm chart at `deploy/helm/covenant/`** — values for dev/staging/prod with sane defaults.
- **Docker images for `api`, `web`, `worker`** — multi-arch (amd64+arm64); SBOM (CycloneDX) attached; signed via cosign.
- **Air-gapped install path** — bundle all images + helm chart as a tarball; offline license activation; instructions for offline LLM (Ollama).
- **License management** — per-seat license keys; verified via offline-friendly signature; expiry warnings.
- **In-cluster observability** — bundled Loki + Grafana + Prometheus stack as an opt-in.
- **Upgrade path with schema migrations** — semver, blue-green for stateless, online migration for DB.
- **Customer data backup tooling** — `covenant-backup` CLI that exports DB + object storage to a single tarball.
- **Hardening guide** — TLS, mTLS between services, rotation runbooks, network policies.
- **Support contract terms** — bug-fix vs feature, response times, security advisory channel.

### Step 7: 7. Product extension surface (P1 for stickiness)

The product gets sticky when it lives in the developer's tools, not just on a website.

**Gaps to close:**

- **CLI (`covenant`)** — `init`, `scan`, `status`, `login`; runs scans locally; output as text or SARIF; usable in CI without our GitHub App.
- **TypeScript SDK** — generated from OpenAPI; published to npm; tree-shakable.
- **Python SDK** — generated from OpenAPI; published to PyPI; for data-team users.
- **VS Code extension** — show findings inline as squiggles; "why was this flagged?" hover; one-click suppress with audit.
- **JetBrains plugin** — same surface as VS Code, for IntelliJ family.
- **GitHub Action** — drop-in `covenant/scan@v1` for repos that don't install the App.
- **GitLab CI template + Bitbucket Pipe** — parity for non-GitHub customers.
- **Pre-commit hook** — `covenant pre-commit` blocks the riskiest classes locally.
- **SARIF export** — every scan downloadable as SARIF for GitHub Code Scanning, Sonar, etc.
- **Code review integration** — CodeRabbit-style PR comments on top of A20 PR Context Enricher (deeper line-by-line review for paid plans).

### Step 8: 8. AI / LLM safety & cost controls (P1)

Several agents call LLMs (A2 Archaeologist, A6 Changelog, A11 Intent DSL compile, A19 Onboarding). Without safety + cost controls this becomes a blast radius.

**Gaps to close:**

- **Prompt injection defenses** — input sanitization for any user-controlled string injected into prompts; system-prompt locking; never echo customer code straight into a tool-using agent.
- **PII / secret redaction** — pre-LLM scrubber that redacts emails, tokens, keys, customer-specific identifiers from prompts and from outputs.
- **Output validation** — every LLM response parsed against a Zod schema; reject and retry on shape failure; max 3 retries.
- **Cost guardrails** — per-org daily/monthly $ cap; soft warn → throttle → block; visible in `/settings/billing`.
- **Token usage telemetry** — record every call's input/output tokens, cost, model, agent; surface in admin dashboard.
- **Model selection per task** — cheap model (gpt-4o-mini / claude-haiku) for summarization; reasoning model only when justified.
- **Caching of LLM outputs** — content-addressed by `(model, prompt-hash)`; saves 30–60% in repeat scans.
- **Customer toggle: AI on/off per org** — for security-paranoid customers; agents that need LLM degrade gracefully or are disabled.
- **Privacy guarantee** — written policy: customer code is never used to train models; pass-through only; no logs of code content beyond TTL.

### Step 9: 9. Advanced security hardening (P1)

Helmet + rate-limit + JWT is table stakes. A security product needs more.

**Gaps to close:**

- **CSP report-only → enforced** — start in `report-only`, collect violations, then enforce strict CSP including `script-src 'self' 'nonce-…'`.
- **COOP / COEP / CORP** — set for cross-origin isolation where applicable.
- **Subresource Integrity (SRI)** — for any third-party CDN script.
- **Dependency pinning policy** — exact versions in `package.json`; no `^` or `~`; Renovate PRs reviewed.
- **Secret rotation runbook** — JWKS keys, DB password, Stripe webhook secret, GitHub App private key, Slack signing secret. Each with rotation cadence and step-by-step.
- **Scan sandboxing** — when running customer code (analyzers walking ASTs), run in a Firecracker microVM or gVisor container; no network egress; CPU/memory limits.
- **Tenancy chaos tests** — automated test suite that randomly attempts cross-tenant reads/writes and asserts every one fails.
- **Differential-privacy aggregates** — when showing benchmark stats across customers, ensure no single-tenant data is recoverable.
- **Secret scanning in customer code** — extend A7 with secret-detection rules (Gitleaks-style) and hand the finding to the Multi-Tenant Leak Detector flow.
- **mTLS between services** — once in k8s; use Linkerd or Istio sidecar.

### Step 10: 10. Internationalization, accessibility depth, browser support (P1)

The master plan has axe-core checks. That is a 10% of the a11y story. International customers also need locale support.

**Gaps to close:**

- **i18n framework** — `next-intl` wired; ICU message format; first locales: en, es, fr, de, ja, hi (target market includes India per `dpdp` reference).
- **Locale-aware dates, numbers, currencies** — never hardcode `en-US`.
- **RTL support** — for future Arabic/Hebrew; logical CSS properties (`inline-start` not `left`).
- **Manual screen reader testing** — VoiceOver (Safari macOS), NVDA (Firefox Windows), TalkBack (Chrome Android) on the dashboard, scan report, and contract editor.
- **Keyboard journeys** — full audit; every flow completable without a mouse.
- **Color-only-conveys-meaning audit** — every status badge has an icon or text in addition to color.
- **High-contrast mode** — `forced-colors` media query honored.
- **Reduced-data mode** — `prefers-reduced-data` disables auto-refresh, heavy charts.
- **Browser support matrix** — published: last 2 of Chrome, Edge, Firefox, Safari; Safari 16+ minimum.
- **Mobile app or PWA** — at minimum, installable PWA for the dashboard so on-call engineers can triage from a phone.

### Step 11: 11. Marketing site & growth scaffolding (P1)

33 marketing routes shipped. None of the growth instrumentation is wired.

**Gaps to close:**

- **Analytics** — PostHog or Plausible; consent-aware; 25 named events (signup_started, repo_connected, scan_started, scan_completed, finding_acked, upgrade_clicked, …).
- **Lead capture** — `/contact`, `/demo`, `/pricing` forms write to CRM (HubSpot or Attio); double-opt-in.
- **Marketing automation** — drip sequences (trial day 1/3/7/13), webinar, customer story.
- **SEO depth** — JSON-LD `Organization`, `Product`, `FAQPage`, `BreadcrumbList`; canonical tags; per-route metadata.
- **Open Graph audit** — every public route has a hand-authored OG image (not just generic).
- **Sitemap quality** — exclude product routes; include all marketing + blog + changelog.
- **Blog pipeline** — MDX in repo, RSS feed, auto-tweet on publish.
- **Customer story production process** — template, interview script, approval workflow, embed widget for social proof on `/customers`.
- **Pricing experiments** — feature-flagged copy variants; A/B framework via PostHog.
- **Conversion tracking** — UTM capture all the way to paid conversion; attribution model documented.
- **NPS / CSAT in product** — `/dashboard` quarterly micro-survey; results bucketed by plan.

### Step 12: 12. Onboarding & demo realism (P1)

Today the dashboard is impressive on first load because of seeded fixtures. After signup, a real org's dashboard is empty for several minutes — that is the conversion killer.

**Gaps to close:**

- **"Try it on a sample repo" path** — one-click clone of a curated demo repo into the user's org so the dashboard fills in <30 seconds without their own GitHub install.
- **Progressive disclosure** — the dashboard reveals sections as scans complete (Architect first, then Security, then Intelligence) with skeletons explaining what's coming.
- **Empty-state coaching cards** — every empty section has a primary CTA, a secondary "Why this matters" link, and a 30-second video.
- **Demo org provisioning flag** — `org.isDemo = true` so it can be replaced as soon as the user connects a real repo.
- **Replay tour** — `?tour=onboarding` URL re-runs the welcome tour anytime.
- **Sample exploits** — for the demo data, link to a real-looking PR diff that triggers each agent so users see the value.
- **Time-to-first-value metric** — track signup → first scan completed → first finding acknowledged; instrument every drop-off.

### Step 13: 13. Admin / support tooling (P1 for ops scale)

The team needs an internal-only surface to actually run the company.

**Gaps to close:**

- **Super-admin console** at `/admin` (allowed only for staff emails) — list orgs, users, plans, MRR, recent signups, recent failures.
- **Customer impersonation with audit** — "View as <user>" in super-admin; every impersonated request logged with the staff actor, the customer, and the action.
- **Manual plan adjustments** — grant trial extension, comp credit, force-downgrade.
- **Feature flag UI** — toggle flags per org; not just env vars.
- **Feature usage explorer** — "who is using A14 (Economic Blast Radius) the most this month" — fuels customer success outreach.
- **Support inbox** — [Plain.com](http://Plain.com) or Intercom integrated; conversations linked to org records.
- **Internal runbook search** — pin runbooks in admin sidebar; fuzzy-search by alert name.
- **Health overview** — green/red across all subsystems on one screen for the on-call.
- **Incident timeline tool** — capture events into a postmortem skeleton in one click.

### Step 14: 14. Developer experience (DX) infrastructure (P1)

What makes the team ship fast for years.

**Gaps to close:**

- **Storybook for all UI components** — published to a private URL; every component has a story.
- **Chromatic visual regression** — on every PR; auto-block on unintended visual change.
- **Renovate or Dependabot** with grouping — security PRs auto-merged after CI green; major bumps are weekly batch.
- **Release-please or changesets** — automated changelog and version bumps.
- **Conventional commits** enforced via commitlint + husky hook (local-only is fine).
- **`scripts/gen:agent <key>`** — codegen for new agent file + fixture folder + dashboard card + ADR stub.
- **`scripts/gen:route <name>`** — codegen for Fastify route + Zod schema + integration test scaffold.
- **Pre-push hook** — runs typecheck + tests in changed packages only (Turborepo or Nx for caching).
- **Devcontainer (`.devcontainer/`)** — reproducible cloud-IDE setup (Codespaces, Devpod).
- **Repo-wide Make/Just targets** — `just dev`, `just test`, `just db-reset`, `just upgrade-deps`.

### Step 15: 15. Customer support content (P2)

A SaaS without docs leaks support tickets.

**Gaps to close:**

- **Help center content** — at minimum 30 articles covering: connect a repo, read a scan, write an intent contract, manage seats, set up SSO, configure webhooks, interpret each agent's output, troubleshoot a stuck scan, manage billing, request a SOC 2 report.
- **In-product contextual help** — every page has a `?` icon linking to the relevant article.
- **Searchable from `⌘K`** — help articles indexed alongside repos and scans.
- **Embedded video walkthroughs** — 2-minute Loom for each top-10 article.
- **Public docs at `/docs`** — already partially shipped; complete the depth.
- **Changelog public page** — already shipped; ensure release-please populates it on every tag.
- **Sample repos and example projects** — public GitHub org with intentionally vulnerable + intentionally clean repos for demos and tests.
- **Partner / agency docs** — if reseller program ships.

### Step 16: 16. Data classification & compliance automation (P2)

A13 (Compliance-to-Code Mapper) is one agent. The wider compliance posture needs more.

**Gaps to close:**

- **Data classification scanner** — on every scan, detect tables and columns that hold PII (email, phone, address, SSN-like) and tag them; surface in `/compliance`.
- **DPDP / GDPR / CCPA control mapping** — published matrix of which Covenant controls satisfy which regulation article.
- **Right-to-be-forgotten flow** — admin can issue a deletion request that fans out across DB, queue, logs, backups (with retention metadata), object storage.
- **Audit log retention policy** — 7 years for regulated customers; tier-based.
- **Evidence vault** — auto-collect compliance artifacts (access reviews, change tickets, scan results) into a downloadable bundle for auditors.
- **Vendor risk responses** — pre-filled SIG-Lite, CAIQ, custom security questionnaire library; one-click PDF.
- **Customer-facing audit log API** — read-only export for their own compliance team.
- **Data residency** — even if US-only at launch, document the data-flow diagram and the path to EU/APAC.

### Step 17: 17. Performance & cost beyond the dashboard (P2)

Master plan sets a budget for `/dashboard` only. The whole app needs budgets.

**Gaps to close:**

- **Per-route bundle budgets** — every Next.js route < 220 KB gz baseline; CI fails over.
- **Image audit** — every `<img>` is `next/image` with proper sizes; no large hero PNGs; AVIF where possible.
- **Font loading audit** — `font-display: swap`; preload only the variable + mono; no FOUT/FOIT regression.
- **Critical CSS** — extracted automatically by Next.js; verify size.
- **Edge runtime** — eligible API routes (e.g. `/v1/health`, marketing pages) on edge for global low-latency.
- **CDN caching strategy** — explicit `Cache-Control` headers per route; long-cache hashed assets, no-cache HTML.
- **Service worker** — optional; offline fallback for `/dashboard` with last-known data.
- **DB query budget** — a Fastify hook fails in dev if a single request issues > 20 queries.
- **N+1 detection** — Prisma logs reviewed; relations preloaded.
- **Read replicas** — when traffic warrants; queries that don't write tagged for replica routing.

### Step 18: 18. Process & engineering culture (P2 — but underrated)

What separates a junior shop from a senior one.

**Gaps to close:**

- **ADR cadence** — every non-trivial decision lands as an ADR; PR template asks "is there an ADR?" before merge.
- **PR review checklist** — security, perf, a11y, tests, docs; checklist enforced via CODEOWNERS + branch protection (when remote git is enabled).
- **Postmortem corpus** — every Sev-1 and Sev-2 produces a written, blameless postmortem in `docs/postmortems/`.
- **Engineering principles document** — 10–15 short rules: "prefer boring tech", "reversible decisions go fast, irreversible go slow", "every alert must be actionable", etc.
- **Tech radar** — `docs/tech-radar.md` listing adopt / trial / assess / hold; updated quarterly.
- **Architecture review forum** — anyone can propose; ADR is the artifact; runs async on the repo.
- **On-call training plan** — every engineer goes on-call only after shadowing 2 weeks.
- **Customer feedback loop** — weekly review of NPS comments and support tickets feeds the roadmap.
- **Quarterly security review** — threat model refresh, dependency audit, policy review.
- **Quarterly DR drill** — simulated outage; measure detection, response, recovery, comms.