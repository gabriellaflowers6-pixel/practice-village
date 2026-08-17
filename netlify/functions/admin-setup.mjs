// TEMPORARY. One-time account provisioning, guarded by SETUP_KEY.
// Delete this file and unset SETUP_KEY once the accounts exist.
import { admin, getIdentityConfig } from "@netlify/identity";
import { findIdentityUserByEmail } from "./_shared/membership.mjs";

async function invite(email) {
  const identity = getIdentityConfig();
  if (!identity?.url || !identity.token) throw new Error("Identity operator access unavailable");
  const r = await fetch(`${identity.url}/invite`, {
    method: "POST",
    headers: { Authorization: `Bearer ${identity.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const payload = await r.json().catch(() => ({}));
  if (!r.ok || !payload.id) throw new Error(payload.msg || "invite failed");
  return payload;
}

async function ensure(email, role) {
  let user = await findIdentityUserByEmail(email);
  let invited = false;
  if (!user) {
    user = await invite(email);
    invited = true;
  }
  const existing = Array.isArray(user.roles) ? user.roles : [];
  const roles = Array.from(new Set([...existing, role]));
  await admin.updateUser(user.id, { app_metadata: { ...(user.appMetadata || {}), roles } });
  return { email, role, invited, roles };
}

export default async (req) => {
  const key = process.env.SETUP_KEY;
  if (!key || req.headers.get("x-setup-key") !== key) {
    return Response.json({ ok: false }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const accounts = Array.isArray(body.accounts) ? body.accounts : [];
  const results = [];
  for (const item of accounts) {
    try {
      results.push(await ensure(String(item.email).trim().toLowerCase(), String(item.role)));
    } catch (error) {
      results.push({ email: item.email, error: error.message });
    }
  }
  return Response.json({ ok: true, results });
};

export const config = { path: "/admin-setup" };
