# Product Hunt — Covenant

> Draft. Final copy locked at T-24h.

## Tagline (60 chars)

Catch tenant-isolation bugs before your customers do.

## Description (260 chars)

Covenant is a living-intelligence checker for multi-tenant SaaS. It
scans your code for missing tenant guards, watches auth-middleware
coverage, and gates PRs with intent contracts. Free first scan, no
GitHub access required.

## First comment (maker comment)

Hey Product Hunt — {{founder}} here, building Covenant.

Every B2B SaaS ships a "WHERE userId = ?" query without the matching
"WHERE organizationId = ?" exactly once. The blast radius is enormous
and the bug is tedious to find by hand. Covenant is the platform I
wished I'd had at my last three companies.

What's live today:

- A GitHub App that comments on every PR with the tenant-isolation
  diff, the auth-coverage delta, and a reproducible failing test if
  it spots a regression.
- A CLI (`npm i -g @covenant/cli`) and a Python SDK
  (`pip install covenant`) for everything you can do in the UI.
- VS Code and JetBrains extensions for inline findings.
- A self-hostable Helm chart for regulated customers.

What I'd love feedback on:

- The rule set — is anything missing from your codebase?
- The free Indie tier — useful, or too restrictive?
- The pricing — anchored against "less than half of one SOC 2
  finding". Right ballpark?

I'll be in the comments all day.

## Topics

Developer Tools · SaaS · Security · Productivity

## Hunter ask

Looking for a hunter with a track record in dev-tools posts. DM
{{founder}} if you're up for it.
