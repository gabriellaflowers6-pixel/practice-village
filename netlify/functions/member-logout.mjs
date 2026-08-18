// POST /member-logout: server-side sign-out. Records the moment so any access
// token issued before now is refused by every member endpoint (see
// _shared/session.mjs). The browser calls this first, then the Identity
// logout (which revokes the refresh token and clears cookies).
import { getUser } from "@netlify/identity";
import { recordSignOut } from "./_shared/session.mjs";

export default async function handler(req) {
  if (req.method !== "POST") return Response.json({ ok: false, error: "bad request" }, { status: 405 });
  const user = await getUser();
  if (!user?.id) return Response.json({ ok: true, signedOut: false }); // nothing to revoke
  try {
    await recordSignOut(user.id);
    return Response.json({ ok: true, signedOut: true });
  } catch {
    return Response.json({ ok: false, error: "could not record sign-out" }, { status: 500 });
  }
}

export const config = { path: "/member-logout" };
