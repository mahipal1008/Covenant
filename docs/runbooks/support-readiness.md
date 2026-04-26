# Customer Support Readiness — Session 8 §9

> Pass condition: response SLA defined and instrumented; inbox
> monitored 7 days a week; escalation path tested before launch.

## Channels

| Channel | Audience | Tooling |
| --- | --- | --- |
| `support@covenant.dev` | All paid plans + design partners | Inbox monitored by primary on-call; PagerDuty notifies after 30 min unread. |
| In-app chat (paid only) | Startup / Scale / Enterprise | Crisp or equivalent; routes to the same inbox. |
| Slack Connect | Design partners + Enterprise | One channel per customer; founder is in every channel. |
| `security@covenant.dev` | Coordinated disclosure | Auto-acknowledged; routes to security owner with PagerDuty fallback. |
| GitHub Issues | OSS users | `triage` label; weekly grooming. |

## Response SLA

| Severity | First response | Resolution target | Hours |
| --- | --- | --- | --- |
| **Sev-1** (production-down, data exposure) | 15 minutes | 4 hours | 24×7 |
| **Sev-2** (major feature broken, no workaround) | 1 hour | 1 business day | 24×7 |
| **Sev-3** (minor bug, workaround exists) | 1 business day | 5 business days | Business hours |
| **Sev-4** (question, feature request) | 2 business days | best-effort | Business hours |

These are the **paid** SLAs. Indie tier is best-effort by published
business hours (Mon–Fri 09:00–18:00 PT). Free trials match Indie.

## Severity definitions

- **Sev-1** — any of: production endpoint down for ≥ 10% of customers; cross-tenant data leakage suspected; auth bypass suspected; payments broken; a Statuspage component is `major_outage`.
- **Sev-2** — a single tenant cannot complete a core workflow (scan, view findings, gate a PR); a non-critical Statuspage component is `partial_outage`.
- **Sev-3** — a non-blocking bug with a documented workaround.
- **Sev-4** — questions, configuration help, feature requests.

## Inbox rotation

- **Primary** — current on-call (PagerDuty schedule `support-primary`).
- **Backup** — second on-call.
- **Founder** — copied on every Sev-1 and every paid-customer ticket older than 24 hours.

Rotation switches Mondays at 10:00 PT. Rotation handoff doc:
`docs/runbooks/on-call-training.md`.

## Escalation

```
Customer ticket
       │
       ▼
 Primary on-call ── 30 min unread ──▶ PagerDuty page
       │                                    │
       ▼                                    ▼
 Acknowledge + triage              Backup on-call paged
       │
       ├── Sev-1 ──▶ Founder + security owner paged in parallel; Statuspage incident opened.
       ├── Sev-2 ──▶ Founder notified async; Slack #support-eng channel.
       ├── Sev-3 ──▶ Logged in tracker; weekly review.
       └── Sev-4 ──▶ Templated reply; logged for product backlog.
```

## Macros / templates

Stored in `docs/support/macros/`:

- `01-acknowledge.md` — universal first-touch acknowledgement.
- `02-sev1-statuspage.md` — Sev-1 with Statuspage incident link.
- `03-cross-tenant-suspected.md` — security-incident pre-flight (no facts disclosed).
- `04-billing-mode-test.md` — common confusion: "I added a card and was not charged" (test mode).
- `05-feature-request.md` — closes Sev-4 with a tracker link.
- `06-onboarding-stuck.md` — GitHub App install or first-scan failure.

## Metrics

Tracked weekly, reviewed monthly:

- First-response time, p50 / p95 by severity.
- Resolution time, p50 / p95 by severity.
- Tickets per active customer per month.
- CSAT — single-question survey on ticket close.

## Pre-launch checks

- [ ] PagerDuty schedule `support-primary` populated for first 8 weeks.
- [ ] Backup rotation populated for first 8 weeks.
- [ ] Inbox auto-acknowledgement live and tested end-to-end.
- [ ] Macros reviewed by founder + security owner.
- [ ] Statuspage subscriber list seeded with the design partners.
- [ ] One synthetic Sev-1 fire-drill completed; runbook updated with the gaps.
