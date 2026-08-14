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
  <link rel="stylesheet" href="/assets/member.css?v=22" />
</head>
<body data-auth-page="member">
  <header class="member-header">
    <a href="/member" class="member-brand">Practice Village</a>
    <nav><a href="#rooms" class="member-link">The Village map</a><button id="logoutButton" class="text-button" type="button">Sign out</button></nav>
  </header>
  <main class="member-main">
    <section class="member-welcome">
      <p class="eyebrow">Your Village</p>
      <h1>Welcome back<span id="memberName"></span>.</h1>
      <p>Start where you are. You do not need to use every room or finish anything today.</p>
    </section>
    <section class="member-grid" aria-label="The Concierge and My Practice">
      <article class="member-card member-card--desk-embed">
        <div class="desk-embed-head"><span class="desk-embed-avatar" aria-hidden="true"><svg viewBox="0 0 40 40" width="30" height="30"><circle cx="20" cy="8" r="2.8" fill="#1A1A4E"/><circle cx="30.4" cy="14" r="2.8" fill="#1A1A4E"/><circle cx="30.4" cy="26" r="2.8" fill="#1A1A4E"/><circle cx="20" cy="32" r="2.8" fill="#1A1A4E"/><circle cx="9.6" cy="26" r="2.8" fill="#1A1A4E"/><circle cx="9.6" cy="14" r="2.8" fill="#1A1A4E"/><circle cx="20" cy="20" r="5.5" fill="#A84214"/></svg></span><div><strong>My Concierge</strong></div></div>
        <div id="orientationOffer"></div>
        <div id="deskEmbed"><p class="practice-note">The Concierge is stepping to the desk…</p></div>
      </article>
      <article class="member-card member-card--practice">
        <div class="practice-head"><div><h2>My Practice</h2><p>Things you've chosen to come back to.</p></div><div class="practice-toggle" role="group" aria-label="My Practice view"><button id="practiceViewList" class="text-button" type="button" aria-pressed="true">List</button><span aria-hidden="true">|</span><button id="practiceViewWeek" class="text-button" type="button" aria-pressed="false">Week</button></div></div>
        <p class="room-note">Nothing gets added here unless you add it.</p>
        <div id="practiceBody" class="practice-body"><p class="practice-note">Checking My Practice…</p></div>
        <div class="village-dates"><p class="eyebrow">In the Village</p><p class="room-note">Things happening around the Village that may be worth knowing about.</p><div id="villageDates" class="village-dates__list"></div></div>
      </article>
    </section>
    <section class="member-section" id="rooms">
      <div class="section-heading"><div><p class="eyebrow">The Village map</p><h2>Open the door you need.</h2></div></div>
      <div class="room-grid">
        <a class="room-card" href="/safety-hall?from=member"><img class="room-card__img" src="/assets/rooms/safety-hall.jpg?v=2" alt="" loading="lazy" /><span class="room-tag room-tag--open">Open</span><b>Safety Hall</b><span>Record what happened, check for patterns, map what is yours to carry, and find support options. Private on your device.</span><span class="room-note">Opens here; your lobby stays one tap back.</span></a>
        <a class="room-card" href="/kitchen"><img class="room-card__img" src="/assets/rooms/kitchen.jpg?v=2" alt="" loading="lazy" /><span class="room-tag room-tag--open">Open</span><b>The Kitchen</b><span>PlantLuck plus a vetted shelf for learning to eat mostly plants, and for finding food near you.</span><span class="room-note">Opens here; your lobby stays one tap back.</span></a>
        <a class="room-card" href="/hush"><img class="room-card__img" src="/assets/rooms/hush.jpg?v=2" alt="" loading="lazy" /><span class="room-tag room-tag--open">Open</span><b>HUSH</b><span>The sixty-second app plus a vetted shelf of free mindfulness resources.</span><span class="room-note">Opens here; your lobby stays one tap back.</span></a>
        <div class="room-card room-card--soon"><img class="room-card__img" src="/assets/rooms/moxie.jpg?v=2" alt="" loading="lazy" /><span class="room-tag room-tag--soon">Member entrance being confirmed</span><b>Moxie Studios</b><span>Yoga and meditation with Bott Om and the mirror. Your member door is being connected; we will not hand you a marketing page instead.</span><a class="room-note" href="https://moxiestudio.netlify.app/zenbottom-schedule.html?demo=1" target="_blank" rel="noopener">Try the free studio demo meanwhile →</a></div>
        <div class="room-card room-card--soon"><img class="room-card__img" src="/assets/rooms/curaited.jpg?v=2" alt="" loading="lazy" /><span class="room-tag room-tag--soon">Being connected</span><b>cur.AI.ted starter</b><span>Starter access to the cur.AI.ted studio for members.</span></div>
        <a class="room-card" href="/record"><img class="room-card__img" src="/assets/rooms/pil.jpg?v=2" alt="" loading="lazy" /><span class="room-tag room-tag--open">Open</span><b>Your Record</b><span>Your Personal Intelligence Layer: what you choose to keep, portable and yours.</span><span class="room-note">Opens here; your lobby stays one tap back.</span></a>
      </div>
    </section>
    <section class="member-section" id="voucher">
      <div class="member-grid">
        <article class="member-card"><p class="eyebrow">Rebuild Arc Workshop</p><h2>Your voucher</h2><p id="voucherSummary">Checking your voucher allowance…</p><p class="room-note">First series: Saturdays October 31 and November 7, 14, 21 · 3:00 pm Central on Zoom. Registering uses your voucher; cancel more than 48 hours ahead to keep it.</p><span id="voucherYear" class="member-state">Membership year</span></article>
      </div>
    </section>
    <section class="member-section account-section">
      <div><p class="eyebrow">Your account</p><h2>Privacy and membership</h2></div>
      <div class="account-links"><span id="memberPlan" class="member-plan">Checking membership…</span><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/welcome?onboarding=review">Review onboarding choices</a><a href="mailto:info@aidedeq.org?subject=Practice%20Village%20membership">Membership help or cancellation</a><button id="logoutButtonBottom" class="text-button" type="button">Sign out</button></div>
    </section>
  </main>
  <script type="module" src="/assets/member-auth.bundle.js?v=17"></script>
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
