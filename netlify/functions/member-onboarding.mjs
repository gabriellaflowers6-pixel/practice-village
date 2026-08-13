import { getUser } from "@netlify/identity";
import { getMembershipRecordByEmail, sha256 } from "./_shared/membership.mjs";

const MEMBER_ROLES = ["member", "founding_villager", "admin", "test_member"];

export default async function handler(request) {
  const user = await getUser();
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  if (!user?.email || !roles.some((role) => MEMBER_ROLES.includes(role))) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const membership = await getMembershipRecordByEmail(user.email);
  const { store } = membership;
  const isAdminTest = roles.some((role) => ["admin", "test_member"].includes(role)) && !membership.record;
  const key = isAdminTest ? `test-onboarding/${await sha256(user.email)}` : membership.key;
  const record = membership.record || (isAdminTest ? { email: user.email, testAccount: true } : null);
  if (!record) return Response.json({ ok: false, error: "Membership not found" }, { status: 404 });

  const foundingEligible = roles.includes("founding_villager") || record.plan === "founding_villager" || (isAdminTest && roles.includes("test_member"));
  const onboardingView = () => record.onboarding ? {
    status: record.onboarding.status,
    preferences: Array.isArray(record.onboarding.preferences) ? record.onboarding.preferences : [],
    completedAt: record.onboarding.completedAt || null,
  } : { status: "not_started", preferences: [], completedAt: null };
  const founderListingView = () => record.founderListing ? {
    decision: record.founderListing.decision,
    displayName: record.founderListing.displayName || null,
    updatedAt: record.founderListing.updatedAt || null,
  } : null;

  if (request.method === "GET") {
    return Response.json({
      ok: true,
      onboarding: onboardingView(),
      foundingEligible,
      founderListing: founderListingView(),
    });
  }

  if (request.method !== "POST") {
    return Response.json({ ok: false, error: "Method not allowed" }, { status: 405 });
  }

  let body;
  try { body = await request.json(); } catch { return Response.json({ ok: false, error: "Bad request" }, { status: 400 }); }
  const now = new Date().toISOString();

  if (body.action === "complete") {
    const decision = body.decision === "remember" ? "remember" : body.decision === "not_now" ? "not_now" : null;
    if (!decision) return Response.json({ ok: false, error: "Choose remember or not now" }, { status: 400 });
    const memories = Array.isArray(body.memories)
      ? [...new Set(body.memories.map((item) => String(item || "").trim().slice(0, 180)).filter(Boolean))].slice(0, 6)
      : [];
    const existingPreferences = Array.isArray(record.onboarding?.preferences) ? record.onboarding.preferences : [];
    const preferences = decision === "remember" ? memories : existingPreferences;
    record.onboarding = {
      status: preferences.length ? "complete" : "complete_private",
      preferences,
      completedAt: now,
    };
  } else if (body.action === "founder_listing") {
    if (!foundingEligible) return Response.json({ ok: false, error: "Founding Villager access required" }, { status: 403 });
    const decision = body.decision === "yes" ? "yes" : body.decision === "no" ? "no" : null;
    if (!decision) return Response.json({ ok: false, error: "Choose yes or no" }, { status: 400 });
    const displayName = String(body.displayName || "").trim().slice(0, 80);
    if (decision === "yes" && !displayName) {
      return Response.json({ ok: false, error: "Display name required" }, { status: 400 });
    }
    record.founderListing = { decision, displayName: decision === "yes" ? displayName : null, updatedAt: now };
  } else {
    return Response.json({ ok: false, error: "Unknown action" }, { status: 400 });
  }

  record.updatedAt = now;
  await store.setJSON(key, record);
  return Response.json({
    ok: true,
    onboarding: onboardingView(),
    foundingEligible,
    founderListing: founderListingView(),
  });
}

export const config = { path: "/member-onboarding" };
