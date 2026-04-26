# Stripe TEST → LIVE go-live runbook (Session 7 §2)

This runbook is the single gate between Covenant accepting test card
numbers and Covenant accepting real money. **Do not flip the switch
without every checkbox green.**

## 1. Legal & tax preconditions

- [ ] Business entity registered (LLC / Corp / equivalent).
- [ ] Tax-id (EIN / equivalent) issued.
- [ ] Sales-tax / VAT / GST registration completed in every jurisdiction
      we sell into. Stripe Tax is on for those jurisdictions.
- [ ] Privacy policy + terms of service published at /legal.
- [ ] Refund + dispute policy published at /legal/refunds.
- [ ] Data-processing addendum (DPA) available for download from the
      org settings page.

## 2. Stripe dashboard preconditions

- [ ] Stripe account in `active` state (no outstanding KYC requests).
- [ ] Default currency set.
- [ ] Bank account verified for payouts.
- [ ] Two-factor enabled on every team account.
- [ ] Live products + prices created. Test mode prices have been
      mirrored, not auto-translated.
- [ ] Webhook endpoint `https://api.covenant.dev/v1/stripe/webhook`
      registered in **live mode**, signing secret captured.

## 3. Application preconditions

- [ ] `STRIPE_MODE=live`
- [ ] `STRIPE_SECRET_KEY=sk_live_…`
- [ ] `STRIPE_PUBLISHABLE_KEY=pk_live_…`
- [ ] `STRIPE_WEBHOOK_SECRET=whsec_…` (from the **live** endpoint)
- [ ] `STRIPE_TAX_REGISTRATION_VERIFIED=true`
- [ ] Renovate has not auto-merged a stripe-node major in the last 7
      days without a re-run of the live mode smoke test.

> The application validates these on boot via
> `loadStripeMode()` (apps/api/src/services/stripe-mode.ts). If any
> are missing, the API refuses to start so we never silently degrade
> from live mode to test mode.

## 4. Smoke test (immediately after flip)

1. Use a personal card to subscribe to the **Indie** plan.
2. Verify the invoice arrives via email.
3. Verify the customer + subscription rows in our DB.
4. Cancel the subscription; verify the cancellation webhook lands and
   the row's `cancelAtPeriodEnd` flips.
5. Issue a partial refund from the Stripe dashboard and verify our
   audit trail records it.
6. Resolve the dunning case for one customer (test card with 4000 0000
   0000 0341 — declines after auth).

## 5. Rollback

If anything in §4 fails:

1. Set `STRIPE_MODE=test` and redeploy.
2. Pause the live webhook endpoint in the Stripe dashboard.
3. Refund any successful charges manually.
4. File a postmortem (template in
   [docs/postmortems/_TEMPLATE.md](../postmortems/_TEMPLATE.md)).

## 6. Sign-off

The flip requires sign-off from **both** the engineering lead and a
person with delegated authority over billing (typically the founder /
CEO). Record sign-off in the deploy ticket and link the runbook
revision used.
