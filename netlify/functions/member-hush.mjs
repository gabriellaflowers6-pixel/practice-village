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
  <link rel="stylesheet" href="/assets/member.css?v=14" />
</head>
<body data-auth-page="room">
  <header class="member-header">
    <a href="/member" class="member-brand">Practice Village</a>
    <nav><a href="/member" class="member-link">Back to your lobby</a><button id="logoutButton" class="text-button" type="button">Sign out</button></nav>
  </header>
  <main class="member-main">
    <section class="member-welcome">
      <p class="eyebrow">HUSH</p>
      <h1>A little quiet.</h1>
      <p>The sixty-second app plus a vetted shelf of places to practice. Everything here is free and sells you nothing.</p>
    </section>
    <section class="member-grid" aria-label="The HUSH app">
      <article class="member-card member-card--wide"><p class="eyebrow">The app</p><h2>Sixty seconds. Three breaths.</h2><p>Shake your phone, watch the dust settle, and breathe until it lands. Free for everyone, no account, nothing tracked.</p><a href="https://hush-aidedeq.netlify.app/" target="_blank" rel="noopener">Open HUSH</a><p class="room-note">Best on your phone. Opens in a new tab so the Village stays open.</p></article>
    </section>
    <section class="member-section">
      <div class="section-heading"><div><p class="eyebrow">The shelf</p><h2>Vetted, free, no upsells.</h2></div></div>
      <p class="record-note">Each entry says what it is good for and where it stops. Platforms whose free tier exists to sell a subscription are not shelved.</p>
      <div class="shelf">
        ${HUSH_SHELF.map(shelfItem).join("\n        ")}
      </div>
    </section>
  </main>
  <script type="module" src="/assets/member-auth.bundle.js?v=12"></script>
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
