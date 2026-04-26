# Secret Rotation Runbook

Status: enforced. Owner: Security on-call. Cadence: 90 days unless a
forced rotation is triggered (compromise suspected, departure of an
operator with secret access, or an annual audit).

## Inventory

| Secret                              | Storage                          | Rotation flow                                                                 |
| ----------------------------------- | -------------------------------- | ----------------------------------------------------------------------------- |
| `JWT_RS256_PRIVATE_KEY`             | Cloud KMS (envelope-encrypted)   | `npm run rotate:jwt` → re-emits JWKS; old kid kept for 24h overlap.           |
| `JWT_RS256_PUBLIC_KEY` (JWKS)       | Public via `/.well-known/jwks.json` | Auto-published from rotation step above.                                  |
| `STRIPE_WEBHOOK_SECRET`             | Stripe dashboard + API env       | Stripe → Webhooks → Roll → update `STRIPE_WEBHOOK_SECRET` env → redeploy.     |
| `GITHUB_WEBHOOK_SECRET`             | GitHub App settings + API env    | App settings → Regenerate → update env → redeploy.                            |
| `SCIM_BEARER_TOKEN`                 | KMS                              | `npm run rotate:scim` → emits new token → push to IdP SCIM connector.         |
| `ADMIN_TOKEN`                       | KMS                              | `npm run rotate:admin` → 24h overlap window → invalidate previous.            |
| `SSO_FIXTURE_SECRET`                | env (test/dev only)              | Not a real secret; rotated together with the next major release.              |
| Database password                   | KMS, injected at boot            | Cloud SQL → Rotate → restart API/worker pods.                                 |
| Redis password                      | KMS                              | Same flow as DB.                                                              |
| Sentry DSN                          | env                              | Sentry → Project keys → New key → swap env → revoke old key after 24h.        |
| OTLP endpoint credentials           | env                              | Provider rotation → swap env → redeploy.                                      |
| Per-org BYO LLM API keys            | KMS reference (`apiKeyRef`)      | Customer-driven; UI provides "rotate" action that wipes the reference.        |

## Forced rotation playbook (compromise)

1. **Contain.** Revoke the implicated secret at the source (Stripe,
   GitHub, KMS) so any leaked copy is dead within 60 seconds.
2. **Rotate.** Run the matching `npm run rotate:*` script. Record the
   new fingerprint in the incident channel.
3. **Replay.** Re-issue active sessions if a JWT signing key was
   rotated (`POST /v1/auth/sessions/revoke-all`).
4. **Audit.** Pull `AuditEvent` rows for the last 24h scoped to the
   affected secret's surface (Stripe events, webhook deliveries,
   admin actions). Attach to the incident ticket.
5. **Close.** File a postmortem in `docs/incidents/<date>-<slug>.md`
   with timeline, blast radius, and follow-up actions.

## Verification

After every rotation, run the smoke checks below. CI re-runs them
nightly so an expired secret surfaces before customers see it.

```sh
npm run smoke:auth      # signs + verifies a JWT against the new JWKS
npm run smoke:webhooks  # replays a fixture with the new HMAC secret
npm run smoke:scim      # bearer-token round-trip against /scim/v2/Users
```
