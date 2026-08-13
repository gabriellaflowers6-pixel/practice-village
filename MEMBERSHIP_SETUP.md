# Membership setup and release checklist

This document covers infrastructure work that cannot be completed by editing the site files alone.

## 1. Enable Netlify Identity

In the `practice-village` Netlify project:

1. Open **Project configuration > Identity**.
2. Enable Identity.
3. Set registration to **Invite only**.
4. Keep email confirmation on.
5. Set the site URL to `https://thepracticevillage.org`.
6. Set the invitation subject to `You've been invited to join Practice Village`.
7. Set the invitation template path to `/emails/invitation.html`.
8. Keep invitation links active for 7 days.

Do not enable open public signup. Stripe creates the entitlement; Identity provides the account.

## 2. Configure Stripe webhook

Create one Stripe webhook endpoint:

`https://thepracticevillage.org/stripe-membership-webhook`

Subscribe it to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Add these secret environment variables in Netlify:

- `STRIPE_SECRET_KEY`
- `STRIPE_MEMBERSHIP_WEBHOOK_SECRET`

The webhook accepts only signed Stripe events. Never put either secret in the repository or browser code.

## 3. Current payment-link mapping

- `plink_1U3SBE2ZVkTQmuLQcHdmQ7s9` -> `founding_villager` -> $149/year
- `plink_1U3SHI2ZVkTQmuLQc8dFuGso` -> `member` -> $15/month

Any other Stripe payment link is ignored by the membership webhook.

## 4. Account behavior

After a verified payment:

1. The webhook records the membership by a hashed email key.
2. It creates or updates the Netlify Identity account.
3. A new customer receives an account setup email.
4. Server-controlled metadata receives either `member` or `founding_villager`.
5. The member can enter `/member/` after setting a password.

Cancellation at period end keeps the Stripe subscription active until the period ends. When Stripe reports that the subscription is no longer active, the membership role is removed.

## 5. Voucher behavior

- The membership year begins on the original membership start date.
- One voucher is available per membership year.
- Vouchers do not reset on January 1.
- The first 108 Founding Villagers who join before the first Rebuild Arc Workshop begins on October 31, 2026 at 3:00 pm Central receive two vouchers in their first membership year only.
- All later membership years include one voucher.

This pass records voucher allowance. Workshop registration and voucher redemption are a later pass.

## 6. Required preview tests

- Unauthenticated `/member` and `/member/` requests redirect to `/login`.
- A signed-in account without a paid role cannot open `/member`.
- A $15 test purchase creates a `member` account and setup email.
- A $149 test purchase creates a `founding_villager` account and correct voucher allowance.
- Replaying the same Stripe event does not duplicate the membership or voucher allowance.
- Cancel-at-period-end keeps access until the period ends.
- Subscription deletion removes paid access.
- `/member-status` exposes only the signed-in member's non-sensitive membership summary.
- No Safety Hall record is copied to member storage.

## 7. Production release gate

Do not publish member access until all required preview tests pass. Keep the public HUSH and Terms copy separate from this release if those changes need to publish sooner.

## 8. Concierge-led welcome checks

- Membership access works even when the member skips onboarding.
- `/welcome` redirects a signed-out visitor to `/login`.
- The welcome conversation accepts typing and offers voice transcription where the browser supports it.
- A transcript is shown to the member before it is sent.
- The Concierge asks one optional question at a time and honors skip and finish requests.
- No audio or raw welcome transcript is stored by Practice Village.
- The short welcome note is stored only after the member chooses to save it.
- Choosing private completes the welcome without storing a note.
- Safety Hall records are never pulled into onboarding.
