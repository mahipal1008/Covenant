# Marketing event taxonomy

All client-side analytics events emitted via `track()` from
`apps/web/src/components/analytics.tsx`. Add an entry here before
firing a new event in code; CI grep keeps the two in sync.

| Event                       | Properties                          | Where it fires                                    |
| --------------------------- | ----------------------------------- | ------------------------------------------------- |
| `nav.click`                 | `to: string`                        | Top-bar links in `site-header.tsx`.               |
| `cta.click`                 | `surface: "hero" \| "pricing" \| "footer"` | Primary CTA buttons across marketing pages. |
| `lead.submit`               | `form: "home" \| "pricing" \| "contact"` | Lead-capture form submission.               |
| `signup.start`              | `source: string`                    | `/signup` page mount.                             |
| `signup.complete`           | `plan: string`                      | After successful API signup response.             |
| `onboarding.step`           | `step: number; key: string`         | Progressive-disclosure tour advance.              |
| `nps.submit`                | `score: 0..10`                      | NPS popover form submission.                      |
| `dashboard.view`            | `panel: string`                     | Each panel mount on /dashboard.                   |
| `agent.card.open`           | `agentId: string`                   | AgentCard click in dashboard or scan detail.      |
| `docs.search`               | `query: string`                     | Docs search bar (planned).                        |

## Privacy posture

- Plausible (preferred) is cookieless and IP-anonymized; no consent
  prompt required under EU/UK rules.
- PostHog is opt-in only — gated behind the cookie banner's
  "Analytics" toggle. The cookie inventory in
  `apps/web/src/app/cookies/page.tsx` lists every cookie set.
- No event includes raw email, address, or any PII payload. PII goes
  through the API and is redacted by the LLM safety layer if it ever
  reaches a model boundary.
