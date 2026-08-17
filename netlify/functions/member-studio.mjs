// Moxie Studios, as a room in the Village.
//
// Gabby's landing page sells the studio to a stranger: a full-screen hero and
// a "try the free demo" button. A Villager already bought the room, so this is
// what she gets instead. Same shape as HUSH and the Kitchen: what the room is
// for, then the doors, in the order a beginner needs them.
import { getUser } from "@netlify/identity";

const MEMBER_ROLES = ["member", "founding_villager", "admin", "test_member"];

function card({ href, eyebrow, title, body, note, wide = false }) {
  return `<article class="member-card${wide ? " member-card--wide" : ""}">
      <p class="eyebrow">${eyebrow}</p>
      <h2>${title}</h2>
      <p>${body}</p>
      <a href="${href}">Open</a>
      ${note ? `<p class="room-note">${note}</p>` : ""}
    </article>`;
}

export function studioPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Moxie Studios · Practice Village</title>
  <meta name="robots" content="noindex" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Hanken+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/member.css?v=36" />
</head>
<body data-auth-page="room" data-room="moxie">
  <header class="member-header">
    <a href="/member" class="member-brand">Practice Village</a>
    <nav><a href="/member" class="member-link">Back to your lobby</a><button id="logoutButton" class="text-button" type="button">Sign out</button></nav>
  </header>
  <main class="member-main">
    <section class="member-welcome">
      <p class="eyebrow">Moxie Studios</p>
      <h1>Learn it properly.</h1>
      <p>Nobody is watching. Moxie teaches beginner yoga and meditation from the ground up. She takes you through the basics, and the mirror lets you check your own form as you go. It runs on your device. Nothing is recorded and nothing is sent anywhere.</p>
      <p>Every pose was reviewed with a human teacher before it reached you. Start anywhere. You do not have to finish anything today.</p>
    </section>

    <section class="member-grid" aria-label="Start here">
      ${card({
        href: "/studio/zenbottom-practice.html",
        eyebrow: "Start here",
        title: "Guided practice, with the mirror.",
        body: "Moxie walks you through a pose at your pace and the mirror shows you what your body is doing, so you can correct your own form instead of wondering. Your camera stays on your machine.",
        note: "Allow the camera when your browser asks. Nothing leaves the device.",
        wide: true,
      })}
    </section>

    <section class="member-section">
      <div class="section-heading"><div><p class="eyebrow">The rooms</p><h2>Whatever today asks for.</h2></div></div>
      <div class="member-grid">
        ${card({
          href: "/studio/zenbottom-meditations.html",
          eyebrow: "Meditation",
          title: "Find stillness.",
          body: "Guided sits from one minute to twenty, a moving meditation when sitting is not it today, and a video version when you want something to follow.",
        })}
        ${card({
          href: "/studio/zenbottom-breath-room.html",
          eyebrow: "Breath",
          title: "The breath room.",
          body: "A quieter guide and a slower pace. Useful when your head is loud and a full practice is too much to ask of yourself.",
        })}
        ${card({
          href: "/studio/zenbottom-library.html",
          eyebrow: "Library",
          title: "The lesson library.",
          body: "Every lesson and sequence in the studio, browsable, so you can find the practice that fits the time and body you actually have.",
        })}
        ${card({
          href: "/studio/zenbottom-session-setup.html",
          eyebrow: "Set up",
          title: "Make the room yours.",
          body: "Choose the voice, the music, and how much guidance you want before you begin. Set it once and the studio remembers.",
        })}
        ${card({
          href: "/studio/zenbottom-schedule.html",
          eyebrow: "Live classes",
          title: "What is coming in February.",
          body: "Live classes with JoYi open February 7, 2027, and they are included with your membership. The schedule shows what is planned. Nothing to join yet.",
          note: "Camera and microphone will always be your choice. Classes are never recorded.",
        })}
        ${card({
          href: "/studio/zenbottom-settings.html",
          eyebrow: "Yours",
          title: "Your quiet corner.",
          body: "Your practice settings and what the studio remembers about how you like to practice.",
        })}
      </div>
    </section>
  </main>
  <script type="module" src="/assets/member-auth.bundle.js?v=25"></script>
</body>
</html>`;
}

export default async () => {
  let user = null;
  try {
    user = await getUser();
  } catch {
    user = null;
  }
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  if (!user || !roles.some((role) => MEMBER_ROLES.includes(role))) {
    return new Response("", { status: 302, headers: { Location: "/login?from=%2Fstudio" } });
  }
  return new Response(studioPage(), {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
};

export const config = { path: ["/studio", "/studio/"] };
