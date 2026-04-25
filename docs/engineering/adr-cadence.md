# ADR cadence

We use Architecture Decision Records (ADRs) to capture the *why*
behind the structure of the codebase. The format is the
[Michael Nygard short form](https://github.com/joelparkerhenderson/architecture-decision-record/tree/main/locales/en/templates/decision-record-template-by-michael-nygard).

## Where

ADRs live in `docs/adr/` and are numbered sequentially:

```
docs/adr/0001-living-intelligence-architecture.md
docs/adr/0002-multi-tenant-isolation-strategy.md
```

## When

- **At least one ADR per sprint.** If a sprint ships without one, that
  is itself a signal worth investigating in retro.
- **Always** for: a new top-level service, a new external dependency,
  a change to the tenant-isolation model, a database migration that
  rewrites > 1M rows, or any change to billing or auth.
- **Never** for: refactors that don't change observable behaviour,
  dependency version bumps, or test coverage additions.

## Lifecycle

States: `proposed` → `accepted` | `rejected` → `deprecated` |
`superseded by ADR-XXXX`.

Drafts may live in PRs; once merged, the ADR is part of the
permanent record. Future ADRs supersede earlier ones rather than
editing them.

## Template

```markdown
# ADR-XXXX: <Title>

- Status: proposed | accepted | superseded by ADR-YYYY
- Date: YYYY-MM-DD
- Authors: @handle, @handle
- Reviewers: @handle, @handle

## Context

What forces are at play? Tech, business, regulatory, ergonomic.

## Decision

What we chose to do, in plain language.

## Consequences

Positive, negative, and neutral. Be honest about the trade-offs we
took on.

## Alternatives considered

What else was on the table and why it lost. Include "do nothing".
```

## Cadence rituals

- **Sprint planning:** identify candidate decisions for the sprint.
- **Sprint review:** one slide per ADR shipped.
- **Quarterly retro:** revisit ADRs older than 12 months — accepted
  ADRs that no longer reflect reality become `superseded`.
