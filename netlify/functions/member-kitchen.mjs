import { getUser } from "./_shared/session.mjs";
import { KITCHEN_SHELF, KITCHEN_SHELF_META } from "./_shared/kitchen-resources.mjs";

const MEMBER_ROLES = ["member", "founding_villager", "admin", "test_member"];

const reviewedOn = new Date(`${KITCHEN_SHELF_META.approvedAt}T00:00:00Z`)
  .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function shelfItem(entry) {
  const metaBits = [entry.cost, entry.languages, `Reviewed ${reviewedOn}`].filter(Boolean);
  return `<article class="shelf-item">
    <span class="room-tag room-tag--open">Open</span>
    <h3><a href="${entry.url}" target="_blank" rel="noopener">${entry.title}</a></h3>
    <p class="shelf-org">${entry.org}</p>
    <p>${entry.good}</p>
    <p class="shelf-limits">Where it stops: ${entry.limits}</p>
    <p class="shelf-meta">${metaBits.join(" · ")}</p>
  </article>`;
}

const group = (name) => KITCHEN_SHELF.filter((entry) => entry.group === name).map(shelfItem).join("\n        ");

export function kitchenPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>The Kitchen · Practice Village</title>
  <meta name="robots" content="noindex" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Hanken+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/member.css?v=36" />
</head>
<body data-auth-page="room" data-room="kitchen">
  <header class="member-header">
    <a href="/member" class="member-brand">Practice Village</a>
    <nav><a href="/member" class="member-link">Back to your lobby</a><button id="logoutButton" class="text-button" type="button">Sign out</button></nav>
  </header>
  <main class="member-main">
    <section class="member-welcome">
      <p class="eyebrow">The Kitchen</p>
      <h1>Eating more plants is a skill.</h1>
      <p>You do not need a perfect diet, a new pantry, or a pile of unfamiliar ingredients.</p>
      <p>Learning to eat mostly plants is about getting better at making something satisfying from what you have, trying foods in more than one way, and building a few meals you know you can come back to.</p>
      <p>The goal is not perfection. <b>It is making plant-forward eating easier to do in your actual life.</b></p>
    </section>
    <section class="member-grid" aria-label="PlantLuck">
      <article class="member-card member-card--wide"><p class="eyebrow">PlantLuck</p><h2>Start with what you have.</h2><p>Tell PlantLuck what is already in your kitchen and get ideas for what you can make with it.</p><p>No shopping list disguised as a recipe. No assumption that your pantry is full.</p><a href="https://plantluck.org/" target="_blank" rel="noopener">Open PlantLuck</a><p class="room-note">Use what you have. Waste less. Try something new.</p><p class="room-note">Opens in a new tab so the Village stays open.</p><button id="addPlantluckDailyRoom" class="text-button room-add room-add--ondark" type="button">Add PlantLuck daily</button><span id="plantluckRoomStatus" class="room-note" hidden>Added. PlantLuck will be here each day.</span></article>
    </section>
    <section class="member-section">
      <div class="section-heading"><div><p class="eyebrow">The shelf</p><h2>Learn what matters.</h2></div></div>
      <p class="record-note">Clear, free information for learning how to eat mostly plants without turning food into another thing to obsess over.</p>
      <div class="shelf">
        ${group("learn")}
      </div>
    </section>
    <section class="member-section">
      <div class="section-heading"><div><p class="eyebrow">Getting food</p><h2>Sometimes the problem is not the recipe.</h2></div></div>
      <p class="record-note">A Kitchen that teaches cooking while ignoring whether there is food in the house is only half a room. These resources can help you find what is available near you.</p>
      <div class="shelf">
        ${group("food")}
      </div>
      <p class="record-note shelf-close">Each resource tells you what it offers and where it stops. Useful on its own. Free means free. No upsell shelf.</p>
    </section>
  </main>
  <script type="module" src="/assets/member-auth.bundle.js?v=26"></script>
</body>
</html>`;
}

export default async function handler() {
  const user = await getUser();
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  if (!user || !roles.some((role) => MEMBER_ROLES.includes(role))) {
    return new Response(null, { status: 302, headers: { Location: "/login" } });
  }
  return new Response(kitchenPage(), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}

export const config = { path: ["/kitchen", "/kitchen/"] };
