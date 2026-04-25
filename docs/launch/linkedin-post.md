# LinkedIn launch post — draft

> One launch-day post + three follow-ups across the next two weeks.

## Launch day (T+0)

After 8 months of building, today we're launching Covenant.

It's the platform I wished I'd had at my last three B2B SaaS jobs:
the one that catches the cross-tenant data leak before it reaches a
customer's dashboard.

Why this, why now:

- Every multi-tenant codebase ships the same `WHERE userId = ?`
  query without the matching `WHERE organizationId = ?` exactly
  once. The blast radius of that one query has ended companies.
- The current options are "hope your code review catches it" or
  "buy a generic SAST tool that doesn't understand tenancy".
- Covenant indexes your **intent**, not just your code. You write
  "this endpoint must only return rows for the requesting org" —
  we enforce it on every PR.

What's live today:

- GitHub App, Slack integration, VS Code + JetBrains extensions.
- CLI on npm, SDK on PyPI, self-hosted Helm chart.
- Free first scan, no signup. Free Indie tier for solo founders.

Huge thanks to our design partners who ran the gauntlet with us in
test mode and to the OSS projects we build on. If your team runs B2B
SaaS and you'd like to see Covenant on your repo, comment "scan" and
I'll DM.

→ covenant.dev

## T+3 days — what we learned in the first 72 hours

Three things surprised us about the launch:

1. {{example finding from real launch traffic}}
2. {{example pricing or positioning learning}}
3. {{example feature request volume signal}}

Posting this thread because the public-build-in-public norm only
works if we publish the misses too.

## T+10 days — design partner story

{{Design partner #1, with their permission}} ran Covenant against
their codebase and surfaced {{N}} tenant-isolation findings, of
which {{M}} were real. Their writeup is here: {{link}}.

If you're considering Covenant, this is the post to read.

## T+14 days — hiring signal

We're hiring {{role}} to {{outcome}}. Remote-first, async-default.
The job spec is at {{link}}; the application is two paragraphs and
a link to your most recent code or writing.
