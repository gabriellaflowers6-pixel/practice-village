import Stripe from "stripe";
import { admin, getUser } from "@netlify/identity";
import { getMembershipRecordByEmail, findIdentityUserByEmail, membershipStore } from "./_shared/membership.mjs";

const MEMBER_ROLES = ["member", "founding_villager", "admin", "test_member"];
const SITE = "https://thepracticevillage.org";

function accountPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your account · Practice Village</title>
  <meta name="robots" content="noindex" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Hanken+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/member.css?v=33" />
</head>
<body data-auth-page="account">
  <header class="member-header">
    <a href="/member" class="member-brand">Practice Village</a>
    <nav><a href="/member" class="member-link">Back to your lobby</a><button id="logoutButton" class="text-button" type="button">Sign out</button></nav>
  </header>
  <main class="member-main">
    <section class="member-welcome">
      <p class="eyebrow">Your account</p>
      <h1>Your membership, and your information.</h1>
      <p>What you pay, what you can take with you, and how to end any of it.</p>
    </section>

    <section class="member-grid" aria-label="Your membership">
      <article class="member-card member-card--wide">
        <p class="eyebrow">Membership</p>
        <h2 id="accountPlan">Checking your membership…</h2>
        <p id="accountPeriod"></p>
        <p id="accountCancelNote" class="room-note" hidden></p>
        <div class="account-actions">
          <button id="openBilling" class="secondary-button" type="button">Manage billing and cancel</button>
        </div>
        <p class="room-note">Billing opens in Stripe, where you can cancel, change your card, or read past invoices. Cancelling keeps your access through the period you already paid for.</p>
        <p class="room-note">If you would rather a person handled it, email <a href="mailto:info@aidedeq.org?subject=Practice%20Village%20membership">info@aidedeq.org</a>.</p>
      </article>
    </section>

    <section class="member-section">
      <div class="section-heading"><div><p class="eyebrow">Take it with you</p><h2>Download your Record first.</h2></div></div>
      <p class="record-note">Anything you erase below is gone for good. Download it first if you want to keep it.</p>
      <div class="account-actions">
        <a class="secondary-button" href="/record">Open your Record</a>
        <a class="secondary-button" href="/record-export">Download the PDF</a>
      </div>
    </section>

    <section class="member-section">
      <div class="section-heading"><div><p class="eyebrow">Erasing</p><h2>Two different things.</h2></div></div>
      <p class="record-note">One clears what the Village holds about you and leaves your membership running. The other ends everything. Neither can be undone.</p>

      <div class="member-grid">
        <article class="member-card">
          <h3>Erase my Record</h3>
          <p>Removes everything you kept, everything in My Practice, and the notes the Concierge remembers. Your membership continues and you can start keeping things again whenever you want.</p>
          <div id="eraseRecordBox"><button id="eraseRecordStart" class="text-button account-danger" type="button">Erase my Record</button></div>
        </article>
        <article class="member-card">
          <h3>Close my membership and erase everything</h3>
          <p>Cancels your membership immediately, erases your Record, and removes your access to the member area. You will not be able to sign in afterward.</p>
          <div id="closeAccountBox"><button id="closeAccountStart" class="text-button account-danger" type="button">Close my membership</button></div>
        </article>
      </div>

      <p class="record-note">Safety Hall is stored on your device, not on our servers, so neither of these touches it. Clear it from inside Safety Hall itself.</p>
    </section>

    <section class="member-section account-section">
      <div><p class="eyebrow">Also here</p><h2>Privacy and access</h2></div>
      <div class="account-links"><span id="memberPlan" class="member-plan">Checking membership…</span><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/welcome?onboarding=review">Review onboarding choices</a><a href="/login">Change your password</a><button id="logoutButtonBottom" class="text-button" type="button">Sign out</button></div>
    </section>
  </main>
  <script type="module" src="/assets/member-auth.bundle.js?v=24"></script>
</body>
</html>`;
}

export default async function handler(request) {
  const user = await getUser();
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const isMember = user && roles.some((role) => MEMBER_ROLES.includes(role));

  if (request.method === "GET" && !request.headers.get("accept")?.includes("application/json")) {
    if (!isMember) return new Response(null, { status: 302, headers: { Location: "/login" } });
    return new Response(accountPage(), {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store" },
    });
  }

  if (!isMember) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (request.method !== "POST") return Response.json({ ok: false, error: "Method not allowed" }, { status: 405 });

  let body;
  try { body = await request.json(); } catch { return Response.json({ ok: false, error: "Bad request" }, { status: 400 }); }

  const membership = await getMembershipRecordByEmail(user.email);
  const record = membership.record;

  if (body.action === "billing_portal") {
    if (!record?.stripeCustomerId) {
      return Response.json({ ok: false, error: "No billing account is attached to this membership. Email info@aidedeq.org and a person will help." }, { status: 404 });
    }
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const session = await stripe.billingPortal.sessions.create({
        customer: record.stripeCustomerId,
        return_url: `${SITE}/account`,
      });
      return Response.json({ ok: true, url: session.url });
    } catch {
      return Response.json({ ok: false, error: "Billing is temporarily unavailable. Your membership has not changed." }, { status: 502 });
    }
  }

  if (body.action === "close_account") {
    // Ends everything: Stripe subscription, the member record, and member access.
    if (String(body.confirm || "").trim().toUpperCase() !== "CLOSE") {
      return Response.json({ ok: false, error: "Type CLOSE to confirm" }, { status: 400 });
    }
    if (record?.stripeSubscriptionId) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        await stripe.subscriptions.cancel(record.stripeSubscriptionId);
      } catch {
        return Response.json({ ok: false, error: "Your membership could not be cancelled just now, so nothing was erased. Try again, or email info@aidedeq.org." }, { status: 502 });
      }
    }
    const identityUser = await findIdentityUserByEmail(user.email);
    if (identityUser) {
      const kept = (Array.isArray(identityUser.roles) ? identityUser.roles : []).filter((role) => !MEMBER_ROLES.includes(role));
      await admin.updateUser(identityUser.id, { app_metadata: { ...(identityUser.appMetadata || {}), roles: kept, membership_status: "closed" } });
    }
    const store = membershipStore();
    if (membership.key) await store.delete(membership.key).catch(() => {});
    if (record?.stripeSubscriptionId) await store.delete(`subscription/${record.stripeSubscriptionId}`).catch(() => {});
    if (record?.stripeCustomerId) await store.delete(`customer/${record.stripeCustomerId}`).catch(() => {});
    return Response.json({ ok: true, closed: true });
  }

  return Response.json({ ok: false, error: "Unknown action" }, { status: 400 });
}

export const config = { path: ["/account", "/account/"] };
