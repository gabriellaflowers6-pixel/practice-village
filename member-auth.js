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
const memberRoles = ["member", "founding_villager", "admin", "test_member"];

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
  document.getElementById("memberPlan").textContent = roles.includes("founding_villager") ? "Founding Villager" : roles.some((role) => ["admin", "test_member"].includes(role)) ? "Village team" : "Member";

  try {
    const response = await fetch("/member-status", { headers: { Accept: "application/json" } });
    if (response.ok) {
      const payload = await response.json();
      const membership = payload.membership;
      document.getElementById("memberPlan").textContent = membership.planLabel;
      if (membership.testAccount) {
        document.getElementById("voucherSummary").textContent = "Test access does not create or use workshop vouchers.";
        document.getElementById("voucherYear").textContent = "Test account";
      } else {
        const count = membership.workshopVoucherAllowance;
        document.getElementById("voucherSummary").textContent = count === 2
          ? "You have two workshop vouchers in this membership year, including the Founding Villager exception."
          : "You have one workshop voucher in this membership year.";
        const start = new Date(membership.membershipYearStart).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
        const end = new Date(membership.membershipYearEnd).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
        document.getElementById("voucherYear").textContent = `${start} to ${end}`;
      }
      if (["complete", "complete_private"].includes(membership.onboardingStatus)) {
        document.getElementById("conciergeCardTitle").textContent = "Your Concierge";
        document.getElementById("conciergeCardCopy").textContent = "Return whenever you want to update what would make the Village useful to you.";
        document.getElementById("conciergeCardLink").textContent = "Return to your welcome conversation";
      }
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

async function initWelcome() {
  const user = await getUser();
  if (!user || !hasMemberAccess(user)) {
    window.location.replace("/login");
    return;
  }

  const thread = document.getElementById("welcomeThread");
  const input = document.getElementById("welcomeInput");
  const sendButton = document.getElementById("sendWelcome");
  const talkButton = document.getElementById("talkButton");
  const voiceStatus = document.getElementById("voiceStatus");
  const summaryBox = document.getElementById("welcomeSummary");
  const history = [{ role: "model", text: "You are in. What would make your membership useful to you right now?" }];
  let busy = false;

  function addMessage(role, text) {
    const message = document.createElement("div");
    message.className = `chat-message chat-message--${role === "user" ? "member" : "concierge"}`;
    message.textContent = text;
    thread.appendChild(message);
    thread.scrollTop = thread.scrollHeight;
  }

  function setBusy(next) {
    busy = next;
    sendButton.disabled = next;
    talkButton.disabled = next;
    sendButton.textContent = next ? "Sending…" : "Send";
  }

  function showSummary(summary) {
    summaryBox.hidden = false;
    summaryBox.innerHTML = "";
    const heading = document.createElement("h2");
    heading.textContent = summary ? "Your optional welcome note" : "Nothing needs to be saved";
    const copy = document.createElement("p");
    copy.textContent = summary || "You can leave this conversation here. Your membership is ready whenever you return.";
    const actions = document.createElement("div");
    actions.className = "welcome-summary__actions";
    if (summary) {
      const save = document.createElement("button");
      save.className = "primary-button";
      save.type = "button";
      save.textContent = "Save this welcome note";
      save.addEventListener("click", () => finishOnboarding("save", summary, save));
      actions.appendChild(save);
    }
    const privateButton = document.createElement("button");
    privateButton.className = "secondary-button";
    privateButton.type = "button";
    privateButton.textContent = "Keep the conversation private";
    privateButton.addEventListener("click", () => finishOnboarding("private", null, privateButton));
    actions.appendChild(privateButton);
    summaryBox.append(heading, copy, actions);
  }

  async function finishOnboarding(decision, summary, button) {
    button.disabled = true;
    button.textContent = "Saving…";
    try {
      const response = await fetch("/member-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, summary }),
      });
      if (!response.ok) throw new Error("save failed");
      window.location.href = "/member";
    } catch {
      button.disabled = false;
      button.textContent = decision === "save" ? "Save this welcome note" : "Keep the conversation private";
      voiceStatus.textContent = "That choice did not save. Try again or return to the lobby. Your membership is not affected.";
    }
  }

  async function send(text) {
    const clean = String(text || "").trim();
    if (!clean || busy) return;
    addMessage("user", clean);
    history.push({ role: "user", text: clean });
    input.value = "";
    setBusy(true);
    try {
      const response = await fetch("/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "member_onboarding", messages: history }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Concierge unavailable");
      addMessage("model", payload.reply);
      history.push({ role: "model", text: payload.reply });
      if (payload.onboardingSummary !== null) showSummary(payload.onboardingSummary);
    } catch {
      addMessage("model", "The Concierge is away from the desk right now. Your membership is already open, so you can return to the lobby and try this later.");
    } finally {
      setBusy(false);
      input.focus();
    }
  }

  sendButton.addEventListener("click", () => send(input.value));
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send(input.value);
    }
  });
  document.getElementById("skipWelcome").addEventListener("click", () => send("I would rather skip that question."));
  document.getElementById("finishWelcome").addEventListener("click", () => send("I want to finish for now. Please wrap up without asking another question."));

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    talkButton.hidden = true;
    voiceStatus.textContent = "Voice entry is not available in this browser. Typing works here.";
  } else {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = document.documentElement.lang || "en-US";
    talkButton.addEventListener("click", () => {
      voiceStatus.textContent = "Listening… Tap your browser permission if asked.";
      talkButton.textContent = "Listening…";
      recognition.start();
    });
    recognition.addEventListener("result", (event) => {
      input.value = event.results[0][0].transcript;
      voiceStatus.textContent = "Transcript ready. Check it, change anything you want, then press Send.";
    });
    recognition.addEventListener("end", () => { talkButton.textContent = "Talk"; });
    recognition.addEventListener("error", () => {
      talkButton.textContent = "Talk";
      voiceStatus.textContent = "Voice did not start. You can try again or type instead.";
    });
  }

  document.getElementById("logoutButton").addEventListener("click", async () => {
    await logout();
    window.location.replace("/");
  });
}

if (page === "login") initLogin();
if (page === "member") initMemberLobby();
if (page === "welcome") initWelcome();
