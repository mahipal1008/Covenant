# Show HN: Covenant — catch tenant-isolation bugs before your customers do

> Draft. Final copy is locked at T-24h.

**Title:** Show HN: Covenant — catch tenant-isolation bugs before your customers do

**URL:** https://covenant.dev

**Text body:**

Hi HN — I'm building Covenant, a static + runtime checker that finds
the kind of cross-tenant data-leak bug that hits roughly every B2B
SaaS exactly once. (If you've seen `WHERE userId = ?` ship without a
matching `WHERE organizationId = ?`, you know the shape.)

It plugs in via a GitHub App, scans your Prisma / Drizzle / SQLAlchemy
queries for missing tenant guards, watches your auth middleware
coverage, and gates PRs with intent contracts ("this endpoint must
only ever return data for the requesting org"). The 60-second
walkthrough on the homepage is the demo tenant — no signup needed.

A few choices that might be interesting to this crowd:

- The static analyzer is a Prisma client extension plus a TS AST
  pass; we publish the rule set so you can audit what we flag.
- Findings ship with a reproduction: a 5-line failing curl that the
  CI can replay before/after a fix. No "we found something, good
  luck" reports.
- Pricing tops out at $1,499 list for the self-serve plan; design
  partners get six months free in exchange for honest feedback.

Free for public OSS repositories at the Indie tier (with
attribution). Self-hosted Helm chart shipped today. Python SDK and
VS Code / JetBrains extensions in the marketplaces.

I'd love feedback on the rule set, the false-positive rate, or the
pricing. The CLI install (`npm i -g @covenant/cli`) is the quickest
way to get a real result on your own repo without giving us GitHub
access.

— {{founder}}
