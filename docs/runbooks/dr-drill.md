# Disaster Recovery Drill — Session 8 §2

> Pass condition: **RTO ≤ 30 minutes**, **RPO ≤ 5 minutes** (PITR window),
> zero customer-visible data loss after restore, full audit trail of the drill.

This drill runs against **staging** on a fixed cadence (see
`docs/runbooks/dr-drill-schedule.md`). Production failover follows
the same script with the addition of customer comms.

## Roster

- **Drill lead** — primary on-call for the week.
- **Comms** — second on-call; owns Statuspage + customer email.
- **Observer** — records timestamps, screenshots, and the post-drill metrics.

## Pre-flight (T-15 min)

1. Snapshot the current PITR window: `aws rds describe-db-clusters --db-cluster-identifier covenant-staging | jq '.DBClusters[0].EarliestRestorableTime, .DBClusters[0].LatestRestorableTime'`.
2. Note the current writer endpoint and the latest GTID position.
3. Announce in `#eng-incident`: "DR drill starting at <T0>. Staging only. Read-only at <T+5>."
4. Statuspage component **Database (staging)** → `under_maintenance`.

## Step 1 — Kill primary (T0)

```pwsh
aws rds failover-db-cluster --db-cluster-identifier covenant-staging
# Or, for a true outage simulation:
aws rds reboot-db-instance --db-instance-identifier covenant-staging-writer --force-failover
```

Record T0. Watch for:

- API health: `/healthz` → 503 expected within 10s.
- PagerDuty: a `database-primary-down` page should fire within 60s. If it does not, fix the alert before declaring the drill complete.
- Sentry: error spike on database-touching routes — expected.

## Step 2 — Restore from PITR (T+2)

```pwsh
$restoreTime = (Get-Date).AddMinutes(-3).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
aws rds restore-db-cluster-to-point-in-time `
  --source-db-cluster-identifier covenant-staging `
  --db-cluster-identifier covenant-staging-restored `
  --restore-to-time $restoreTime
```

Wait for `available`. Promote the restored cluster:

```pwsh
aws rds modify-db-cluster `
  --db-cluster-identifier covenant-staging-restored `
  --apply-immediately
```

## Step 3 — Cutover (T+15)

1. Update `DATABASE_URL` in the staging secret store.
2. Roll the API + worker deployments: `kubectl rollout restart deployment/api deployment/worker -n covenant-staging`.
3. Run smoke: `pnpm dlx covenant scan-smoke --env staging` (uses the CLI we just published).
4. Statuspage component back to `operational`.

## Step 4 — Verify (T+20)

- Compare row counts on critical tables (`Organization`, `Scan`, `Finding`, `IntentContract`, `AuditEvent`) against pre-drill snapshot. Acceptable delta = exactly the writes during the PITR-to-cutover window.
- Replay the last 5 minutes of webhook events from the dead-letter queue (`packages/db` `WebhookDLQ`).
- Audit-trail check: every restore step must have an `AuditEvent` row.

## Step 5 — Tear down (T+25)

- Delete the old (killed) cluster only after 24h to retain forensics.
- File the drill report under `docs/postmortems/dr-<YYYY-MM-DD>.md` using the `_TEMPLATE.md`.

## Pass / Fail

| Metric | Target | Actual |
| --- | --- | --- |
| RTO (T0 → green smoke) | ≤ 30 min |  |
| RPO (max lost-write window) | ≤ 5 min |  |
| Audit completeness | 100% |  |
| New Sentry issues attributable to drill | 0 |  |
| PagerDuty page latency | ≤ 60s |  |

## Production variant

Add the following to Step 1 and Step 3:

- T-30: scheduled comms email to all customers + Statuspage maintenance window.
- T0: Statuspage incident `investigating` with template "Database failover in progress".
- T+15: incident `monitoring`.
- T+30: incident `resolved` with timeline.

Production drills MUST be scheduled with at least 7 days' notice and
require sign-off from the on-call lead and a second-line approver.
