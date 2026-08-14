import { getUser } from "@netlify/identity";

const MEMBER_ROLES = ["member", "founding_villager", "admin", "test_member"];

function recordPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Record · Practice Village</title>
  <meta name="robots" content="noindex" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Hanken+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/member.css?v=18" />
</head>
<body data-auth-page="record">
  <header class="member-header">
    <a href="/member" class="member-brand">Practice Village</a>
    <nav><a href="/member" class="member-link">Back to your lobby</a><button id="logoutButton" class="text-button" type="button">Sign out</button></nav>
  </header>
  <main class="member-main">
    <section class="member-welcome">
      <p class="eyebrow">Your Record</p>
      <h1>Your Personal Intelligence Layer.</h1>
      <p>Everything you chose to keep, from the front desk and across the Village. Yours to read, remove, and take with you.</p>
    </section>
    <section class="member-grid" aria-label="Your Record">
      <article class="member-card member-card--record"><div id="savedCards" class="saved-cards"><p id="savedCardsCopy">Checking your Record…</p></div><div id="recordActions" class="record-actions"></div><span id="savedCardsState" class="member-state">Yours to keep or clear</span></article>
    </section>
    <section class="member-section">
      <p class="eyebrow">Privacy</p>
      <h2>What stays where</h2>
      <p class="record-note">What you keep here travels with your membership. What you document in Safety Hall stays on your device and is never sent to us. Removing something here removes it for good.</p>
    </section>
  </main>
  <script type="module" src="/assets/member-auth.bundle.js?v=14"></script>
</body>
</html>`;
}

export default async function handler() {
  const user = await getUser();
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  if (!user || !roles.some((role) => MEMBER_ROLES.includes(role))) {
    return new Response(null, { status: 302, headers: { Location: "/login" } });
  }
  return new Response(recordPage(), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}

export const config = {
  path: ["/record", "/record/"],
};
