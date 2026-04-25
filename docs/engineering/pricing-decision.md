# Pricing Decision Record — Session 8 §6

> Status: **Finalized for launch**.

| Tier | Monthly | Annual (per month) | Repos | Audience |
| --- | ---: | ---: | ---: | --- |
| Indie | $49 | $39 | 1 | Solo founders, side-projects, OSS maintainers. |
| Startup | $199 | $169 | 5 | Seed–Series A teams; the default sticker for the homepage. |
| Scale | $499 | $419 | 25 | Series B+ engineering orgs; design-partner default. |
| Enterprise | $1,499+ | Custom | Unlimited | Regulated SaaS with SSO, self-hosted, custom controls. |

These numbers ship in `packages/shared/src/index.ts` as
`billingPlans` and render on `/pricing`.

## How we picked the numbers

- **Indie ($49)** — under the threshold where indie founders need
  finance approval. Roughly Render + Sentry's hobby tier combined.
- **Startup ($199)** — sits between Vanta's startup tier and
  Snyk Team. Comfortably below the line where a small engineering
  org needs a budget meeting.
- **Scale ($499)** — anchored to "less than half the cost of one
  unaddressed SOC 2 finding". Buyers we've shown this to didn't
  flinch.
- **Enterprise ($1,499+)** — list price; real ACV lands $25–60k
  via custom controls, dedicated environments, and self-host.

## Annual discount

20% off list, billed up-front. We do not negotiate annual discount %
on the self-serve tiers; we will negotiate seat / repo counts on
Enterprise.

## What is *not* gated

- The multi-tenant leak detector. Every plan ships it. This is the
  wedge and we will not punish anyone for using it.
- The first scan on any repository. Free, no card required.
- Public OSS scanning at the Indie tier (with attribution).

## Future moves we are not making yet

- No usage-based billing in v1. Decision: keep pricing predictable
  for the first 12 months of public availability, revisit when we
  have ≥ 50 paying customers.
- No per-seat add-ons. Repos are the unit of value.
- No public discounts beyond annual. Design-partner LOIs are the
  only path to a discounted first year.

## Sign-off

- [ ] CEO
- [ ] CFO / finance lead
- [ ] Sales / GTM lead
- [ ] Engineering lead (capacity check at projected usage)
