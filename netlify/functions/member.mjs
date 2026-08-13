import { getUser } from "@netlify/identity";

const MEMBER_ROLES = ["member", "founding_villager", "admin", "test_member"];

function memberPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Member lobby · Practice Village</title>
  <meta name="robots" content="noindex" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Hanken+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/member.css?v=1" />
</head>
<body data-auth-page="member">
  <header class="member-header">
    <a href="/" class="member-brand">Practice Village</a>
    <nav><a href="/" class="member-link">Village map</a><button id="logoutButton" class="text-button" type="button">Sign out</button></nav>
  </header>
  <main class="member-main">
    <section class="member-welcome">
      <p class="eyebrow">Your member lobby</p>
      <h1>Welcome back<span id="memberName"></span>.</h1>
      <p>Start where you are. You do not need to use every room or finish anything today.</p>
      <span id="memberPlan" class="member-plan">Checking membership…</span>
    </section>
    <section class="member-grid" aria-label="Member shortcuts">
      <article class="member-card member-card--wide"><p class="eyebrow">Front desk</p><h2 id="conciergeCardTitle">Meet your Concierge</h2><p id="conciergeCardCopy">Start with a short, optional welcome conversation. Talk or type, skip any question, and save nothing unless you choose.</p><a id="conciergeCardLink" href="/welcome">Start your welcome conversation</a></article>
      <article class="member-card"><p class="eyebrow">Continue</p><h2>Your saved practices and plans</h2><p>Your Personal Intelligence Layer will appear here as member saving rolls out.</p><span class="member-state">Rolling out</span></article>
      <article class="member-card"><p class="eyebrow">Live</p><h2>Upcoming events</h2><p>Live classes with JoYi begin February 7, 2027. Member registration details will appear here.</p><span class="member-state">Included</span></article>
      <article class="member-card"><p class="eyebrow">Rebuild Arc Workshop</p><h2>Your membership-year voucher</h2><p id="voucherSummary">Checking your voucher allowance…</p><span id="voucherYear" class="member-state">Membership year</span></article>
    </section>
    <section class="member-section">
      <div class="section-heading"><div><p class="eyebrow">Your rooms</p><h2>Open the door you need.</h2></div></div>
      <div class="room-grid">
        <a class="room-card" href="/moxie-studio/"><b>Moxie Studios</b><span>Yoga, meditation, Bott Om, and the mirror</span></a>
        <a class="room-card" href="https://plantluck.org/"><b>The Kitchen</b><span>Plant nutrition support for a full week</span></a>
        <a class="room-card" href="https://hush-aidedeq.netlify.app/"><b>HUSH</b><span>The free sixty-second app, plus member mindfulness apps and resources as they open</span></a>
        <a class="room-card" href="/safety-hall/"><b>Safety Hall</b><span>Record what happened, check for patterns, and find options</span></a>
      </div>
    </section>
    <section class="member-section account-section">
      <div><p class="eyebrow">Your account</p><h2>Privacy and membership</h2></div>
      <div class="account-links"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="mailto:info@aidedeq.org?subject=Practice%20Village%20membership">Membership help or cancellation</a><button id="logoutButtonBottom" class="text-button" type="button">Sign out</button></div>
    </section>
  </main>
  <script type="module" src="/assets/member-auth.bundle.js?v=1"></script>
</body>
</html>`;
}

export default async function handler() {
  const user = await getUser();
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  if (!user || !roles.some((role) => MEMBER_ROLES.includes(role))) {
    return new Response(null, { status: 302, headers: { Location: "/login" } });
  }
  return new Response(memberPage(), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}

export const config = {
  path: ["/member", "/member/"],
};
