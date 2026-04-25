# Launch Assets — Session 8 §8

This folder is the source of truth for every launch surface. Drafts
live here in markdown so they version-control cleanly with the rest
of the platform.

| File | Purpose | Owner |
| --- | --- | --- |
| `hn-show.md` | Hacker News "Show HN" submission | Founder |
| `producthunt.md` | Product Hunt submission copy + maker comments | GTM |
| `twitter-thread.md` | Launch-day Twitter / X thread (12 tweets, with alt text) | GTM |
| `linkedin-post.md` | Launch-day LinkedIn post + 3 follow-ups | Founder |
| `demo-script.md` | 90-second demo video script + shot list | Founder + Eng |
| `gif-shot-list.md` | The 6 product GIFs we ship on the launch site | Eng |
| `press-kit.md` | One-pager and asset links for journalists | GTM |

## Launch sequence (T-day)

1. **T-7 days** — Statuspage subscriber email "We're going public next Monday".
2. **T-1 day** — Design-partner Slack channels: heads-up + ask for amplification.
3. **T+0 06:00 PT** — Product Hunt scheduled post goes live.
4. **T+0 06:30 PT** — HN Show post submitted by the founder.
5. **T+0 06:45 PT** — Twitter thread + LinkedIn post simultaneously.
6. **T+0 09:00 PT** — Email blast to waitlist.
7. **T+0 throughout** — Founder available in every comment thread for the first 12 hours.
8. **T+1** — Recap post on the blog.

## Hard rules

- No screenshots that include real customer data — use the seeded
  demo tenant from `packages/db` fixtures.
- No pricing claims that contradict `/pricing`. The pricing decision
  record (`docs/engineering/pricing-decision.md`) is the only source.
- No "Soc2 ready" language; we say "SOC 2 evidence package" because
  that's what the product produces.
- Every external link must be HTTPS and resolve as of the launch
  morning — verified by the smoke test in `tools/launch/check-links.mjs`.
