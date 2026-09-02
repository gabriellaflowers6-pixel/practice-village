// /projects: the member's project room (PROJECTS_PRD.md, slice 1).
// Server-rendered shell like member-record.mjs; the client module in
// member-auth.bundle.js (data-auth-page="projects") does the rest.
import { getUser } from "./_shared/session.mjs";

const MEMBER_ROLES = ["member", "founding_villager", "admin", "test_member"];

function projectsPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="color-scheme" content="light" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Projects · Practice Village</title>
  <meta name="robots" content="noindex" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Hanken+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/member.css?v=40" />
  <link rel="stylesheet" href="/assets/roo/roo.css?v=1" />
</head>
<body data-auth-page="projects">
  <header class="member-header">
    <a href="/member" class="member-brand">Practice Village</a>
    <nav><a href="/member" class="member-link">Back to your lobby</a><a href="/record" class="member-link">Your Record</a><button id="logoutButton" class="text-button" type="button">Sign out</button></nav>
  </header>
  <main class="member-main" id="projectsMain">
    <section class="member-welcome">
      <p class="eyebrow">Your Projects</p>
      <h1>The work you are moving.</h1>
      <p>Bring something you want to make, change, solve, or finish. The Concierge works it with you: what exists, what matters, what to do next, and real pieces made along the way.</p>
    </section>
    <section id="projectsBody" aria-label="Your Projects"><p class="practice-note">Checking your projects…</p></section>
  </main>
  <script type="module" src="/assets/member-auth.bundle.js?v=28"></script>
  <script src="/assets/roo/roo-pv.js?v=1" defer></script>
</body>
</html>`;
}

export default async function handler() {
  const user = await getUser();
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  if (!user || !roles.some((role) => MEMBER_ROLES.includes(role))) {
    return new Response(null, { status: 302, headers: { Location: "/login" } });
  }
  return new Response(projectsPage(), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}

export const config = {
  path: ["/projects", "/projects/"],
};
