# On-call training

Before a new engineer joins the rotation they complete the steps
below. The whole programme takes roughly two weeks of part-time
effort and culminates in a shadow week.

## Week 1 — orientation

- [ ] Read [docs/runbooks/](.) end-to-end.
- [ ] Walk through the dashboard with an existing on-call to learn
      what *normal* looks like (queue depth, scan latency, error rate).
- [ ] Provision PagerDuty access; verify a test page lands on phone +
      laptop.
- [ ] Install the CLI (`pnpm i -g @covenant/cli`) and sign in.
- [ ] Read the latest five postmortems in `docs/postmortems/`.

## Week 2 — practice

- [ ] Run the **sandboxed incident drill** (
      `docs/runbooks/sandboxing.md` — "drill mode").
- [ ] Pair on a real low-severity ticket; drive the keyboard.
- [ ] Walk through `docs/runbooks/secret-rotation.md` in staging.
- [ ] Practice declaring an incident in the #incident channel
      (Slack template attached below).
- [ ] Demonstrate paging the secondary on-call.

## Shadow week

Shadow the primary for one full rotation. The shadow does not get
paged but joins every page within 5 minutes. The primary narrates
their decisions out loud (or via a running thread) so the shadow
learns the *reasoning*, not just the actions.

## Graduation checklist

- [ ] Completed at least one drill end-to-end as primary.
- [ ] Authored a postmortem (or a postmortem dry-run).
- [ ] Reviewed by the on-call lead.

## Slack incident template

```
:rotating_light: Incident #<short-id>
Severity: SEV-<1|2|3>
Impact: <one sentence>
Status: investigating | identified | mitigating | monitoring | resolved
Commander: @you
Comms: @comms
Notes thread: ⬇
```

## Resources

- [Sandboxing runbook](sandboxing.md)
- [Secret rotation runbook](secret-rotation.md)
- [DR drill schedule](dr-drill-schedule.md)
- [Postmortem template](../postmortems/_TEMPLATE.md)
