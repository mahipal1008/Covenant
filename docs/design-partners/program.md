# Design Partner Program — Session 8 §5

> Goal: 3 design-partner customers running Covenant on real
> repositories in test mode, weekly feedback loop, **at least one signed
> Letter of Intent** before public launch.

## Profile

We pick partners that hit at least three of the following:

- B2B SaaS with multi-tenant data (the wedge).
- 5–50 engineers (small enough that the founder is reachable, large enough that the platform actually matters).
- Has been bitten by a tenant-isolation bug, an auth-coverage gap, or a SOC 2 finding in the last 18 months.
- Already pays for at least one developer-tools SaaS in the $200–$2k/month range.
- Engineering leadership willing to take a 30-min weekly call.

## What we offer

- 6 months of the **Scale** plan free, then a 50% discount for the
  remainder of year one.
- White-glove onboarding (we wire up the GitHub App, Slack, and the
  first intent contract on a screenshare).
- Direct Slack Connect channel with the founders.
- Co-marketing: their logo on `/customers`, a quote on the launch
  page, and a joint case study after 90 days of usage.

## What we ask

- Honest weekly feedback for 8 weeks, by call or async.
- Permission to use their name and logo publicly (subject to their
  approval of the exact copy).
- Signed Letter of Intent (`docs/legal/loi-template.md`) before
  public launch — this is the gate that earns the 6-month free term.

## Pipeline

Tracked in `tools/design-partners/pipeline.json`. Statuses:

| Status | Definition |
| --- | --- |
| `prospect` | Identified, not yet contacted. |
| `contacted` | Outreach sent, awaiting reply. |
| `discovery` | First call booked or completed. |
| `installed` | GitHub App installed, first scan completed. |
| `feedback` | Weekly feedback loop active. |
| `loi-signed` | LOI countersigned and stored in `docs/legal/loi-signed/`. |
| `paying` | Converted to a paid plan post-launch. |
| `lost` | Disqualified or churned, with reason recorded. |

## Outreach template

> Subject: Tenant-isolation regression catcher — would love your eyes
>
> Hi {{firstName}},
>
> I'm building Covenant — a static + runtime checker that catches the
> kind of cross-tenant data-leak bug that hits every B2B SaaS exactly
> once. It's free for design partners for six months and we'd
> screenshare to set it up.
>
> Are you open to a 20-minute call this week? I'll come with a
> pre-scan of your public surface so the conversation starts with
> findings, not slides.
>
> {{senderName}}

## Weekly feedback agenda

1. What did you scan / connect this week?
2. What got in your way?
3. What did Covenant catch that surprised you (good or bad)?
4. What's missing that would make you switch budget from another tool?
5. NPS-style: 0–10, would you recommend Covenant to a peer founder?

Notes go into `docs/design-partners/feedback/<partner-slug>/<YYYY-WW>.md`.
