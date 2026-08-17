import {
  accountButtonLabel,
  buildMemberCheckoutUrl,
  membershipAllowsAccess,
  safeReturnPath,
} from "./member-access-lib.mjs";

let clientPromise;

async function authClient() {
  if (!clientPromise) clientPromise = (async () => {
    const response = await fetch("/auth-config", { cache: "no-store" });
    const value = await response.json().catch(() => ({}));
    if (!response.ok || !value.ok) throw new Error(value.error || "Account sign-in is not configured yet.");
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.49.1");
    return createClient(value.url, value.anon_key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  })();
  return clientPromise;
}

async function currentState() {
  const supabase = await authClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) return { supabase, account: null, membership: null };
  const { data: profile } = await supabase.from("profiles")
    .select("id,full_name,role,teacher_status").eq("id", user.id).maybeSingle();
  const { data: membership, error: membershipError } = await supabase.from("memberships")
    .select("plan_key,status,current_period_end,cancel_at_period_end")
    .eq("user_id", user.id).maybeSingle();
  // The auth UI remains usable while the migration is pending; it simply
  // cannot claim that access exists.
  if (membershipError && membershipError.code !== "42P01") console.warn("Membership status unavailable", membershipError.message);
  return { supabase, account: { user, profile: profile || {} }, membership: membership || null };
}

async function checkoutPlans() {
  try {
    const response = await fetch("/membership-config", { cache: "no-store" });
    const value = await response.json().catch(() => ({}));
    if (!response.ok || !value.ok) return {};
    return value.plans || {};
  } catch {
    return {};
  }
}

export async function initMemberAccess(options = {}) {
  const modal = document.querySelector("[data-member-modal]");
  const form = document.querySelector("[data-member-form]");
  const email = document.querySelector("[data-member-email]");
  const message = document.querySelector("[data-member-message]");
  const submit = document.querySelector("[data-member-submit]");
  const enterLinks = [...document.querySelectorAll("[data-member-enter]")];
  const accountButtons = [...document.querySelectorAll("[data-member-account]")];
  const checkoutButtons = [...document.querySelectorAll("[data-member-checkout]")];
  if (!modal || !form || !email || !message || !submit) return;

  let state = { account: null, membership: null };
  let plans = {};
  let requestedCheckout = null;
  const studioUrl = options.studioUrl || "/mockups/zenbottom-schedule.html";

  const setMessage = (text, tone = "") => {
    message.textContent = text;
    message.dataset.tone = tone;
  };
  const open = () => {
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    if (!state.account) setTimeout(() => email.focus(), 60);
  };
  const close = () => {
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
  };
  const render = () => {
    const label = accountButtonLabel(state);
    accountButtons.forEach(button => { button.textContent = label; });
    const hasAccess = membershipAllowsAccess(state.membership);
    enterLinks.forEach(link => { link.hidden = !hasAccess; link.href = studioUrl; });
    email.hidden = Boolean(state.account);
    form.querySelector("label[for='memberEmail']").hidden = Boolean(state.account);
    submit.hidden = Boolean(state.account);
    if (hasAccess) {
      setMessage("Your membership is active. Your studio is ready.", "success");
    } else if (state.account) {
      setMessage(`Signed in as ${state.account.user.email}. Choose a membership to continue.`, "success");
    }
  };

  accountButtons.forEach(button => button.addEventListener("click", event => {
    event.preventDefault();
    if (membershipAllowsAccess(state.membership)) {
      location.href = studioUrl;
      return;
    }
    open();
  }));
  document.querySelectorAll("[data-member-close]").forEach(button => button.addEventListener("click", close));
  modal.addEventListener("click", event => { if (event.target === modal) close(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && !modal.hidden) close(); });

  checkoutButtons.forEach(button => button.addEventListener("click", event => {
    event.preventDefault();
    const baseUrl = plans[button.dataset.membershipPlan] || "";
    if (!state.account) {
      requestedCheckout = button;
      setMessage("Create or sign in to your account first. Your payment will then unlock that same account.");
      open();
      return;
    }
    if (membershipAllowsAccess(state.membership)) {
      location.href = studioUrl;
      return;
    }
    try {
      location.href = buildMemberCheckoutUrl(baseUrl, state.account.user);
    } catch (error) {
      setMessage(error.message, "error");
      open();
    }
  }));

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const value = email.value.trim().toLowerCase();
    if (!value) return;
    submit.disabled = true;
    submit.textContent = "Sending your link…";
    setMessage("");
    try {
      const supabase = await authClient();
      const redirect = new URL(safeReturnPath(location), location.origin);
      redirect.searchParams.set("account", "complete");
      // Supabase's implicit email-link flow returns the session in the URL
      // fragment. Keep our requested redirect fragment-free so its auth data
      // is not hidden behind a pre-existing #offer fragment.
      const { error } = await supabase.auth.signInWithOtp({
        email: value,
        options: { emailRedirectTo: redirect.toString(), shouldCreateUser: true, data: { full_name: "", role: "student" } },
      });
      if (error) throw error;
      localStorage.setItem("zbStudentEmail", value);
      setMessage(`Check ${value} for your sign-in link. The same link creates a new account.`, "success");
      submit.textContent = "Send it again";
    } catch (error) {
      setMessage(/rate|too many|60 seconds/i.test(error.message || "")
        ? "That link was just sent. Give it a minute, then try again."
        : (error.message || "We could not send your sign-in link."), "error");
      submit.textContent = "Email me a sign-in link";
    } finally {
      submit.disabled = false;
    }
  });

  try {
    plans = await checkoutPlans();
    state = await currentState();
    render();
    if (new URLSearchParams(location.search).has("account")) {
      history.replaceState(null, "", location.pathname + "#offer");
      open();
      if (state.account && !membershipAllowsAccess(state.membership)) {
        setMessage("Your account is ready. Choose a membership below to continue.", "success");
      }
    }
  } catch (error) {
    setMessage(error.message || "Account sign-in is unavailable right now.", "error");
  }

  // Retain the visitor's original intent without sending them to Stripe
  // automatically after an email-link return.
  if (requestedCheckout && state.account) requestedCheckout.focus();
}
