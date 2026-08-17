import { getStore } from "@netlify/blobs";
import { admin, getIdentityConfig } from "@netlify/identity";
import { identityApiReady, upsertMember, setRoles, sendSetPasswordEmail } from "./identity-api.mjs";

export const MEMBERSHIP_ROLES = ["member", "founding_villager"];
export const FOUNDING_CUTOFF = "2026-10-31T15:00:00-05:00";
export const FOUNDING_LIMIT = 108;

export const PLAN_BY_PAYMENT_LINK = {
  plink_1U3SBE2ZVkTQmuLQcHdmQ7s9: {
    plan: "founding_villager",
    role: "founding_villager",
    label: "Founding Villager",
  },
  plink_1U3SHI2ZVkTQmuLQc8dFuGso: {
    plan: "membership",
    role: "member",
    label: "Membership",
  },
};

export function membershipStore() {
  return getStore({ name: "practice-village-memberships", consistency: "strong" });
}

export async function sha256(value) {
  const bytes = new TextEncoder().encode(String(value).trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function memberKeyForEmail(email) {
  return `member/${await sha256(email)}`;
}

export function stripeId(value) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

export function isoFromUnix(value) {
  return value ? new Date(value * 1000).toISOString() : null;
}

export function subscriptionPeriodEnd(subscription) {
  const ends = (subscription.items?.data || []).map((item) => item.current_period_end).filter(Boolean);
  return isoFromUnix(ends.length ? Math.max(...ends) : null);
}

export function membershipYearBounds(startIso, atIso = new Date().toISOString()) {
  const start = new Date(startIso);
  const at = new Date(atIso);
  let yearIndex = Math.max(0, at.getUTCFullYear() - start.getUTCFullYear());
  let yearStart = new Date(start);
  yearStart.setUTCFullYear(start.getUTCFullYear() + yearIndex);
  if (yearStart > at) {
    yearIndex -= 1;
    yearStart = new Date(start);
    yearStart.setUTCFullYear(start.getUTCFullYear() + yearIndex);
  }
  const yearEnd = new Date(yearStart);
  yearEnd.setUTCFullYear(yearStart.getUTCFullYear() + 1);
  return { yearIndex, start: yearStart.toISOString(), end: yearEnd.toISOString() };
}

export function isActiveStripeStatus(status) {
  return ["active", "trialing", "past_due"].includes(status);
}

export async function findIdentityUserByEmail(email) {
  const wanted = email.trim().toLowerCase();
  const perPage = 100;
  for (let page = 1; page <= 100; page += 1) {
    const users = await admin.listUsers({ page, perPage });
    const match = users.find((user) => user.email?.trim().toLowerCase() === wanted);
    if (match) return match;
    if (users.length < perPage) return null;
  }
  return null;
}

async function inviteIdentityUser(email) {
  const identity = getIdentityConfig();
  if (!identity?.url || !identity.token) throw new Error("Identity operator access is unavailable");
  const response = await fetch(`${identity.url}/invite`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${identity.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.id) throw new Error(payload.msg || "Identity invitation could not be created");
  return payload;
}

export async function grantIdentityRole(record) {
  // Preferred path. v2 functions get no Identity operator token, so the
  // account is created over the Netlify API and the member is emailed a
  // set-password link that also confirms the account.
  if (identityApiReady()) {
    const { user, created } = await upsertMember(record.email, {
      roles: [record.role],
      appMetadata: {
        membership_plan: record.plan,
        membership_status: record.status,
        stripe_customer_id: record.stripeCustomerId,
        stripe_subscription_id: record.stripeSubscriptionId,
      },
    });
    let accountSetupEmailSent = false;
    if (created || !user.confirmed_at) {
      accountSetupEmailSent = await sendSetPasswordEmail(record.email);
    }
    return { userId: user.id, accountSetupEmailSent };
  }

  let user = await findIdentityUserByEmail(record.email);
  let accountSetupEmailSent = false;

  if (!user) {
    user = await inviteIdentityUser(record.email);
    user = await admin.updateUser(user.id, {
      app_metadata: {
        roles: [record.role],
        membership_plan: record.plan,
        membership_status: record.status,
        stripe_customer_id: record.stripeCustomerId,
        stripe_subscription_id: record.stripeSubscriptionId,
      },
    });
    accountSetupEmailSent = true;
  } else {
    const existingRoles = Array.isArray(user.roles) ? user.roles : [];
    const roles = Array.from(new Set([...existingRoles.filter((role) => !MEMBERSHIP_ROLES.includes(role)), record.role]));
    user = await admin.updateUser(user.id, {
      app_metadata: {
        ...(user.appMetadata || {}),
        roles,
        membership_plan: record.plan,
        membership_status: record.status,
        stripe_customer_id: record.stripeCustomerId,
        stripe_subscription_id: record.stripeSubscriptionId,
      },
    });
  }

  return { userId: user.id, accountSetupEmailSent };
}

export async function revokeIdentityMembership(record) {
  if (identityApiReady()) {
    const { findUser } = await import("./identity-api.mjs");
    const apiUser = await findUser(record.email);
    if (!apiUser) return { userId: null };
    const kept = (apiUser.app_metadata?.roles || []).filter((role) => !MEMBERSHIP_ROLES.includes(role));
    await setRoles(record.email, kept);
    return { userId: apiUser.id };
  }
  const user = await findIdentityUserByEmail(record.email);
  if (!user) return { userId: null };
  const existingRoles = Array.isArray(user.roles) ? user.roles : [];
  const roles = existingRoles.filter((role) => !MEMBERSHIP_ROLES.includes(role));
  await admin.updateUser(user.id, {
    app_metadata: {
      ...(user.appMetadata || {}),
      roles,
      membership_plan: record.plan,
      membership_status: record.status,
      stripe_customer_id: record.stripeCustomerId,
      stripe_subscription_id: record.stripeSubscriptionId,
    },
  });
  return { userId: user.id };
}

export async function countFoundingBonusMembers(store) {
  const { blobs } = await store.list({ prefix: "member/" });
  let count = 0;
  for (const blob of blobs) {
    const record = await store.get(blob.key, { type: "json" });
    if (record?.foundingBonusEligible) count += 1;
  }
  return count;
}

export async function saveMembershipRecord(store, record) {
  const key = await memberKeyForEmail(record.email);
  await store.setJSON(key, record);
  if (record.stripeSubscriptionId) await store.set(`subscription/${record.stripeSubscriptionId}`, key);
  if (record.stripeCustomerId) await store.set(`customer/${record.stripeCustomerId}`, key);
  return key;
}

export async function getRecordBySubscription(store, subscriptionId) {
  const key = await store.get(`subscription/${subscriptionId}`);
  return key ? store.get(key, { type: "json" }) : null;
}

export async function getMembershipRecordByEmail(email) {
  const store = membershipStore();
  const key = await memberKeyForEmail(email);
  return { store, key, record: await store.get(key, { type: "json" }) };
}
