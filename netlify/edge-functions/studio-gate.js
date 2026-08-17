// Moxie Studios is a member room. This runs before anything under /studio is
// served, so the studio can never be reached by anyone who is not signed in
// and holding a membership role. Assets pass through only once the visitor has
// proven a session; a signed-out deep link lands on the login page instead.

const MEMBER_ROLES = ["member", "founding_villager", "admin", "test_member"];

// Verified tokens are remembered briefly so one page load does not become
// dozens of identity calls while the mirror pulls its model files.
const verified = new Map();
const TTL_MS = 60_000;

function readCookie(request, name) {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}

function claimsFrom(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default async (request, context) => {
  const token = readCookie(request, "nf_jwt");
  const url = new URL(request.url);
  const back = () => Response.redirect(`${url.origin}/login?from=${encodeURIComponent(url.pathname)}`, 302);

  if (!token) return back();

  const claims = claimsFrom(token);
  if (!claims) return back();
  if (typeof claims.exp === "number" && claims.exp * 1000 < Date.now()) return back();

  const roles = claims.app_metadata?.roles || [];
  if (!Array.isArray(roles) || !roles.some((role) => MEMBER_ROLES.includes(role))) return back();

  const cached = verified.get(token);
  if (cached && cached > Date.now()) return context.next();

  // The claims say member; the identity service confirms the token is real.
  try {
    const check = await fetch(`${url.origin}/.netlify/identity/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!check.ok) return back();
  } catch {
    return back();
  }

  verified.set(token, Date.now() + TTL_MS);
  if (verified.size > 500) {
    for (const [key, expiry] of verified) if (expiry < Date.now()) verified.delete(key);
  }
  return context.next();
};

export const config = { path: "/studio/*" };
