import { getUser } from "@netlify/identity";
import { memberKeyForEmail, membershipStore } from "./_shared/membership.mjs";

export default async function handler() {
  const user = await getUser();
  if (!user?.email) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const store = membershipStore();
  const record = await store.get(await memberKeyForEmail(user.email), { type: "json" });
  const roles = Array.isArray(user.roles) ? user.roles : [];
  if (!record && roles.some((role) => ["admin", "test_member"].includes(role))) {
    return Response.json({ ok: true, membership: {
      plan: "admin",
      planLabel: "Village team",
      status: "active",
      membershipYearStart: null,
      membershipYearEnd: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      workshopVoucherAllowanceFirstYear: 0,
      workshopVoucherAllowanceRenewalYears: 0,
      workshopVoucherAllowance: 0,
      foundingBonusEligible: false,
      foundingSequence: null,
      onboardingStatus: "not_started",
      testAccount: true,
    } });
  }
  if (!record) return Response.json({ ok: false, error: "Membership not found" }, { status: 404 });
  const workshopVoucherAllowance = record.membershipYearIndex === 0
    ? record.workshopVoucherAllowanceFirstYear
    : record.workshopVoucherAllowanceRenewalYears;

  return Response.json({
    ok: true,
    membership: {
      plan: record.plan,
      planLabel: record.planLabel,
      status: record.status,
      membershipYearStart: record.membershipYearStart,
      membershipYearEnd: record.membershipYearEnd,
      currentPeriodEnd: record.currentPeriodEnd,
      cancelAtPeriodEnd: record.cancelAtPeriodEnd,
      workshopVoucherAllowanceFirstYear: record.workshopVoucherAllowanceFirstYear,
      workshopVoucherAllowanceRenewalYears: record.workshopVoucherAllowanceRenewalYears,
      workshopVoucherAllowance,
      foundingBonusEligible: record.foundingBonusEligible,
      foundingSequence: record.foundingSequence,
      onboardingStatus: record.onboarding?.status || "not_started",
    },
  });
}

export const config = {
  path: "/member-status",
};
