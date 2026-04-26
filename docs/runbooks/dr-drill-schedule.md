# Disaster-recovery drill schedule

We run a DR drill once a quarter. The goal is not to *prove* the
runbooks work — it is to find the parts that don't.

## Cadence

| Quarter | Theme | Lead |
| --- | --- | --- |
| Q1 | Region failover (warm standby) | SRE |
| Q2 | Postgres point-in-time restore | DBA |
| Q3 | Secret-rotation under live load | Security |
| Q4 | Tenant-isolation breach simulation | Platform |

The next drill date is announced in #engineering at least two weeks
ahead so on-call doesn't get surprised.

## Format

1. **T-14d** — drill plan posted as an ADR-like doc (scope, success
   criteria, rollback). Stakeholders sign off.
2. **T-7d** — readiness review: backups verified, runbooks
   double-checked, comms plan circulated.
3. **T-1d** — pre-flight: page the on-call shadow to confirm the
   alerting path works.
4. **Drill day** — execute. Time-box to four hours.
5. **T+1d** — write the postmortem from the
   [template](../postmortems/_TEMPLATE.md). Even a "successful"
   drill gets a postmortem.
6. **T+7d** — action items closed or transferred to backlog with
   owners.

## Success criteria

A drill is *successful* when:

- Either the primary path works end-to-end, or we identified a
  concrete gap and have an action item to fix it.
- Mean-time-to-recover (MTTR) was measured and recorded.
- A new engineer was the primary or shadow.

## Out-of-scope

We deliberately do **not** drill against production tenants. All
drills run in a parallel staging stack with synthetic data.

## Tracking

Each drill is logged in `docs/postmortems/YYYY-MM-DD-drill-<theme>.md`.
The MTTR trend is reviewed at the half-yearly engineering all-hands.
