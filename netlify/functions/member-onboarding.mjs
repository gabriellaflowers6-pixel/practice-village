import { getUser } from "@netlify/identity";
import { getMembershipRecordByEmail, sha256 } from "./_shared/membership.mjs";

const MEMBER_ROLES = ["member", "founding_villager", "admin", "test_member"];

const str = (value, max) => String(value == null ? "" : value).trim().slice(0, max);
const safeHref = (value) => {
  const href = str(value, 400);
  return /^https?:\/\//i.test(href) ? href : null;
};

// A kept card may carry the thing itself: the search she should run, or the places to look.
// Everything is bounded here, because this is member-supplied content going into the record.
function cleanDetail(detail) {
  if (!detail || typeof detail !== "object") return null;
  if (detail.kind === "search") {
    const query = str(detail.query, 300);
    if (!query) return null;
    const steps = (Array.isArray(detail.steps) ? detail.steps : []).map((step) => str(step, 300)).filter(Boolean).slice(0, 6);
    const trustNote = str(detail.trustNote, 300);
    return { kind: "search", query, ...(trustNote ? { trustNote } : {}), ...(steps.length ? { steps } : {}) };
  }
  if (detail.kind === "resources") {
    const items = (Array.isArray(detail.items) ? detail.items : [])
      .map((item) => ({ name: str(item?.name, 160), href: safeHref(item?.href), detail: str(item?.detail, 240) }))
      .filter((item) => item.name && item.href)
      .slice(0, 8);
    if (!items.length) return null;
    const sourceNote = str(detail.sourceNote, 300);
    return { kind: "resources", items, ...(sourceNote ? { sourceNote } : {}) };
  }
  return null;
}

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
  // Test accounts store their record under the test key: read it back, never fabricate a fresh one
  const record = membership.record || (isAdminTest ? (await store.get(key, { type: "json" })) || { email: user.email, testAccount: true } : null);
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
  const savedCardsView = () => (Array.isArray(record.savedCards) ? record.savedCards : [])
    .filter((entry) => entry && typeof entry.text === "string" && entry.text.trim())
    .map((entry) => ({ text: entry.text, savedAt: entry.savedAt || null, ...(entry.detail ? { detail: entry.detail } : {}), ...(entry.note ? { note: entry.note, notedAt: entry.notedAt || null } : {}) }))
    .reverse();

  if (request.method === "GET") {
    return Response.json({
      ok: true,
      onboarding: onboardingView(),
      foundingEligible,
      founderListing: founderListingView(),
      savedCards: savedCardsView(),
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
  } else if (body.action === "save_cards") {
    const cards = [];
    const seen = new Set();
    for (const item of Array.isArray(body.cards) ? body.cards.slice(0, 12) : []) {
      const source = typeof item === "string" ? { text: item } : item;
      const text = String(source?.text || "").trim().slice(0, 300);
      if (!text || seen.has(text)) continue;
      seen.add(text);
      const detail = cleanDetail(source?.detail);
      cards.push(detail ? { text, detail } : { text });
    }
    if (!cards.length) return Response.json({ ok: false, error: "Nothing to save" }, { status: 400 });
    const existing = Array.isArray(record.savedCards) ? record.savedCards : [];
    const merged = [...existing];
    for (const card of cards) if (!merged.some((entry) => entry.text === card.text)) merged.push({ ...card, savedAt: now });
    record.savedCards = merged.slice(-100);
  } else if (body.action === "note_card") {
    // what happened when she acted on a kept thing: her words, attached to that entry
    const text = str(body.text, 300);
    const note = str(body.note, 600);
    const existing = Array.isArray(record.savedCards) ? record.savedCards : [];
    const entry = existing.find((item) => item?.text === text);
    if (!entry) return Response.json({ ok: false, error: "That is not in your Record" }, { status: 404 });
    if (note) {
      entry.note = note;
      entry.notedAt = now;
    } else {
      delete entry.note;
      delete entry.notedAt;
    }
  } else if (body.action === "erase_record") {
    // Erase my Record: what she kept, My Practice, and her consented notes. Membership stays.
    if (String(body.confirm || "").trim().toUpperCase() !== "ERASE") {
      return Response.json({ ok: false, error: "Type ERASE to confirm" }, { status: 400 });
    }
    delete record.savedCards;
    delete record.practice;
    record.onboarding = { status: "erased", preferences: [], completedAt: null, erasedAt: now };
  } else if (body.action === "skip") {
    // orientation goes quiet once declined: never re-ask, always reachable from the account row
    if (!["complete", "complete_private"].includes(record.onboarding?.status)) {
      record.onboarding = { status: "skipped", preferences: [], completedAt: null, skippedAt: now };
    }
  } else if (body.action === "remove_card") {
    const text = String(body.text || "").trim().slice(0, 180);
    if (!text) return Response.json({ ok: false, error: "Nothing to remove" }, { status: 400 });
    const existing = Array.isArray(record.savedCards) ? record.savedCards : [];
    const kept = existing.filter((entry) => entry?.text !== text);
    if (kept.length === existing.length) {
      return Response.json({ ok: false, error: "That is not in your Record" }, { status: 404 });
    }
    record.savedCards = kept;
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
    savedCards: savedCardsView(),
  });
}

export const config = { path: "/member-onboarding" };
