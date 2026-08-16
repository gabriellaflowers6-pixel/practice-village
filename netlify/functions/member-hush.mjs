import { getUser } from "@netlify/identity";
import { HUSH_SHELF, HUSH_SHELF_META } from "./_shared/hush-resources.mjs";

const MEMBER_ROLES = ["member", "founding_villager", "admin", "test_member"];

const reviewedOn = new Date(`${HUSH_SHELF_META.approvedAt}T00:00:00Z`)
  .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function shelfItem(entry) {
  const metaBits = [entry.cost, entry.languages, `Reviewed ${reviewedOn}`].filter(Boolean);
  const title = entry.url
    ? `<a href="${entry.url}" target="_blank" rel="noopener">${entry.title}</a>`
    : entry.title;
  const tag = entry.status === "connecting"
    ? `<span class="room-tag room-tag--soon">${entry.statusLabel}</span>`
    : `<span class="room-tag room-tag--open">Open</span>`;
  const meanwhile = entry.meanwhile
    ? `<a class="room-note" href="${entry.meanwhile.url}" target="_blank" rel="noopener">${entry.meanwhile.label} →</a>`
    : "";
  return `<article class="shelf-item${entry.status === "connecting" ? " shelf-item--soon" : ""}">
    ${tag}
    <h3>${title}</h3>
    <p class="shelf-org">${entry.org}</p>
    <p>${entry.good}</p>
    <p class="shelf-limits">Where it stops: ${entry.limits}</p>
    ${meanwhile}
    <p class="shelf-meta">${metaBits.join(" · ")}</p>
  </article>`;
}

export function hushPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>HUSH · Practice Village</title>
  <meta name="robots" content="noindex" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Hanken+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/member.css?v=34" />
</head>
<body data-auth-page="room" data-room="hush">
  <header class="member-header">
    <a href="/member" class="member-brand">Practice Village</a>
    <nav><a href="/member" class="member-link">Back to your lobby</a><button id="logoutButton" class="text-button" type="button">Sign out</button></nav>
  </header>
  <main class="member-main">
    <section class="member-welcome">
      <p class="eyebrow">HUSH</p>
      <h1>Calm is a skill.</h1>
      <p>Stillness gives you a little more room between what happens and what you do next. Practicing that pause can help you notice tension sooner, bring your attention back when it scatters, and choose your next move instead of simply reacting.</p>
      <p>The goal is not to stay calm all the time. It is to get better at finding your way back.</p>
    </section>
    <section class="member-grid" aria-label="The HUSH app">
      <article class="member-card member-card--wide"><p class="eyebrow">The app</p><h2>Sixty seconds. Let it settle.</h2><p>Shake the globe and watch, listen, and breathe. For one minute, there is nothing to answer, fix, finish, or get right. Just stop adding to the noise and notice what happens.</p><a href="https://hush-aidedeq.netlify.app/" target="_blank" rel="noopener">Open HUSH</a><p class="room-note">Free for everyone. No account. Nothing tracked.</p><p class="room-note">Best on your phone. Opens in a new tab so the Village stays open.</p><button id="addHushDaily" class="text-button room-add room-add--ondark" type="button">Add HUSH daily</button><span id="hushAddStatus" class="room-note" hidden>Added. HUSH will be here each day.</span></article>
    </section>
    <section class="member-section">
      <div class="section-heading"><div><p class="eyebrow">The shelf</p><h2>More places to practice.</h2></div></div>
      <p class="record-note">Meditation, sound, breath, rest, and other ways to practice stillness. Each resource tells you what it offers, what it is useful for, and what to know before you leave the Village. Useful on its own. Free means free. No upsell shelf.</p>
      <div class="shelf">
        ${HUSH_SHELF.map(shelfItem).join("\n        ")}
      </div>
    </section>
  </main>
  <script type="module" src="/assets/member-auth.bundle.js?v=24"></script>
</body>
</html>`;
}

export default async function handler() {
  const user = await getUser();
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  if (!user || !roles.some((role) => MEMBER_ROLES.includes(role))) {
    return new Response(null, { status: 302, headers: { Location: "/login" } });
  }
  return new Response(hushPage(), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}

export const config = { path: ["/hush", "/hush/"] };
