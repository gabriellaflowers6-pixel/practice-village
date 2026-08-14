import { getUser } from "@netlify/identity";
import { getMembershipRecordByEmail, sha256 } from "./_shared/membership.mjs";
import { composeRecordPdf } from "./_shared/record-pdf.mjs";

const MEMBER_ROLES = ["member", "founding_villager", "admin", "test_member"];

const keptOn = (iso) => {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default async function handler() {
  const user = await getUser();
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  if (!user?.email || !roles.some((role) => MEMBER_ROLES.includes(role))) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const membership = await getMembershipRecordByEmail(user.email);
  const isAdminTest = roles.some((role) => ["admin", "test_member"].includes(role)) && !membership.record;
  const record = membership.record
    || (isAdminTest ? await membership.store.get(`test-onboarding/${await sha256(user.email)}`, { type: "json" }) : null);

  const cards = (Array.isArray(record?.savedCards) ? record.savedCards : [])
    .filter((entry) => entry && typeof entry.text === "string" && entry.text.trim())
    .map((entry) => ({ text: entry.text, keptOn: keptOn(entry.savedAt), detail: entry.detail || null }))
    .reverse();

  if (!cards.length) {
    return Response.json({ ok: false, error: "Nothing kept yet" }, { status: 404 });
  }

  const now = new Date();
  const downloadedOn = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const stamp = now.toISOString().slice(0, 10);
  const pdf = await composeRecordPdf(cards, { downloadedOn });

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="your-record-${stamp}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export const config = { path: "/record-export" };
