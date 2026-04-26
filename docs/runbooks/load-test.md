# Load Test Plan — Session 8 §1

> Pass condition: `p95 < 250ms` on the SLO routes for the entire 60-minute plateau,
> `error rate < 0.5%`, and worker queue depth returns to baseline within 5 minutes
> of the spike clearing.

## Targets

| Surface | Tool | RPS | Duration |
| --- | --- | --- | --- |
| API SLO routes (dashboard, findings, scans) | `tools/loadtest/k6-baseline.js` | 200 | 60 min plateau |
| Webhook ingest (github, slack) | `tools/loadtest/k6-webhook.js` | 200 burst | 30s burst inside 4 min run |
| Web TTFB (homepage, pricing) | `lighthouse-ci` | 50 cold + 50 warm | one-shot |

## Pre-flight

1. Staging is on the same SKU as prod (web: 2 vCPU × 2 replicas, api: 4 vCPU × 3 replicas, worker: 2 vCPU × 2 replicas, Postgres: db.r6g.large, Redis: cache.r7g.large).
2. `STRIPE_MODE=test`, `SENTRY_DSN` set, OTEL exporter pointed at the staging collector.
3. Synthetic dataset seeded: 1k orgs, 25 repos/org, 10k findings/org. Seed via `npm run seed:loadtest -w @covenant/db`.
4. Confirm the canary alert in Statuspage flips green (no incidents in flight).

## Execution

```pwsh
$env:K6_TARGET = "https://staging-api.covenant.dev"
$env:K6_TOKEN  = "<staging service token>"
k6 run --out json=loadtest-baseline.json tools/loadtest/k6-baseline.js
k6 run --out json=loadtest-webhook.json  tools/loadtest/k6-webhook.js
```

While the plateau runs, watch:

- Grafana: API request duration p50/p95/p99, Postgres connections, Redis ops/sec, worker queue depth.
- Sentry: error volume — any new issue is a blocker.
- `pg_stat_statements`: top 10 by `total_exec_time` should not change rank during the run.

## Regression triage

For every route where p95 crosses 250ms during the plateau:

1. Capture the slow query via `pg_stat_statements` and the corresponding span in OTEL.
2. Verify whether the n+1 detector (`packages/db/src/n-plus-one-detector.ts`) flagged it. If yes, fix the call site; if no, file a detector bug.
3. Add an index *or* read replica route, *not* both. Re-run the affected scenario only; the full hour is reserved for the final pass.
4. Document the fix in `docs/postmortems/load-<date>.md`.

## Sign-off

- [ ] Baseline plateau passed thresholds.
- [ ] Webhook burst passed thresholds.
- [ ] Lighthouse-CI desktop+mobile p95 < 2s LCP.
- [ ] No new Sentry issues; no PagerDuty pages.
- [ ] Queue depth returned to baseline within 5 min of recovery stage.
- [ ] Run summary archived in `tools/loadtest/last-run-summary.json` and linked from the launch tracker.
