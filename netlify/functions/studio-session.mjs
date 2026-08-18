// Who the studio is talking to. Moxie Studios is a room inside the Village
// now, so the Village session is the account: no second sign-in, no second
// password, no magic link. The studio pages ask this endpoint instead of
// Supabase.
import { getUser } from "./_shared/session.mjs";

const MEMBER_ROLES = ["member", "founding_villager", "admin", "test_member"];

export default async () => {
  let user = null;
  try {
    user = await getUser();
  } catch {
    user = null;
  }
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  if (!user || !roles.some((role) => MEMBER_ROLES.includes(role))) {
    return Response.json({ ok: false, member: false }, { status: 401 });
  }
  const name = user.userMetadata?.full_name || user.user_metadata?.full_name || "";
  return Response.json({
    ok: true,
    member: true,
    id: user.id,
    email: user.email,
    name,
    roles,
  });
};

export const config = { path: ["/studio-session", "/studio/session"] };
