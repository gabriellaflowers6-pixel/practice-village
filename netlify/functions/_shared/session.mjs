// Session guard: @netlify/identity's getUser() plus a server-side sign-out check.
// Why: Netlify Identity access tokens are stateless JWTs, so after "Sign out"
// a captured nf_jwt keeps working until it expires (about an hour). GoTrue does
// revoke the refresh token on logout, but not the access token. This module
// closes that window: /member-logout records the moment a member signed out,
// and every member endpoint rejects tokens issued before that moment.
//
// Usage in a function: replace
//   import { getUser } from "@netlify/identity";
// with
//   import { getUser } from "./_shared/session.mjs";
// Nothing else changes: same return shape, null when not signed in.
import { getUser as identityGetUser } from "@netlify/identity";
import { getStore } from "@netlify/blobs";

const NF_JWT_COOKIE = "nf_jwt";

function sessionStore() {
  return getStore({ name: "practice-village-sessions", consistency: "strong" });
}

export function decodeJwtPayload(token) {
  try {
    const part = String(token).split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "=");
    return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function currentTokenClaims() {
  try {
    const raw = globalThis.Netlify?.context?.cookies?.get?.(NF_JWT_COOKIE);
    if (!raw) return null;
    let token = raw;
    try { token = decodeURIComponent(raw); } catch { /* keep raw */ }
    return decodeJwtPayload(token);
  } catch {
    return null;
  }
}

const signedOutKey = (sub) => `signed-out/${sub}`;

// Record "this member signed out now". Tokens issued at or before this
// second are refused from here on. Called by /member-logout.
export async function recordSignOut(sub) {
  if (!sub) return false;
  await sessionStore().set(signedOutKey(sub), String(Math.floor(Date.now() / 1000)));
  return true;
}

// Same contract as @netlify/identity getUser(), but returns null when the
// presented access token predates the member's last sign-out.
export async function getUser() {
  const user = await identityGetUser();
  if (!user) return null;
  const claims = currentTokenClaims();
  const sub = claims?.sub || user.id;
  const iat = Number(claims?.iat) || 0;
  if (!sub || !iat) return user; // no token in reach to compare; keep library behaviour
  try {
    const signedOutAt = Number(await sessionStore().get(signedOutKey(sub))) || 0;
    // Strict "before": a fresh sign-in in the same second as the sign-out must work.
    if (signedOutAt && iat < signedOutAt) return null;
  } catch {
    // Store unreachable: do not lock members out for a storage blip.
  }
  return user;
}
