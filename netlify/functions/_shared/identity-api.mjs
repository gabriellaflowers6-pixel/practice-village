// Identity admin over the Netlify API.
//
// Why this exists: v2 functions (Request/Response handlers) do not receive the
// Identity operator token, so `admin.*` from @netlify/identity throws
// "Admin operations require an operator token". Every account a buyer needs is
// created through the REST API instead, with a site-scoped token in the env.
//
// Env: NETLIFY_API_TOKEN, NETLIFY_SITE_ID, NETLIFY_IDENTITY_INSTANCE_ID, URL.

const API = "https://api.netlify.com/api/v1";

function base() {
  const site = process.env.NETLIFY_SITE_ID;
  const instance = process.env.NETLIFY_IDENTITY_INSTANCE_ID;
  const token = process.env.NETLIFY_API_TOKEN;
  if (!site || !instance || !token) return null;
  return { url: `${API}/sites/${site}/identity/${instance}`, token };
}

export function identityApiReady() {
  return Boolean(base());
}

async function call(method, path, body) {
  const ctx = base();
  if (!ctx) throw new Error("Identity API is not configured");
  const response = await fetch(`${ctx.url}${path}`, {
    method,
    headers: { Authorization: `Bearer ${ctx.token}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(payload.msg || payload.error || `Identity API ${response.status}`);
  return payload;
}

export async function findUser(email) {
  const wanted = String(email).trim().toLowerCase();
  for (let page = 1; page <= 50; page += 1) {
    const payload = await call("GET", `/users?per_page=100&page=${page}`);
    const users = Array.isArray(payload) ? payload : payload.users || [];
    const match = users.find((user) => user.email?.trim().toLowerCase() === wanted);
    if (match) return match;
    if (users.length < 100) return null;
  }
  return null;
}

function randomPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes)).replace(/[^A-Za-z0-9]/g, "").slice(0, 24);
}

// Creates the account if it is new, then writes roles and membership metadata.
// The placeholder password is never sent anywhere: the member sets their own
// through the email that follows.
export async function upsertMember(email, { roles, appMetadata = {} }) {
  const wanted = String(email).trim().toLowerCase();
  let user = await findUser(wanted);
  let created = false;
  if (!user) {
    user = await call("POST", "/users", { email: wanted, password: randomPassword() });
    created = true;
  }
  const existing = Array.isArray(user.app_metadata?.roles) ? user.app_metadata.roles : [];
  const merged = Array.from(new Set([...existing, ...roles]));
  const updated = await call("PUT", `/users/${user.id}`, {
    app_metadata: { ...(user.app_metadata || {}), ...appMetadata, roles: merged },
  });
  return { user: updated, created };
}

export async function setRoles(email, roles) {
  const user = await findUser(email);
  if (!user) return null;
  return call("PUT", `/users/${user.id}`, {
    app_metadata: { ...(user.app_metadata || {}), roles },
  });
}

// Public GoTrue endpoint, no token needed. Sends the set-password email and
// confirms the account when the member completes it.
export async function sendSetPasswordEmail(email) {
  const site = process.env.URL || "https://thepracticevillage.org";
  const response = await fetch(`${site}/.netlify/identity/recover`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: String(email).trim().toLowerCase() }),
  });
  return response.ok;
}
