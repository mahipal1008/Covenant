# Twitter / X launch thread — draft

> 12 tweets. Each ≤ 270 chars. Every image has alt text. Schedule for
> launch day, 06:45 PT.

## 1/12

Today we're launching Covenant — the platform that catches the
tenant-isolation bug your B2B SaaS will ship exactly once.

Free first scan, no signup. Demo tenant lives on the homepage.

→ covenant.dev

## 2/12

Every multi-tenant codebase has the same recurring near-miss:

```sql
SELECT * FROM invoices WHERE userId = ?
-- missing: AND organizationId = ?
```

We watch for that pattern across Prisma, Drizzle, and SQLAlchemy. On
every PR. With a reproduction.

## 3/12

Covenant is three things in one platform:

- A static analyzer for tenant-isolation, auth coverage, and intent
  drift.
- A runtime watcher that tracks blast-radius in production traffic.
- An evidence engine that hands you a SOC 2-ready audit trail.

## 4/12

The wedge is the leak detector. Every plan ships it — even Indie at
$49/mo. We will not gate the thing that pays for the platform.

[Pricing image — alt: 4-tier table $49 / $199 / $499 / $1,499.]

## 5/12

What's actually different vs. legacy code-scanning tools:

- We index your **intent**, not just your code. "This endpoint must
  only return rows for the requesting org" is enforceable.
- Findings ship with a failing curl, not a hunch.
- Tenant-aware. We model the org boundary, not just the function.

## 6/12

We've been quietly running with design partners for the last 8
weeks. The pattern that surprised everyone:

It wasn't the new code that leaked. It was the 18-month-old
admin endpoint that nobody touches. Covenant flags those on day
one.

## 7/12

Ships today:

- GitHub App with PR comments + status checks.
- Slack integration for digests.
- VS Code + JetBrains extensions (live in both marketplaces).
- CLI on npm: @covenant/cli
- Python SDK on PyPI: covenant
- Self-hosted Helm chart for regulated customers.

## 8/12

How serious are we about trust?

- All container images signed with cosign + provenance.
- npm + PyPI published with OIDC attestations.
- Public Statuspage from day one.
- /trust page with our SOC 2 status, subprocessor list, and DPA.

## 9/12

Pricing decisions we made on purpose:

- No usage-based billing in v1. Predictable.
- No per-seat add-ons. Repos are the unit of value.
- No public discounts beyond annual. Design-partner LOIs are the
  only path to a discounted year one.

## 10/12

Design-partner program is open. 6 months free + 50% off year one in
exchange for honest weekly feedback.

If you run a B2B SaaS that has been bitten by a tenant-isolation
bug or a SOC 2 finding in the last 18 months, reply or DM.

## 11/12

For the engineers in the audience: the rule set is published. The
analyzer is open about what it flags and why. We'd rather have you
disagree with one rule than distrust the whole thing.

→ covenant.dev/docs/rules

## 12/12

Massive thanks to our design partners, the OSS projects we build on
(Prisma, Fastify, Next.js, Sentry, OpenTelemetry), and everyone who
told us early "the tenant bug is the wedge".

Try it: covenant.dev. AMA in the replies.
