// Manual membership provisioning, for when a payment lands but the webhook did
// not (Stripe endpoint missing, replayed event, a purchase made before the
// webhook existed). Admin role required.
//
// POST /admin-provision { "email": "...", "plan": "founding_villager" | "membership" }
import { getUser } from "./_shared/session.mjs";
import {
  FOUNDING_CUTOFF,
  FOUNDING_LIMIT,
  countFoundingBonusMembers,
  grantIdentityRole,
  membershipStore,
  membershipYearBounds,
  saveMembershipRecord,
  sha256,
} from "./_shared/membership.mjs";
import { notifyCuraited } from "./_shared/curaited-notify.mjs";

const PLANS = {
  founding_villager: { plan: "founding_villager", role: "founding_villager", label: "Founding Villager" },
  membership: { plan: "membership", role: "member", label: "Membership" },
};

export default async (req) => {
  let user = null;
  try {
    user = await getUser();
  } catch {
    user = null;
  }
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  if (!user || !roles.includes("admin")) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const plan = PLANS[body.plan];
  if (!email.includes("@") || !plan) {
    return Response.json({ ok: false, error: "email and plan are required" }, { status: 400 });
  }

  const store = membershipStore();
  const createdAt = new Date().toISOString();
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
    email,
    plan: plan.plan,
    role: plan.role,
    planLabel: plan.label,
    status: "active",
    stripeCustomerId: body.stripeCustomerId || null,
    stripeSubscriptionId: body.stripeSubscriptionId || null,
    stripePaymentLinkId: body.stripePaymentLinkId || null,
    provisionedBy: user.email,
    originalMembershipStart: createdAt,
    membershipYearIndex: membershipYear.yearIndex,
    membershipYearStart: membershipYear.start,
    membershipYearEnd: membershipYear.end,
    currentPeriodEnd: membershipYear.end,
    cancelAtPeriodEnd: false,
    workshopVoucherAllowanceFirstYear: foundingBonusEligible ? 2 : 1,
    workshopVoucherAllowanceRenewalYears: 1,
    foundingBonusEligible,
    foundingSequence,
    createdAt,
    updatedAt: createdAt,
  };

  await saveMembershipRecord(store, record);
  const identity = await grantIdentityRole(record);

  // A hand-provisioned member is still a member: her included Cur.AI.ted
  // starter has to follow the Village role, exactly as it does for a Stripe
  // purchase. Without this, team, comp, and test members reach Cur.AI.ted with
  // no entitlement and land on the free tier.
  //
  // memberId must never be null — Cur.AI.ted rejects the event outright — so
  // members with no subscription get a stable synthetic id. The event id is
  // keyed to the membership year, so re-provisioning the same person is
  // deduplicated while a renewal year grants again.
  const emailKey = await sha256(email);
  const curaited = await notifyCuraited({
    stripeEventId: `adminprov_${emailKey}_${membershipYear.start}`,
    eventType: "membership.activated",
    email,
    memberId: record.stripeSubscriptionId || `pv_member_${emailKey}`,
    membershipStatus: "active",
    accessEndsAt: record.currentPeriodEnd,
  });

  return Response.json({
    ok: true,
    email,
    plan: record.planLabel,
    foundingSequence,
    accountSetupEmailSent: identity.accountSetupEmailSent,
    curaitedStarter: curaited?.ok ? "granted" : curaited?.skipped ? "skipped" : "failed",
  });
};

export const config = { path: "/admin-provision" };
