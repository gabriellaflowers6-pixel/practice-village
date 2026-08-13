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

  if (request.method === "GET") {
    return Response.json({
      ok: true,
      onboarding: record.onboarding ? {
        status: record.onboarding.status,
        summary: record.onboarding.summary,
        completedAt: record.onboarding.completedAt,
      } : { status: "not_started", summary: null, completedAt: null },
    });
  }

  if (request.method !== "POST") {
    return Response.json({ ok: false, error: "Method not allowed" }, { status: 405 });
  }

  let body;
  try { body = await request.json(); } catch { return Response.json({ ok: false, error: "Bad request" }, { status: 400 }); }
  const decision = body.decision === "save" ? "save" : body.decision === "private" ? "private" : null;
  if (!decision) return Response.json({ ok: false, error: "Choose save or private" }, { status: 400 });

  const now = new Date().toISOString();
  record.onboarding = decision === "save"
    ? { status: "complete", summary: String(body.summary || "").trim().slice(0, 400) || null, completedAt: now }
    : { status: "complete_private", summary: null, completedAt: now };
  record.updatedAt = now;
  await store.setJSON(key, record);
  return Response.json({ ok: true, onboarding: record.onboarding });
}

export const config = { path: "/member-onboarding" };
