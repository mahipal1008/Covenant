# Sandboxing Scan Workers

The scan worker evaluates regex + small AST predicates derived from
agent rules against repository source. We isolate the evaluation
context so a malformed or malicious rule cannot pivot into the host
process.

## Layers

1. **`vm.createContext`** — `apps/api/src/jobs/sandbox.ts`. Frozen
   global with no `require`, `process`, `globalThis`, `fetch`, or
   filesystem access. Wall-clock timeout 1s by default.
2. **Process isolation** — workers run in a dedicated container with
   read-only root filesystem, `--cap-drop=ALL`, no outbound network
   except to the queue (Redis) and database. The Helm chart sets
   `securityContext` accordingly.
3. **mTLS between API ↔ workers** — `tls.createServer` on the worker
   admin port; certs minted from a self-signed dev CA in `deploy/dev-ca/`.
   Production uses cert-manager + the cluster CA. The API rejects any
   connection whose client cert is not signed by the expected CA.
4. **Bounded resource budget** — `cgroup` memory + CPU limits in the
   pod spec; queue jobs that exceed budget are killed and pushed to
   the DLQ with `failureReason="resource-budget"`.

## What the sandbox does NOT protect against

- Native code (WASM, NAPI add-ons) — never load these from a customer
  repository under any circumstance.
- Resource exhaustion against shared infra (Redis, Postgres) — the
  rate-limit middleware + per-org cost caps cover that surface.
- Side channels via timing — accepted risk for now; revisited if we
  expose the worker directly to an untrusted tenant.
