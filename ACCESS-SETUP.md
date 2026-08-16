# Super admin and judge access

Written 2026-08-16. No code changes needed. The roles already exist and every member function honors them.

## What the code already does

`MEMBER_ROLES = ["member", "founding_villager", "admin", "test_member"]` gates `/member`, `/record`, `/hush`, `/kitchen`, onboarding, the member Concierge, and record export. The `admin` role additionally gates `admin-curaited-backfill`.

An account holding `admin` or `test_member` with no Stripe record reports as **plan: admin, planLabel: "Village team", testAccount: true**. That is why the lobby shows "Test account" on the voucher card.

Identity is **invite only**. Nobody can self-register, which is why judge access has to be created deliberately.

---

## 1. Super admin (you)

Netlify dashboard → the `practice-village` project → **Identity** (or Auth) → **Users** → your user → edit roles → add `admin`.

That single role gives you every member room plus the admin-only functions, with no Stripe record required.

If your Identity UI does not expose a roles field, tell me and I will write a one-shot script that sets it through the Identity Admin API. It needs a Netlify personal access token, which you paste into your own shell. I never see it.

---

## 2. Judge access

XPRIZE requires free, unrestricted judge access. Two layers, and the first one does most of the work.

### Layer 1: no account needed at all

State this plainly in the submission, because it is the strongest answer:

- The Concierge on the landing page answers anyone, no sign-in
- **Safety Hall** is fully open, no account
- **HUSH** is free to everyone

A judge can evaluate the AI, the safety design, and the free rooms without a credential.

### Layer 2: one judge account for the member rooms

1. Netlify → Identity → **Invite user** → `judges@aidedeq.org` (or any address you control).
2. Accept the invite yourself from that inbox and set a password you are willing to publish to judges.
3. Back in Identity, give that user the role **`test_member`**.
4. Sign in once as that account and seed it, so a judge does not land in an empty room:
   - ask the Concierge one real question
   - pick "One small action today"
   - keep both items when it asks
   - that puts two cards with sources in the Record, and the download works
5. Put the email and password in the submission's judge-access field, with one line: *"Founding Villager rooms are open to this account. Safety Hall, HUSH, and the Concierge need no account at all."*
6. After judging, delete that user in Identity. One click, access ends.

**Use `test_member`, not `admin`.** A judge account with `admin` could call the admin functions. `test_member` opens every room and nothing else, and the honest "Test account" label on the voucher card tells the judge why no workshop voucher appears.

### What a judge cannot reach

Member records are keyed per email, so the judge account sees only its own. Safety Hall never leaves the device, so there is nothing to expose there.

---

## 3. The account you record with tomorrow

Do not film the test account. It prints "Test account" and "Test access does not create or use workshop vouchers" on the voucher card, and a judge reading that will wonder what else is a test.

The clean fix is to buy one Founding Villager membership through your own live Stripe link. It takes two minutes and it does three things at once:

1. Gives you a real membership record, so the lobby reads Founding Villager on camera
2. Proves the checkout path end to end, which is a viability claim you can then make honestly
3. Produces a receipt for the evidence pack

Report it as **related-party revenue, separately**, which XPRIZE requires anyway. Do not let it inflate the customer count you state in the video.

If you would rather not, the alternative is to frame the capture so the voucher card stays out of shot. The rooms, the Concierge, and the Record all look correct on the test account.

---

## 4. Order of operations tonight or first thing tomorrow

1. Add `admin` to your user.
2. Invite and set up the judge account, then give it `test_member`.
3. Seed the judge Record with two kept items.
4. Buy the founding membership if you want the clean capture screen.
5. Verify: open a private window, sign in as the judge account, walk `/member`, `/record`, `/hush`, `/kitchen`, and `/safety-hall`. Anything that fails there is what a judge will hit.
