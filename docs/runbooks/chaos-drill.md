# Chaos Drill — Session 8 §3

> Pass condition: zero data loss, zero stuck-running jobs, every dropped
> job either retried successfully or visible in the DLQ within 5 minutes
> of the kill window closing.

## Scope

The chaos drill kills random worker pods on a fixed cadence and
measures the recovery behaviour of the queue + DLQ pipeline. It does
**not** touch the database, API, or web tier — those are exercised
by the load and DR drills.

## Pre-flight

- Run during a load-test plateau (Session 8 §1) so the queue is
  actually busy. Idle workers prove nothing.
- Confirm the durable jobs table has zero rows in `running` state at T0.
- Confirm the DLQ retry consumer is healthy (lag = 0).

## Execution

```pwsh
node tools/chaos/kill-workers.mjs `
  --namespace covenant-staging `
  --selector app=worker `
  --duration 1800 `
  --interval 45 `
  --max-percent 30
```

This kills up to 30% of worker pods every 45 seconds for 30 minutes.
The script writes `tools/chaos/last-run.json`.

## Live verification

Throughout the drill:

- Grafana panel **Worker / In-flight** must drain to 0 within 60s of any kill batch.
- Grafana panel **DLQ depth** can rise but must monotonically drain when the kill loop pauses.
- The `recordJobFailure` metric (Session 6) increments only by the count of forcibly killed jobs.
- No `Scan` row stays in `running` longer than `JOB_HARD_TIMEOUT_SECONDS` (default 600).

## Post-drill checks

```pwsh
psql $DATABASE_URL -c "SELECT id, status, started_at FROM \"Scan\" WHERE status = 'running' AND started_at < now() - interval '15 minutes';"
```

Expected: zero rows. Any hit is a leak — file a P1.

```pwsh
redis-cli -u $REDIS_URL XLEN covenant:dlq
```

Expected: returns to zero within 5 minutes of the kill loop ending.

## Sign-off

- [ ] `tools/chaos/last-run.json` archived in the launch tracker.
- [ ] No stuck `running` jobs.
- [ ] DLQ drained.
- [ ] No Sentry issues other than the expected `WorkerKilled` warning.
- [ ] No PagerDuty page (recovery is automatic; pages indicate a real failure).
