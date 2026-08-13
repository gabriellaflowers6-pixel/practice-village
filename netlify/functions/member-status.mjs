import { getUser } from "@netlify/identity";
import { memberKeyForEmail, membershipStore } from "./_shared/membership.mjs";

export default async function handler() {
  const user = await getUser();
  if (!user?.email) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const store = membershipStore();
  const record = await store.get(await memberKeyForEmail(user.email), { type: "json" });
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
    },
  });
}

export const config = {
  path: "/member-status",
};
