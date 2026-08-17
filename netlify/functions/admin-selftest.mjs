// TEMPORARY diagnostic, key-guarded. Delete after use.
import Stripe from "stripe";
import { grantIdentityRole, membershipStore, membershipYearBounds, saveMembershipRecord } from "./_shared/membership.mjs";

export default async (req) => {
  const key = process.env.SELFTEST_KEY;
  if (!key || req.headers.get("x-selftest-key") !== key) return Response.json({ ok: false }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const out = {};

  // 1. is Stripe configured to call us at all
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const endpoints = await stripe.webhookEndpoints.list({ limit: 10 });
    out.stripeEndpoints = endpoints.data.map((e) => ({ url: e.url, status: e.status, events: e.enabled_events }));
    const sessions = await stripe.checkout.sessions.list({ limit: 5 });
    out.recentCheckouts = sessions.data.map((s) => ({
      created: new Date(s.created * 1000).toISOString().slice(0, 16),
      status: s.status, paid: s.payment_status,
      amount: (s.amount_total || 0) / 100,
      email: s.customer_details?.email || null,
      link: s.payment_link || null,
    }));
  } catch (error) {
    out.stripeError = error.message;
  }

  // 2. does the buyer path work end to end
  if (body.email) {
    try {
      const store = membershipStore();
      const createdAt = new Date().toISOString();
      const year = membershipYearBounds(createdAt, createdAt);
      const record = {
        email: String(body.email).toLowerCase(), plan: "membership", role: "member", planLabel: "Membership",
        status: "active", stripeCustomerId: null, stripeSubscriptionId: null, selftest: true,
        originalMembershipStart: createdAt, membershipYearIndex: year.yearIndex,
        membershipYearStart: year.start, membershipYearEnd: year.end, currentPeriodEnd: year.end,
        cancelAtPeriodEnd: false, workshopVoucherAllowanceFirstYear: 1, workshopVoucherAllowanceRenewalYears: 1,
        foundingBonusEligible: false, foundingSequence: null, createdAt, updatedAt: createdAt,
      };
      await saveMembershipRecord(store, record);
      out.provision = await grantIdentityRole(record);
    } catch (error) {
      out.provisionError = error.message;
    }
  }
  return Response.json({ ok: true, ...out });
};

export const config = { path: "/admin-selftest" };
