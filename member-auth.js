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
  const card = document.getElementById("authCard");
  const status = document.getElementById("authStatus");
  const loginForm = document.getElementById("loginForm");
  const inviteForm = document.getElementById("inviteForm");
  const resetForm = document.getElementById("resetForm");
  const recoveryForm = document.getElementById("recoveryForm");
  const forgotButton = document.getElementById("forgotButton");
  const inviteSuccess = document.getElementById("inviteSuccess");
  let inviteToken = null;

  try {
    const callback = await handleAuthCallback();
    if (callback?.type === "invite") {
      inviteToken = callback.token;
      card.classList.add("auth-card--invite");
      loginForm.hidden = true;
      inviteForm.hidden = false;
      resetForm.hidden = true;
      recoveryForm.hidden = true;
      forgotButton.hidden = true;
      document.querySelector(".auth-card > .auth-help").hidden = true;
      document.querySelector(".auth-card > .eyebrow").textContent = "Your invitation";
      document.getElementById("authTitle").textContent = "Come on in.";
      document.getElementById("authIntro").textContent = "Create one password and your Practice Village account is ready.";
      document.title = "Accept your invitation · Practice Village";
      document.getElementById("invitePassword").focus();
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
    const button = inviteForm.querySelector("button");
    button.disabled = true;
    button.textContent = "Creating your account…";
    status.textContent = "";
    try {
      const password = document.getElementById("invitePassword").value;
      const invitedUser = await acceptInvite(inviteToken, password);

      // Accepting an invitation creates the Identity account, but the protected
      // member pages also need the auth cookie established by login(). Without
      // it, the first trip to /welcome is redirected straight back here.
      const user = await login(invitedUser.email, password);
      inviteForm.hidden = true;
      status.hidden = true;
      document.getElementById("authTitle").hidden = true;
      document.getElementById("authIntro").hidden = true;
      document.querySelector(".auth-card > .eyebrow").hidden = true;
      inviteSuccess.hidden = false;
      inviteSuccess.focus();
      window.setTimeout(() => {
        window.location.replace(hasMemberAccess(user) ? "/welcome" : "/?membership=inactive#doors");
      }, 900);
    } catch (error) {
      button.disabled = false;
      button.textContent = "Create my account";
      status.textContent = error instanceof AuthError && [401, 404, 422].includes(error.status)
        ? "That invitation link has already been used or has expired. Email us and we will send a fresh one."
        : messageFor(error);
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
        document.getElementById("conciergeCardCopy").textContent = "Review or update the onboarding choices the Village remembers for you.";
        document.getElementById("conciergeCardLink").textContent = "Review onboarding choices";
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

  const title = document.getElementById("welcomeTitle");
  const progress = document.getElementById("onboardingProgress");
  const question = document.getElementById("onboardingQuestion");
  const help = document.getElementById("onboardingHelp");
  const choices = document.getElementById("onboardingChoices");
  const input = document.getElementById("welcomeInput");
  const sendButton = document.getElementById("sendWelcome");
  const talkButton = document.getElementById("talkButton");
  const voiceStatus = document.getElementById("voiceStatus");
  const responseBox = document.getElementById("welcomeResponse");
  const panel = document.getElementById("onboardingPanel");
  const skipButton = document.getElementById("skipWelcome");
  const status = document.getElementById("onboardingStatus");
  const preferredName = user.name?.trim() || "";
  const state = {
    step: preferredName ? 0 : -1,
    currentNeed: null,
    destination: null,
    memories: [],
    pendingMemoryPrefix: null,
    foundingEligible: rolesFor(user).includes("founding_villager"),
    founderListing: null,
  };
  let busy = false;
  let activeUser = user;

  const questions = [
    {
      text: "What would be useful today?",
      options: ["Give me an orientation", "Yoga or meditation", "A little quiet", "Food support", "Sort something out", "Safety or patterns", "Work with my photos", "Something else"],
    },
    {
      text: "Is there anything that would make the Village easier for you to use?",
      options: ["Keep answers brief", "I prefer voice", "I prefer typing", "Let me explain", "Nothing right now"],
    },
    {
      text: "Is there anything you'd like the Village to remember for next time?",
      options: ["Something I'm working through", "A practice that helps me", "Something I don't want to explain again", "Let me tell you", "Nothing right now"],
    },
  ];

  const destinations = {
    "Give me an orientation": {
      heading: "Here is how to use the Village.",
      copy: "Start with the Concierge when you want help choosing. Open a room when you already know what you need. Save something only when you want the Village to remember it.",
      items: ["The Front Desk helps you sort out where to begin.", "Each room holds its own apps, resources, and live offerings.", "Explore the Village whenever you want to choose for yourself."],
    },
    "Yoga or meditation": {
      heading: "Start in Moxie Studios.",
      copy: "Bott Om can help you begin privately with beginner yoga or meditation and practice at your own pace.",
      pending: "The member Studio link is being connected.",
    },
    "A little quiet": {
      heading: "Start in HUSH.",
      copy: "HUSH offers a sixty-second practice now, with additional mindfulness apps and resources opening for members.",
      pending: "The complete member HUSH room is being connected.",
    },
    "Food support": {
      heading: "Start in the Kitchen.",
      copy: "PlantLuck can help you add practical plant nourishment to a week that is already full.",
      pending: "The Kitchen's member entrance is being reviewed for desktop use.",
    },
    "Safety or patterns": {
      heading: "Start in Safety Hall.",
      copy: "Safety Hall helps you record what happened, look for patterns, sort responsibility, and prepare to seek support.",
      pending: "Safety Hall is being connected to the live Village.",
    },
    "Work with my photos": {
      heading: "Start with Cur.AI.ted.",
      copy: "Cur.AI.ted helps you find the story in photos you already have.",
      pending: "The included starter access is being connected.",
    },
  };

  title.textContent = preferredName ? `Welcome, ${preferredName.split(/\s+/)[0]}.` : "Welcome.";

  function setBusy(next) {
    busy = next;
    sendButton.disabled = next;
    talkButton.disabled = next;
    sendButton.textContent = next ? "Sending…" : "Send";
  }

  function resetScreen() {
    status.textContent = "";
    panel.hidden = true;
    panel.innerHTML = "";
    choices.innerHTML = "";
    responseBox.hidden = false;
    skipButton.hidden = false;
    input.value = "";
    input.placeholder = "Type your answer";
    state.pendingMemoryPrefix = null;
  }

  function button(label, handler, className = "choice-button") {
    const element = document.createElement("button");
    element.type = "button";
    element.className = className;
    element.textContent = label;
    element.addEventListener("click", handler);
    return element;
  }

  function renderQuestion() {
    resetScreen();
    if (state.step === -1) {
      progress.textContent = "Optional account setup";
      question.textContent = "What should we call you?";
      help.textContent = "You can skip this and add a name later.";
      input.placeholder = "Preferred name";
      return;
    }
    const current = questions[state.step];
    progress.textContent = `Question ${state.step + 1} of up to 3`;
    question.textContent = current.text;
    help.textContent = state.step === 0
      ? "Choose an answer or tell the Concierge in your own words."
      : state.step === 1
        ? "Choose an answer or explain what would help."
        : "Choose an answer or tell the Village what would be useful to remember.";
    current.options.forEach((label) => choices.appendChild(button(label, () => handleChoice(label))));
  }

  function showPanel(headingText, copyText, items = []) {
    panel.innerHTML = "";
    panel.hidden = false;
    const heading = document.createElement("h3");
    heading.textContent = headingText;
    const copy = document.createElement("p");
    copy.textContent = copyText;
    panel.append(heading, copy);
    if (items.length) {
      const list = document.createElement("ul");
      items.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        list.appendChild(li);
      });
      panel.appendChild(list);
    }
    return panel;
  }

  function addPanelActions(...elements) {
    const actions = document.createElement("div");
    actions.className = "onboarding-panel__actions";
    elements.forEach((element) => actions.appendChild(element));
    panel.appendChild(actions);
  }

  function link(label, href, primary = false) {
    const element = document.createElement("a");
    element.href = href;
    element.className = primary ? "primary-button" : "secondary-button";
    element.textContent = label;
    return element;
  }

  function showCurrentDestination(allowContinue = true) {
    resetScreen();
    responseBox.hidden = true;
    skipButton.hidden = true;
    progress.textContent = "A place to begin";
    question.textContent = "You can start now.";
    help.textContent = "You do not have to finish onboarding first.";
    const destination = state.destination;
    const destinationPanel = showPanel(
      destination?.heading || "Start with the Concierge.",
      destination?.copy || "Tell the Concierge what you want to sort out, and it will help you choose a next step.",
      destination?.items || [],
    );
    if (destination?.pending) {
      const pending = document.createElement("p");
      pending.textContent = destination.pending;
      destinationPanel.appendChild(pending);
    }
    const actions = [];
    if (destination?.href) actions.push(link(destination.action || "Open this room", destination.href, true));
    actions.push(link("Explore the Village", "/member", !destination?.href));
    if (allowContinue) actions.push(button("Continue optional onboarding", () => { state.step = 1; renderQuestion(); }, "secondary-button"));
    addPanelActions(...actions);
  }

  function addMemory(value) {
    const clean = String(value || "").trim().slice(0, 180);
    if (clean && !state.memories.includes(clean)) state.memories.push(clean);
  }

  function handleChoice(label) {
    if (busy) return;
    if (state.step === 0) {
      state.currentNeed = label;
      if (label === "Sort something out" || label === "Something else") {
        choices.innerHTML = "";
        help.textContent = label === "Sort something out" ? "Tell the Concierge what you want to sort out." : "Tell the Concierge what would be useful today.";
        input.focus();
        return;
      }
      state.destination = destinations[label] || null;
      showCurrentDestination(true);
      return;
    }
    if (state.step === 1) {
      if (label === "Let me explain") {
        choices.innerHTML = "";
        help.textContent = "Tell the Village what would make it easier to use.";
        input.focus();
        return;
      }
      if (label !== "Nothing right now") addMemory(label === "I prefer voice" ? "Prefers voice" : label === "I prefer typing" ? "Prefers typing" : label);
      state.step = 2;
      renderQuestion();
      return;
    }
    if (label === "Nothing right now") {
      showMemoryReview();
      return;
    }
    const prefixes = {
      "Something I'm working through": "Working through",
      "A practice that helps me": "Practice that helps",
      "Something I don't want to explain again": "Does not want to explain again",
      "Let me tell you": "Remember",
    };
    state.pendingMemoryPrefix = prefixes[label] || "Remember";
    choices.innerHTML = "";
    help.textContent = "Tell the Village only what you want it to remember.";
    input.focus();
  }

  async function savePreferredName(name) {
    const clean = String(name || "").trim().slice(0, 80);
    if (!clean) {
      state.step = 0;
      renderQuestion();
      return;
    }
    setBusy(true);
    try {
      activeUser = await updateUser({ data: { full_name: clean } });
      title.textContent = `Welcome, ${clean.split(/\s+/)[0]}.`;
      state.step = 0;
      renderQuestion();
    } catch {
      status.textContent = "That name did not save. You can try again or skip it.";
    } finally {
      setBusy(false);
    }
  }

  async function askConciergeNow(text) {
    setBusy(true);
    try {
      const response = await fetch("/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "member_help", messages: [{ role: "user", text }] }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error("Concierge unavailable");
      state.destination = payload.route ? {
        heading: payload.route.label,
        copy: payload.reply,
        pending: "The correct member room link will be added after it is confirmed.",
      } : { heading: "Stay with the Concierge.", copy: [payload.reply, payload.nextStep].filter(Boolean).join(" ") };
      showCurrentDestination(true);
    } catch {
      state.destination = { heading: "The Concierge is away from the desk.", copy: "Your membership is open. Explore the Village now or return here later." };
      showCurrentDestination(true);
    } finally {
      setBusy(false);
    }
  }

  async function submitAnswer() {
    const clean = input.value.trim();
    if (busy) return;
    if (state.step === -1) {
      await savePreferredName(clean);
      return;
    }
    if (!clean) {
      status.textContent = "Type an answer, use Talk, or skip this question.";
      return;
    }
    if (state.step === 0) {
      state.currentNeed = clean;
      input.value = "";
      await askConciergeNow(clean);
      return;
    }
    if (state.step === 1) {
      addMemory(`Makes the Village easier: ${clean}`);
      state.step = 2;
      renderQuestion();
      return;
    }
    addMemory(`${state.pendingMemoryPrefix || "Remember"}: ${clean}`);
    showMemoryReview();
  }

  function showMemoryReview() {
    resetScreen();
    responseBox.hidden = true;
    skipButton.hidden = true;
    progress.textContent = "Memory choice";
    question.textContent = "Would you like the Village to remember these for next time?";
    help.textContent = "A need for today is not saved as a lasting preference.";
    const review = showPanel(
      state.memories.length ? "Proposed for memory" : "Nothing is proposed for memory",
      state.memories.length ? "Review each item before you decide." : "You can continue without saving anything.",
    );
    if (state.memories.length) {
      const list = document.createElement("ul");
      list.className = "memory-list";
      state.memories.forEach((memory) => {
        const item = document.createElement("li");
        item.textContent = memory;
        list.appendChild(item);
      });
      review.appendChild(list);
    }
    const remember = button("Remember these", () => completeOnboarding("remember"), "primary-button");
    if (!state.memories.length) remember.hidden = true;
    addPanelActions(remember, button("Not now", () => completeOnboarding("not_now"), "secondary-button"));
  }

  async function completeOnboarding(decision) {
    setBusy(true);
    status.textContent = decision === "remember" ? "Saving your choices…" : "Finishing…";
    try {
      const response = await fetch("/member-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", decision, memories: decision === "remember" ? state.memories : [] }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error("save failed");
      state.foundingEligible = payload.foundingEligible;
      state.founderListing = payload.founderListing;
      setBusy(false);
      if (state.foundingEligible && !state.founderListing?.decision) showFounderConsent();
      else showFinalDestination();
    } catch {
      status.textContent = "That choice did not save. Try again or explore the Village. Your membership is not affected.";
      setBusy(false);
    }
  }

  function showFounderConsent() {
    resetScreen();
    responseBox.hidden = true;
    skipButton.hidden = true;
    progress.textContent = "Founding Villager choice";
    question.textContent = "Would you like your name included with the 108 Founding Villagers on the public Practice Village landing page?";
    help.textContent = "Your name will not be public unless you confirm it.";
    choices.append(
      button("Yes", showFounderNameEntry),
      button("No", () => saveFounderListing("no")),
    );
  }

  function showFounderNameEntry() {
    choices.innerHTML = "";
    responseBox.hidden = false;
    question.textContent = "What name would you like us to display?";
    help.textContent = "You will confirm the exact public name before it is saved.";
    input.value = activeUser.name?.trim() || "";
    input.placeholder = "Public display name";
    input.focus();
    state.step = 3;
  }

  function showFounderNameConfirmation(displayName) {
    resetScreen();
    responseBox.hidden = true;
    skipButton.hidden = true;
    progress.textContent = "Confirm public name";
    question.textContent = "Your name will appear publicly as:";
    help.textContent = "You can ask us to remove your name later.";
    const confirmation = showPanel("Public display name", "");
    const name = document.createElement("p");
    name.className = "display-name";
    name.textContent = displayName;
    confirmation.appendChild(name);
    addPanelActions(
      button("Yes, use this name", () => saveFounderListing("yes", displayName), "primary-button"),
      button("Change it", showFounderNameEntry, "secondary-button"),
      button("Don't list my name", () => saveFounderListing("no"), "secondary-button"),
    );
  }

  async function saveFounderListing(decision, displayName = null) {
    setBusy(true);
    status.textContent = "Saving your choice…";
    try {
      const response = await fetch("/member-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "founder_listing", decision, displayName }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error("save failed");
      state.founderListing = payload.founderListing;
      setBusy(false);
      showFinalDestination();
    } catch {
      status.textContent = "That public-name choice did not save. Try again or explore the Village. Nothing was published.";
      setBusy(false);
    }
  }

  function showFinalDestination() {
    showCurrentDestination(false);
    progress.textContent = "Onboarding complete";
    question.textContent = "Choose where to go next.";
  }

  sendButton.addEventListener("click", async () => {
    if (state.step === 3) {
      const displayName = input.value.trim().slice(0, 80);
      if (!displayName) {
        status.textContent = "Enter the name you want displayed or choose not to be listed.";
        return;
      }
      showFounderNameConfirmation(displayName);
      return;
    }
    await submitAnswer();
  });
  input.addEventListener("keydown", async (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendButton.click();
    }
  });
  skipButton.addEventListener("click", () => {
    if (state.step === -1) state.step = 0;
    else if (state.step < 2) state.step += 1;
    else showMemoryReview();
    if (state.step <= 2) renderQuestion();
  });

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    talkButton.hidden = true;
    voiceStatus.textContent = "Voice entry is not available in this browser. Typing works here.";
  } else {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = document.documentElement.lang || "en-US";
    let listening = false;
    let baseText = "";
    let segments = [];
    let timer = null;
    let limit = null;
    let recognitionError = null;

    function finishListening(message) {
      listening = false;
      talkButton.textContent = "Talk";
      clearInterval(timer);
      clearTimeout(limit);
      timer = null;
      limit = null;
      voiceStatus.textContent = message;
    }

    talkButton.addEventListener("click", () => {
      if (listening) {
        recognition.stop();
        return;
      }
      baseText = input.value.trim();
      segments = [];
      recognitionError = null;
      try {
        recognition.start();
      } catch {
        voiceStatus.textContent = "Voice is already starting. Wait a moment or type instead.";
      }
    });
    recognition.addEventListener("start", () => {
      listening = true;
      talkButton.textContent = "Stop";
      const started = Date.now();
      voiceStatus.textContent = "Listening: 0:00 of 1:00";
      timer = setInterval(() => {
        const elapsed = Math.min(60, Math.floor((Date.now() - started) / 1000));
        voiceStatus.textContent = `Listening: 0:${String(elapsed).padStart(2, "0")} of 1:00${elapsed >= 50 ? ". Ten seconds left." : ""}`;
      }, 1000);
      limit = setTimeout(() => recognition.stop(), 60000);
    });
    recognition.addEventListener("result", (event) => {
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        segments[index] = event.results[index][0].transcript.trim();
      }
      input.value = [baseText, segments.filter(Boolean).join(" ")].filter(Boolean).join(" ");
    });
    recognition.addEventListener("end", () => {
      if (recognitionError) {
        finishListening(recognitionError);
        recognitionError = null;
        return;
      }
      finishListening(input.value.trim()
        ? "Listening stopped. Your words are below. Review them, add more if you want, then press Send."
        : "Listening stopped without a transcript. Try again or type instead.");
    });
    recognition.addEventListener("error", (event) => {
      recognitionError = event.error === "not-allowed"
        ? "Microphone access was not allowed. You can type instead."
        : "Listening stopped. Keep any words below, try again, or type instead.";
    });
  }

  document.getElementById("logoutButton").addEventListener("click", async () => {
    await logout();
    window.location.replace("/");
  });

  try {
    const response = await fetch("/member-onboarding", { headers: { Accept: "application/json" } });
    if (response.ok) {
      const payload = await response.json();
      state.foundingEligible = payload.foundingEligible;
      state.founderListing = payload.founderListing;
    }
  } catch {
    status.textContent = "Your saved onboarding choices are temporarily unavailable. You can still continue without saving.";
  }
  renderQuestion();
}

if (page === "login") initLogin();
if (page === "member") initMemberLobby();
if (page === "welcome") initWelcome();
