// Class schedule endpoint for the deployed Moxie Studios site. Mirrors
// serve.py's /schedule contract exactly (same actions, same validation,
// same error sentences). Env: SUPABASE_URL, SUPABASE_SERVICE_KEY,
// ZB_TEACH_PASS (all required; no dev defaults, no in-memory fallback in
// the cloud). Serverless invocations are stateless, so Supabase is required.
import crypto from "node:crypto";

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const LEVELS = ["gentle", "all levels", "strong"];

const json = (o) => new Response(JSON.stringify(o), { headers: { "content-type": "application/json" } });

// Encode every value embedded in a PostgREST querystring. A raw '+' means
// SPACE in a URL, so an ISO timestamp's +00:00 breaks the filter (400) and a
// plus-addressed email matches nothing. Found on first real Supabase contact
// 2026-08-07; serve.py's supq() is the local twin.
const supq = (v) => encodeURIComponent(String(v));

async function supa(method, path, body) {
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
               "Content-Type": "application/json", Prefer: "return=representation" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try { data = await r.json(); } catch {}
  return [r.status, data];
}

function genCode() {
  let s = "ZEN-";
  for (let i = 0; i < 4; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return s;
}

function isValidDate(v) {
  return typeof v === "string" && !Number.isNaN(new Date(v).getTime());
}

// Whitelist/validate class fields. Returns [fields, error-or-null].
function cleanFields(o, partial = false) {
  const out = {};
  if ("name" in o || !partial) {
    const n = String(o.name ?? "").trim();
    if (!n || n.length > 80) return [null, "name is required (80 chars max)"];
    out.name = n;
  }
  if ("theme" in o || !partial) {
    const t = String(o.theme ?? "").trim();
    if (!t || t.length > 80) return [null, "theme is required (80 chars max)"];
    out.theme = t;
  }
  if ("starts_at" in o || !partial) {
    if (!isValidDate(o.starts_at)) return [null, "start time is not a valid date"];
    out.starts_at = o.starts_at;
  }
  if ("duration_min" in o || !partial) {
    const d = o.duration_min ?? 60;
    if (!Number.isInteger(d) || d < 15 || d > 180) return [null, "duration must be 15 to 180 minutes"];
    out.duration_min = d;
  }
  if ("level" in o || !partial) {
    const lv = o.level ?? "all levels";
    if (!LEVELS.includes(lv)) return [null, "level must be gentle, all levels, or strong"];
    out.level = lv;
  }
  if ("description" in o) {
    const ds = String(o.description ?? "").trim().slice(0, 300);
    out.description = ds || null;
  }
  if ("size_cap" in o) {
    const sc = o.size_cap;
    if (sc !== null && sc !== undefined && (!Number.isInteger(sc) || sc < 1 || sc > 500))
      return [null, "size cap must be 1 to 500"];
    out.size_cap = sc ?? null;
  }
  if ("teacher_name" in o) {
    out.teacher_name = String(o.teacher_name ?? "").trim().slice(0, 80) || null;
  }
  return [out, null];
}

async function handleGet() {
  const cutoff = new Date(Date.now() - 7 * 864e5).toISOString();
  const [st, rows] = await supa("GET", `classes?select=*&starts_at=gte.${supq(cutoff)}&order=starts_at.asc`);
  if (st !== 200 || rows === null) return json({ ok: false, error: "schedule is unavailable right now" });
  const now = Date.now();
  const keep = [];
  for (const r of rows) {
    const start = new Date(r.starts_at).getTime();
    if (r.status === "scheduled") {
      if (start + (r.duration_min || 60) * 60e3 > now) keep.push(r);
    } else if (r.status === "cancelled") {
      keep.push(r);
    }
  }
  for (const r of keep) {
    const [cst, crows] = await supa("GET", `signups?select=id&class_code=eq.${supq(r.code)}`);
    r.signup_count = (cst === 200 && Array.isArray(crows)) ? crows.length : 0;
  }
  return json({ ok: true, classes: keep });
}

async function handlePost(req) {
  const { ZB_TEACH_PASS } = process.env;
  let o;
  try { o = await req.json(); } catch { return json({ ok: false, error: "bad request" }); }
  const given = Buffer.from(String(o.pass ?? ""));
  const want = Buffer.from(ZB_TEACH_PASS || "");
  if (given.length !== want.length || !crypto.timingSafeEqual(given, want))
    return json({ ok: false, error: "wrong teacher passphrase" });

  const action = o.action;
  if (action === "verify") return json({ ok: true });

  if (action === "create") {
    const [fields, err] = cleanFields(o);
    if (err) return json({ ok: false, error: err });
    const weeks = o.repeat_weeks ?? 1;
    if (!Number.isInteger(weeks) || weeks < 1 || weeks > 12)
      return json({ ok: false, error: "repeat weeks must be 1 to 12" });
    const series = weeks > 1 ? crypto.randomUUID() : null;
    const base = new Date(fields.starts_at).getTime();
    const rows = [];
    for (let i = 0; i < weeks; i++) {
      const row = { ...fields, starts_at: new Date(base + i * 7 * 864e5).toISOString(), series_id: series };
      let made = null;
      for (let t = 0; t < 5; t++) {
        row.code = genCode();
        const [st, res] = await supa("POST", "classes", row);
        if (st === 201 && res) { made = res[0]; break; }
      }
      if (!made) return json({ ok: false, error: "could not save the class" });
      rows.push(made);
    }
    return json({ ok: true, classes: rows });
  }

  if (action === "update" || action === "cancel") {
    const cid = String(o.id ?? "");
    if (!cid) return json({ ok: false, error: "missing class id" });
    let patch;
    if (action === "cancel") {
      patch = { status: "cancelled" };
    } else {
      const [p, err] = cleanFields(o.fields || {}, true);
      if (err) return json({ ok: false, error: err });
      delete p.code; delete p.status;
      if (!Object.keys(p).length) return json({ ok: false, error: "nothing to update" });
      patch = p;
    }
    const [st, rows] = await supa("PATCH", `classes?id=eq.${supq(cid)}`, patch);
    if (st !== 200 || !rows || !rows.length) return json({ ok: false, error: "could not save the change" });
    return json({ ok: true, cls: rows[0] });
  }

  return json({ ok: false, error: "unknown action" });
}

export default async (req) => {
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY, ZB_TEACH_PASS } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !ZB_TEACH_PASS)
    return json({ ok: false, error: "server not configured" });
  if (req.method === "GET") return handleGet();
  if (req.method === "POST") return handlePost(req);
  return json({ ok: false, error: "bad request" });
};

// Answers at the site root and inside the studio folder, so the same file
// serves moxiestudio.netlify.app and the studio living under Practice
// Village without claiming a route at the root of their site.
export const config = { path: ["/schedule", "/studio/schedule"] };
