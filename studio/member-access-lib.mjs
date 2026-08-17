const ACTIVE_STATUSES = new Set(["active", "trialing"]);

export function membershipAllowsAccess(membership) {
  return Boolean(membership && ACTIVE_STATUSES.has(membership.status));
}

export function buildMemberCheckoutUrl(baseUrl, user) {
  if (!baseUrl) throw new Error("This checkout is not configured yet.");
  if (!user?.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.id)) {
    throw new Error("Sign in before continuing to checkout.");
  }
  if (!user.email) throw new Error("Your signed-in account needs an email address.");

  const url = new URL(baseUrl);
  url.searchParams.set("client_reference_id", user.id);
  url.searchParams.set("locked_prefilled_email", user.email);
  return url.toString();
}

export function accountButtonLabel({ account, membership }) {
  if (!account) return "Create account / Sign in";
  if (membershipAllowsAccess(membership)) return "Enter studio";
  return "Finish membership";
}

export function safeReturnPath(locationLike) {
  const path = String(locationLike?.pathname || "/landing/moxie-studio.html");
  return path.startsWith("/") && !path.startsWith("//") ? path : "/landing/moxie-studio.html";
}
