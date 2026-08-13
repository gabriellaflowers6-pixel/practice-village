import {
  AuthError,
  acceptInvite,
  getUser,
  handleAuthCallback,
  login,
  logout,
  requestPasswordRecovery,
  updateUser,
} from "@netlify/identity";

const page = document.body.dataset.authPage;
const memberRoles = ["member", "founding_villager", "admin"];

function rolesFor(user) {
  const roles = user?.roles;
  return Array.isArray(roles) ? roles : [];
}

function hasMemberAccess(user) {
  return rolesFor(user).some((role) => memberRoles.includes(role));
}

function messageFor(error) {
  if (error instanceof AuthError && error.status === 401) return "That email and password do not match.";
  if (error instanceof AuthError) return error.message;
  return "Something went wrong. Try again or email info@aidedeq.org.";
}

function goToMemberLobby(user) {
  window.location.href = hasMemberAccess(user) ? "/member" : "/?membership=inactive#doors";
}

async function initLogin() {
  const status = document.getElementById("authStatus");
  const loginForm = document.getElementById("loginForm");
  const inviteForm = document.getElementById("inviteForm");
  const resetForm = document.getElementById("resetForm");
  const recoveryForm = document.getElementById("recoveryForm");
  const forgotButton = document.getElementById("forgotButton");
  let inviteToken = null;

  try {
    const callback = await handleAuthCallback();
    if (callback?.type === "invite") {
      inviteToken = callback.token;
      loginForm.hidden = true;
      inviteForm.hidden = false;
      forgotButton.hidden = true;
      document.getElementById("authTitle").textContent = "Set up your member account.";
      document.getElementById("authIntro").textContent = "Create a password to finish accepting your invitation.";
    } else if (callback?.type === "recovery") {
      loginForm.hidden = true;
      resetForm.hidden = false;
      forgotButton.hidden = true;
      document.getElementById("authTitle").textContent = "Choose a new password.";
    } else if (callback?.user) {
      goToMemberLobby(callback.user);
      return;
    } else {
      const currentUser = await getUser();
      if (currentUser) goToMemberLobby(currentUser);
    }
  } catch (error) {
    status.textContent = messageFor(error);
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "Signing in…";
    try {
      const user = await login(document.getElementById("loginEmail").value.trim(), document.getElementById("loginPassword").value);
      goToMemberLobby(user);
    } catch (error) {
      status.textContent = messageFor(error);
    }
  });

  inviteForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!inviteToken) return;
    status.textContent = "Setting up your account…";
    try {
      const user = await acceptInvite(inviteToken, document.getElementById("invitePassword").value);
      goToMemberLobby(user);
    } catch (error) {
      status.textContent = messageFor(error);
    }
  });

  resetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "Saving your new password…";
    try {
      const user = await updateUser({ password: document.getElementById("resetPassword").value });
      goToMemberLobby(user);
    } catch (error) {
      status.textContent = messageFor(error);
    }
  });

  forgotButton.addEventListener("click", () => {
    loginForm.hidden = true;
    recoveryForm.hidden = false;
    forgotButton.hidden = true;
    document.getElementById("authTitle").textContent = "Reset your password.";
    document.getElementById("authIntro").textContent = "We will email a private reset link to your member address.";
  });

  recoveryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "Sending your reset link…";
    try {
      await requestPasswordRecovery(document.getElementById("recoveryEmail").value.trim());
      status.textContent = "Check your email for a password reset link.";
    } catch (error) {
      status.textContent = messageFor(error);
    }
  });
}

async function initMemberLobby() {
  const user = await getUser();
  if (!user || !hasMemberAccess(user)) {
    window.location.replace("/login");
    return;
  }

  const name = user.name?.trim();
  document.getElementById("memberName").textContent = name ? `, ${name.split(/\s+/)[0]}` : "";
  const roles = rolesFor(user);
  document.getElementById("memberPlan").textContent = roles.includes("founding_villager") ? "Founding Villager" : roles.includes("admin") ? "Village team" : "Member";

  try {
    const response = await fetch("/member-status", { headers: { Accept: "application/json" } });
    if (response.ok) {
      const payload = await response.json();
      const membership = payload.membership;
      document.getElementById("memberPlan").textContent = membership.planLabel;
      const count = membership.workshopVoucherAllowance;
      document.getElementById("voucherSummary").textContent = count === 2
        ? "You have two workshop vouchers in this membership year, including the Founding Villager exception."
        : "You have one workshop voucher in this membership year.";
      const start = new Date(membership.membershipYearStart).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
      const end = new Date(membership.membershipYearEnd).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
      document.getElementById("voucherYear").textContent = `${start} to ${end}`;
    }
  } catch (error) {
    document.getElementById("voucherSummary").textContent = "Voucher details are temporarily unavailable. Your membership has not changed.";
  }

  const signOut = async () => {
    await logout();
    window.location.replace("/");
  };
  document.getElementById("logoutButton").addEventListener("click", signOut);
  document.getElementById("logoutButtonBottom").addEventListener("click", signOut);
}

if (page === "login") initLogin();
if (page === "member") initMemberLobby();
