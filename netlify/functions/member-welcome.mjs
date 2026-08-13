import { getUser } from "@netlify/identity";

const MEMBER_ROLES = ["member", "founding_villager", "admin", "test_member"];

function welcomePage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Member onboarding · Practice Village</title>
  <meta name="robots" content="noindex" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Hanken+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/member.css?v=9" />
</head>
<body data-auth-page="welcome">
  <header class="member-header">
    <a href="/member" class="member-brand">Practice Village</a>
    <nav><a href="/member" class="member-link">Member lobby</a><button id="logoutButton" class="text-button" type="button">Sign out</button></nav>
  </header>
  <main class="welcome-main">
    <section class="welcome-intro" aria-labelledby="welcomeTitle">
      <h1 id="welcomeTitle">Welcome.</h1>
      <p>We have a few optional onboarding questions to help improve your Practice&nbsp;Village&nbsp;experience.</p>
      <p>You can <strong>talk, type, or skip</strong> any question.</p>
      <p>It should only take about two minutes.</p>
    </section>

    <section class="onboarding-card" aria-label="Practice Village onboarding">
      <p id="onboardingProgress" class="onboarding-progress" aria-live="polite"></p>
      <h2 id="onboardingQuestion"></h2>
      <p id="onboardingHelp" class="onboarding-help"></p>
      <div id="onboardingChoices" class="onboarding-choices"></div>

      <div id="welcomeResponse" class="welcome-response">
        <label class="sr-only" for="welcomeInput">Your answer</label>
        <textarea id="welcomeInput" rows="3" maxlength="1000" placeholder="Type your answer"></textarea>
        <div class="welcome-actions">
          <button id="talkButton" class="secondary-button" type="button">Talk</button>
          <button id="sendWelcome" class="primary-button" type="button">Send</button>
        </div>
        <p id="voiceStatus" class="voice-status" aria-live="polite">Voice is optional. Review the transcript before you send it.</p>
      </div>

      <div id="onboardingPanel" class="onboarding-panel" hidden></div>

      <div class="welcome-exits">
        <button id="skipWelcome" class="text-button" type="button">Skip this question</button>
        <a href="/member">Explore the Village</a>
      </div>
      <p class="onboarding-privacy"><a href="/privacy#concierge-onboarding">How onboarding information is handled</a></p>
      <p id="onboardingStatus" class="auth-status" role="status" aria-live="polite"></p>
    </section>
  </main>
  <script type="module" src="/assets/member-auth.bundle.js?v=7"></script>
</body>
</html>`;
}

export default async function handler() {
  const user = await getUser();
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  if (!user || !roles.some((role) => MEMBER_ROLES.includes(role))) {
    return new Response(null, { status: 302, headers: { Location: "/login" } });
  }
  return new Response(welcomePage(), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store" },
  });
}

export const config = { path: ["/welcome", "/welcome/"] };
