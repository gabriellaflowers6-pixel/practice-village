// Student sign-ups + notification opt-in for the deployed Moxie Studios site.
// Mirrors serve.py's /signups contract exactly (same actions, same error
// sentences). Public (no passphrase). Supabase-only: serverless has no
// in-memory fallback. Env: SUPABASE_URL, SUPABASE_SERVICE_KEY.
const SUPA_URL = () => process.env.SUPABASE_URL;
const KEY = () => process.env.SUPABASE_SERVICE_KEY;
const json = (o) => new Response(JSON.stringify(o), { headers: { "content-type": "application/json" } });

// Encode every value embedded in a PostgREST querystring: a raw '+' means
// SPACE in a URL, so plus-addressed emails (name+tag@gmail.com) matched
// nothing. Found on first real Supabase contact 2026-08-07. serve.py: supq().
const supq = (v) => encodeURIComponent(String(v));

async function supa(method, path, body, extraPrefer) {
  const prefer = ["return=representation"];
  if (extraPrefer) prefer.push(extraPrefer);
  const r = await fetch(`${SUPA_URL()}/rest/v1/${path}`, {
    // values in `path` querystrings must already be supq()-encoded
    method,
    headers: { apikey: KEY(), Authorization: `Bearer ${KEY()}`,
               "Content-Type": "application/json", Prefer: prefer.join(",") },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try { data = await r.json(); } catch {}
  return [r.status, data];
}

function normEmail(v) {
  const e = String(v ?? "").trim().toLowerCase();
  const at = e.indexOf("@");
  if (at < 1 || !e.slice(at).includes(".")) return null;
  return e.slice(0, 120);
}

async function classByCode(code) {
  const [st, rows] = await supa("GET", `classes?select=*&code=eq.${supq(code)}`);
  return (st === 200 && rows && rows[0]) || null;
}

async function count(code) {
  const [st, rows] = await supa("GET", `signups?select=id&class_code=eq.${supq(code)}`);
  return (st === 200 && Array.isArray(rows)) ? rows.length : 0;
}

export default async (req) => {
  if (!SUPA_URL() || !KEY()) return json({ ok: false, error: "server not configured" });

  if (req.method === "GET") {
    const email = normEmail(new URL(req.url).searchParams.get("email"));
    if (!email) return json({ ok: true, codes: [] });
    const [st, rows] = await supa("GET", `signups?select=class_code&student_email=eq.${supq(email)}`);
    return json({ ok: true, codes: (st === 200 && rows) ? rows.map(r => r.class_code) : [] });
  }
  if (req.method !== "POST") return json({ ok: false, error: "bad request" });

  let o;
  try { o = await req.json(); } catch { return json({ ok: false, error: "bad request" }); }
  const email = normEmail(o.email);
  if (!email) return json({ ok: false, error: "a valid email is required" });
  const action = o.action;

  if (action === "signup" || action === "cancel_signup") {
    const code = String(o.class_code ?? "").trim().toUpperCase();
    const cls = await classByCode(code);
    if (!/^ZEN-[A-Z0-9]{3,6}$/.test(code) || !cls)
      return json({ ok: false, error: "that class was not found" });
    if (action === "signup") {
      const name = String(o.name ?? "").trim().slice(0, 80);
      if (!name) return json({ ok: false, error: "your name is required" });
      if (cls.status === "cancelled") return json({ ok: false, error: "that class was cancelled" });
      await supa("POST", "signups?on_conflict=class_code,student_email",
        { class_code: code, student_name: name, student_email: email }, "resolution=merge-duplicates");
    } else {
      await supa("DELETE", `signups?class_code=eq.${supq(code)}&student_email=eq.${supq(email)}`);
    }
    return json({ ok: true, signup_count: await count(code) });
  }

  if (action === "notify_on" || action === "notify_off") {
    const teacher = o.teacher_name ? String(o.teacher_name).trim().slice(0, 80) : null;
    if (action === "notify_on") {
      const name = String(o.name ?? "").trim().slice(0, 80);
      if (!name) return json({ ok: false, error: "your name is required" });
      await supa("POST", "notify_subs?on_conflict=student_email,teacher_name",
        { student_email: email, student_name: name, teacher_name: teacher }, "resolution=merge-duplicates");
    } else {
      const q = teacher === null ? "teacher_name=is.null" : `teacher_name=eq.${supq(teacher)}`;
      await supa("DELETE", `notify_subs?student_email=eq.${supq(email)}&${q}`);
    }
    return json({ ok: true });
  }

  return json({ ok: false, error: "unknown action" });
};

// Answers at the site root and inside the studio folder, so the same file
// serves moxiestudio.netlify.app and the studio living under Practice
// Village without claiming a route at the root of their site.
export const config = { path: ["/signups", "/studio/signups"] };
