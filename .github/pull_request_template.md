<!-- Covenant pull request template — Session 6 §11.

     Keep this list short on purpose: anything we ask reviewers to
     check on every PR has to actually be checked on every PR.
-->

## What

<!-- One sentence on what this change does. Link the issue or ADR. -->

## Why

<!-- One sentence on the user/business outcome. -->

## How

<!-- Bullet list of the meaningful technical decisions. -->

## Verification

- [ ] Unit / integration tests added or updated
- [ ] `pnpm --filter @covenant/api test` (if API changed)
- [ ] `pnpm --filter web typecheck` (if web changed)
- [ ] Manual screenshot or terminal capture attached for UX/UI

## Risk & rollback

- **Blast radius:** <!-- service / tenant scope / users impacted -->
- **Rollback plan:** <!-- revert PR, feature flag off, db migration plan -->

## Compliance

- [ ] No new PII fields without `/// @sensitivity:` annotation
- [ ] No new external dependencies without licence + CVE check
- [ ] No new env vars without entry in `docs/runbooks/secret-rotation.md`
- [ ] No new endpoints without RBAC + tenant-guard coverage

## Reviewer notes

<!-- Anything specific you want reviewers to focus on. -->
