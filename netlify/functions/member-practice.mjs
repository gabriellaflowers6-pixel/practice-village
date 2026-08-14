import { getUser } from "@netlify/identity";
import { getMembershipRecordByEmail, sha256 } from "./_shared/membership.mjs";

const MEMBER_ROLES = ["member", "founding_villager", "admin", "test_member"];
const WHENS = ["daily", "this_week", "date"];
const MAX_ITEMS = 50;

const str = (value, max) => String(value == null ? "" : value).trim().slice(0, max);
const isoDay = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) ? value : null;
const safeHref = (value) => {
  const href = str(value, 400);
  return /^(https?:\/\/|\/)[^\s]*$/i.test(href) ? href : null;
};

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
  const record = membership.record
    || (isAdminTest ? (await store.get(key, { type: "json" })) || { email: user.email, testAccount: true } : null);
  if (!record) return Response.json({ ok: false, error: "Membership not found" }, { status: 404 });

  if (!record.practice || typeof record.practice !== "object") record.practice = {};
  if (!Array.isArray(record.practice.items)) record.practice.items = [];
  const practice = record.practice;

  const view = () => ({
    ok: true,
    view: practice.view === "week" ? "week" : "list",
    items: practice.items,
  });

  if (request.method === "GET") return Response.json(view());
  if (request.method !== "POST") return Response.json({ ok: false, error: "Method not allowed" }, { status: 405 });

  let body;
  try { body = await request.json(); } catch { return Response.json({ ok: false, error: "Bad request" }, { status: 400 }); }
  const now = new Date().toISOString();

  if (body.action === "add_item") {
    const source = body.item || {};
    const title = str(source.title, 160);
    const when = WHENS.includes(source.when) ? source.when : null;
    const date = source.when === "date" ? isoDay(source.date) : null;
    if (!title || !when || (when === "date" && !date)) {
      return Response.json({ ok: false, error: "Nothing to add" }, { status: 400 });
    }
    const duplicate = practice.items.find((item) => item.title === title && item.when === when && (item.date || null) === date);
    if (duplicate) return Response.json({ ...view(), alreadyThere: true });
    if (practice.items.length >= MAX_ITEMS) {
      return Response.json({ ok: false, error: "My Practice is full. Remove something first." }, { status: 400 });
    }
    practice.items.push({
      id: crypto.randomUUID(),
      title,
      when,
      ...(date ? { date } : {}),
      ...(safeHref(source.href) ? { href: safeHref(source.href) } : {}),
      ...(str(source.linkLabel, 60) ? { linkLabel: str(source.linkLabel, 60) } : {}),
      ...(str(source.source, 40) ? { source: str(source.source, 40) } : {}),
      addedAt: now,
    });
  } else if (body.action === "toggle_done") {
    const today = isoDay(body.today);
    const item = practice.items.find((entry) => entry.id === body.id);
    if (!item || !today) return Response.json({ ok: false, error: "Nothing to check" }, { status: 400 });
    item.doneOn = item.doneOn === today ? null : today;
    // a dated return that was done before today has served its purpose: no history kept
    practice.items = practice.items.filter((entry) => !(entry.when === "date" && entry.doneOn && entry.doneOn < today));
  } else if (body.action === "remove_item") {
    const before = practice.items.length;
    practice.items = practice.items.filter((entry) => entry.id !== body.id);
    if (practice.items.length === before) return Response.json({ ok: false, error: "That is not in My Practice" }, { status: 404 });
  } else if (body.action === "set_view") {
    practice.view = body.view === "week" ? "week" : "list";
  } else {
    return Response.json({ ok: false, error: "Unknown action" }, { status: 400 });
  }

  record.updatedAt = now;
  await store.setJSON(key, record);
  return Response.json(view());
}

export const config = { path: "/member-practice" };
