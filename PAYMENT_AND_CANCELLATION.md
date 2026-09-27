# Payment and cancellation, as it actually works

Written 2026-09-27 after a tester could not get her card off the file. This is the
whole flow, what the system does at each step, and what a tester should check.

## Joining

1. Member pays through a Stripe payment link. Two live links: Practice Village Membership
   ($15/mo) and Founding Villager ($149/yr). Stripe is the only place a card is ever entered.
2. Stripe fires `customer.subscription.created` and `checkout.session.completed`. Either one
   provisions the membership: a record in the `practice-village-memberships` blob store
   keyed by email, a Netlify Identity user with the member role, and one welcome email
   (Identity's set-password email for brand new accounts, the Resend welcome otherwise).
3. **One membership per email.** A second checkout on an email that already holds a live
   membership is undone automatically: the new subscription is cancelled, the charge it just
   took is refunded, and an alert goes to `ADMIN_ALERT_EMAIL` (default info@aidedeq.org).
   The original membership is untouched. A member who wants back in after cancelling is not
   a duplicate; only a live membership blocks a second one.

   This cannot catch one person signing up under two different emails. Nothing can.

## Billing

- Stripe charges the saved method on each renewal. Receipts, renewal notices, and failed
  payment emails all come from Stripe and are switched on in the dashboard
  (Settings > Customer emails, and Settings > Billing > Subscriptions and emails).
- A failed renewal is retried by Stripe on its schedule. Retries stop the moment the
  subscription is cancelled or the card is removed.

## Cancelling

Three doors, all ending the same way:

| Door | Where | What happens |
|---|---|---|
| Manage billing and cancel | /account, signed in | Stripe portal, cancel at end of period |
| Stripe billing page | /cancel, no sign-in, email code | Same portal, same result |
| Close my membership | /account, type CLOSE | Cancels immediately, erases the Record, ends sign-in |

**Cancelling removes the card.** The Stripe portal will not let a member delete her last
card while a subscription is running out its paid period, which is exactly when she wants
it gone. So the webhook does it: on the event where the cancellation lands
(`cancel_at_period_end` flipping on, or the subscription ending), every card, Apple Pay, or
Link method comes off the Stripe customer. Access continues through the paid period; nothing
can charge her again. A member who schedules a cancel and then adds a new card to change her
mind keeps that card, because only the cancelling event itself triggers the removal.

Refunds are never automatic on a cancellation. A person decides those in Stripe.

## What a tester should check

1. Join with one email. Confirm the welcome email and that /member opens.
2. Open /account. "Manage billing and cancel" opens Stripe showing the right plan and card.
3. Cancel there, choosing end of period. Back on /account the cancel note appears.
4. In Stripe (admin side): the customer now shows **No payment methods**. This is the fix for
   the tester complaint and the thing most worth confirming.
5. Try to join again with the same email while the first is still active. Expect: no second
   membership, an automatic refund, and an admin alert.
6. Open /cancel signed out. The Stripe billing page link works with only an email code.

Where it lives: `netlify/functions/stripe-membership-webhook.mjs` (provisioning, duplicate
guard, card removal), `netlify/functions/member-account.mjs` (account page, close),
`netlify/functions/_shared/membership.mjs` (the helpers), `cancel.html` (public page).
