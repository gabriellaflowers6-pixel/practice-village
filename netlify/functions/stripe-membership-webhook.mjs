import Stripe from "stripe";
import { notifyCuraited } from "./_shared/curaited-notify.mjs";
import { sendWelcomeEmail } from "./_shared/welcome-email.mjs";
import {
  FOUNDING_CUTOFF,
  FOUNDING_LIMIT,
  PLAN_BY_PAYMENT_LINK,
  countFoundingBonusMembers,
  getRecordBySubscription,
  grantIdentityRole,
  isActiveStripeStatus,
  isoFromUnix,
  membershipYearBounds,
  membershipStore,
  revokeIdentityMembership,
  saveMembershipRecord,
  stripeId,
  subscriptionPeriodEnd,
} from "./_shared/membership.mjs";

function response(body, status = 200) {
  return Response.json(body, { status });
}

function requireEnv(name) {
  const value = Netlify.env.get(name);
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

const YEARLY_PLAN = { plan: "founding_villager", role: "founding_villager", label: "Founding Villager" };
const MONTHLY_PLAN = { plan: "membership", role: "member", label: "Membership" };

// Coupons, new links, dashboard subscriptions and invoices all have to land a
// member. The payment link is the best signal when we know it; the billing
// interval is the fallback that still works when we do not.
function resolvePlan(paymentLinkId, subscription) {
  const known = PLAN_BY_PAYMENT_LINK[paymentLinkId];
  if (known) return { ...known, resolvedBy: "payment_link" };
  const price = subscription?.items?.data?.[0]?.price;
  const interval = price?.recurring?.interval;
  if (interval === "year") return { ...YEARLY_PLAN, resolvedBy: "interval" };
  if (interval === "month") return { ...MONTHLY_PLAN, resolvedBy: "interval" };
  return { ...MONTHLY_PLAN, resolvedBy: "fallback" };
}

async function handleCheckoutCompleted(stripe, store, session, event) {
  const paymentLinkId = stripeId(session.payment_link);

  const email = session.customer_details?.email || session.customer_email;
  if (!email) throw new Error("The completed Stripe session has no customer email");

  const subscriptionId = stripeId(session.subscription);
  if (!subscriptionId) throw new Error("The completed Stripe session has no subscription");
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const plan = resolvePlan(paymentLinkId, subscription);
  const createdAt = isoFromUnix(session.created || event.created);
  const membershipYear = membershipYearBounds(createdAt, createdAt);

  let foundingBonusEligible = false;
  let foundingSequence = null;
  if (plan.plan === "founding_villager" && Date.parse(createdAt) <= Date.parse(FOUNDING_CUTOFF)) {
    const currentCount = await countFoundingBonusMembers(store);
    if (currentCount < FOUNDING_LIMIT) {
      foundingBonusEligible = true;
      foundingSequence = currentCount + 1;
    }
  }

  const record = {
    email: email.trim().toLowerCase(),
    plan: plan.plan,
    role: plan.role,
    planLabel: plan.label,
    status: subscription.status,
    stripeCustomerId: stripeId(session.customer || subscription.customer),
    stripeSubscriptionId: subscription.id,
    stripePaymentLinkId: paymentLinkId,
    originalMembershipStart: createdAt,
    membershipYearIndex: membershipYear.yearIndex,
    membershipYearStart: membershipYear.start,
    membershipYearEnd: membershipYear.end,
    currentPeriodEnd: subscriptionPeriodEnd(subscription),
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    workshopVoucherAllowanceFirstYear: foundingBonusEligible ? 2 : 1,
    workshopVoucherAllowanceRenewalYears: 1,
    foundingBonusEligible,
    foundingSequence,
    createdAt,
    updatedAt: new Date().toISOString(),
  };

  await saveMembershipRecord(store, record);
  await notifyCuraited({
    stripeEventId: event.id,
    eventType: "membership.activated",
    email: record.email,
    memberId: record.stripeSubscriptionId,
    membershipStatus: record.status,
    accessEndsAt: record.currentPeriodEnd,
  });
  if (isActiveStripeStatus(record.status)) {
    const identity = await grantIdentityRole(record);
    const welcome = await sendWelcomeEmail(record.email, {
      planLabel: record.planLabel,
      setPasswordNeeded: identity.accountSetupEmailSent,
    });
    return {
      plan: record.plan,
      status: record.status,
      resolvedBy: plan.resolvedBy,
      accountSetupEmailSent: identity.accountSetupEmailSent,
      welcomeEmail: welcome,
    };
  }
  return { plan: record.plan, status: record.status };
}

// A subscription started outside Checkout (dashboard, invoice, API) still has
// to produce a member and a welcome.
async function handleSubscriptionCreated(stripe, store, subscription, event) {
  const customerId = stripeId(subscription.customer);
  const customer = customerId ? await stripe.customers.retrieve(customerId) : null;
  const email = customer?.email;
  if (!email) return { ignored: true, reason: "subscription has no customer email" };
  if (!isActiveStripeStatus(subscription.status)) {
    return { ignored: true, reason: `subscription status is ${subscription.status}` };
  }

  const plan = resolvePlan(null, subscription);
  const createdAt = isoFromUnix(subscription.created || event.created);
  const membershipYear = membershipYearBounds(createdAt, createdAt);

  let foundingBonusEligible = false;
  let foundingSequence = null;
  if (plan.plan === "founding_villager" && Date.parse(createdAt) <= Date.parse(FOUNDING_CUTOFF)) {
    const currentCount = await countFoundingBonusMembers(store);
    if (currentCount < FOUNDING_LIMIT) {
      foundingBonusEligible = true;
      foundingSequence = currentCount + 1;
    }
  }

  const record = {
    email: email.trim().toLowerCase(),
    plan: plan.plan,
    role: plan.role,
    planLabel: plan.label,
    status: subscription.status,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    stripePaymentLinkId: null,
    originalMembershipStart: createdAt,
    membershipYearIndex: membershipYear.yearIndex,
    membershipYearStart: membershipYear.start,
    membershipYearEnd: membershipYear.end,
    currentPeriodEnd: subscriptionPeriodEnd(subscription),
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    workshopVoucherAllowanceFirstYear: foundingBonusEligible ? 2 : 1,
    workshopVoucherAllowanceRenewalYears: 1,
    foundingBonusEligible,
    foundingSequence,
    createdAt,
    updatedAt: new Date().toISOString(),
  };

  await saveMembershipRecord(store, record);
  const identity = await grantIdentityRole(record);
  const welcome = await sendWelcomeEmail(record.email, {
    planLabel: record.planLabel,
    setPasswordNeeded: identity.accountSetupEmailSent,
  });
  return { plan: record.plan, status: record.status, resolvedBy: plan.resolvedBy, welcomeEmail: welcome };
}

async function handleSubscriptionChanged(store, subscription, event) {
  const record = await getRecordBySubscription(store, subscription.id);
  if (!record) return { ignored: true, reason: "subscription is not linked to a Practice Village membership" };

  record.status = subscription.status;
  record.stripeCustomerId = stripeId(subscription.customer) || record.stripeCustomerId;
  record.currentPeriodEnd = subscriptionPeriodEnd(subscription) || record.currentPeriodEnd;
  const membershipYear = membershipYearBounds(record.originalMembershipStart || record.membershipYearStart);
  record.membershipYearIndex = membershipYear.yearIndex;
  record.membershipYearStart = membershipYear.start;
  record.membershipYearEnd = membershipYear.end;
  record.cancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end);
  record.updatedAt = new Date().toISOString();
  await saveMembershipRecord(store, record);

  if (isActiveStripeStatus(record.status)) await grantIdentityRole(record);
  else await revokeIdentityMembership(record);
  await notifyCuraited({
    stripeEventId: event?.id || `${subscription.id}:${subscription.status}`,
    eventType: isActiveStripeStatus(record.status) ? "membership.updated" : "membership.cancelled",
    email: record.email,
    memberId: record.stripeSubscriptionId,
    membershipStatus: record.status,
    accessEndsAt: record.currentPeriodEnd,
  });
  return { plan: record.plan, status: record.status };
}

export default async function handler(request) {
  if (request.method !== "POST") return response({ ok: false, error: "Method not allowed" }, 405);

  try {
    const stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"));
    const signature = request.headers.get("stripe-signature");
    if (!signature) return response({ ok: false, error: "Missing Stripe signature" }, 400);
    const payload = await request.text();
    const event = await stripe.webhooks.constructEventAsync(payload, signature, requireEnv("STRIPE_MEMBERSHIP_WEBHOOK_SECRET"));
    const store = membershipStore();
    const eventKey = `event/${event.id}`;
    if (await store.getMetadata(eventKey)) return response({ ok: true, duplicate: true });

    let result = { ignored: true, reason: "event type is not used" };
    if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) {
      result = await handleCheckoutCompleted(stripe, store, event.data.object, event);
    } else if (event.type === "customer.subscription.created") {
      const existing = await getRecordBySubscription(store, event.data.object.id);
      result = existing
        ? { ignored: true, reason: "already provisioned" }
        : await handleSubscriptionCreated(stripe, store, event.data.object, event);
    } else if (["customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
      result = await handleSubscriptionChanged(store, event.data.object, event);
    }

    await store.setJSON(eventKey, { type: event.type, processedAt: new Date().toISOString(), result });
    return response({ ok: true, result });
  } catch (error) {
    console.error("Membership webhook failed", error instanceof Error ? error.message : "Unknown error");
    return response({ ok: false, error: "Membership update could not be completed" }, 400);
  }
}

export const config = {
  path: "/stripe-membership-webhook",
};
