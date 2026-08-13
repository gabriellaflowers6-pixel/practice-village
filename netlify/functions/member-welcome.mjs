import { getUser } from "@netlify/identity";

const MEMBER_ROLES = ["member", "founding_villager", "admin", "test_member"];

function welcomePage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome conversation · Practice Village</title>
  <meta name="robots" content="noindex" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Hanken+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/member.css?v=2" />
</head>
<body data-auth-page="welcome">
  <header class="member-header">
    <a href="/member" class="member-brand">Practice Village</a>
    <nav><a href="/member" class="member-link">Member lobby</a><button id="logoutButton" class="text-button" type="button">Sign out</button></nav>
  </header>
  <main class="welcome-main">
    <section class="welcome-copy" aria-labelledby="welcomeTitle">
      <p class="eyebrow">A conversation, not a form</p>
      <h1 id="welcomeTitle">What would make the Village useful right now?</h1>
      <p>Talk or type. The Concierge will ask one optional question at a time. You can skip anything or finish whenever you want.</p>
      <ul class="welcome-facts">
        <li>Your membership is already open.</li>
        <li>Your voice becomes text you can check before sending.</li>
        <li>Practice Village does not keep the audio.</li>
        <li>Nothing from this conversation is saved unless you choose at the end.</li>
      </ul>
    </section>
    <section class="welcome-chat" aria-label="Welcome conversation with the Concierge">
      <div id="welcomeThread" class="welcome-thread" aria-live="polite">
        <div class="chat-message chat-message--concierge">You are in. What would make your membership useful to you right now?</div>
      </div>
      <div id="welcomeSummary" class="welcome-summary" hidden></div>
      <div class="welcome-controls" id="welcomeControls">
        <label class="sr-only" for="welcomeInput">Tell the Concierge what would help</label>
        <textarea id="welcomeInput" rows="3" maxlength="1000" placeholder="Type here, or use Talk…"></textarea>
        <div class="welcome-actions">
          <button id="talkButton" class="secondary-button" type="button">Talk</button>
          <button id="sendWelcome" class="primary-button" type="button">Send</button>
        </div>
        <p id="voiceStatus" class="voice-status">Voice is optional. You can review the transcript before sending.</p>
        <div class="welcome-exits">
          <button id="skipWelcome" class="text-button" type="button">Skip this question</button>
          <button id="finishWelcome" class="text-button" type="button">Finish for now</button>
          <a href="/member">Return to the lobby</a>
        </div>
      </div>
    </section>
  </main>
  <script type="module" src="/assets/member-auth.bundle.js?v=2"></script>
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
