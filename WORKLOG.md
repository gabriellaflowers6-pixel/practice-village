# Practice Village — Work Log

Repo created 2026-08-11 by importing the live practice-village.netlify.app deploy
(no repo was connected to the Netlify site; source did not exist on this machine).
Deploys: `netlify deploy --prod --dir .` to the `practice-village` Netlify site,
only with JoYi/Gabby's OK. First commit is the as-deployed baseline; diff against
it to see every change.

---

## 2026-08-11: Rebuild to match aidedeq.org canon — DEPLOYED

Shipped on JoYi/Gabby's "lets go": `netlify deploy --prod` to site
`aae16881-7774-4d75-a7f2-6065e8c2e45d`, deploy `6a7ac56532bc8f919b57cfc3`. Verified
live: 200; Founding Villager / $149 / $15 / YWCA line / Quiet Room / Kitchen / "Step
into the Studio" all present; zero $97, $19, Alison, Founding Circle, The Commons, and
zero buy.stripe.com links anywhere (old wrong-price checkout is dead). Commons stays
out per JoYi, reviewed step by step before shipping.

Source of truth: the 2026-08-11 aidedeq.org work + Moxie-Studio-Launch-Plan-2026-08.
- Positioning: "a digital community center for women, built the way a YWCA serves a
  town. Women focused, open to all" (title, meta, center section, footer).
- Rooms: Moxie Studio (Open, flagship, no "coach" language, Feb 2027 live classes),
  The Kitchen (PlantLuck live link), The Quiet Room (HUSH, free, live link),
  Safety Hall (in build, microaggression tracker), The Record Room (rolling out).
  Removed: The Circle (stale July 11 cohort), Resource Library (folded into the
  Front Desk), The Commons (cut per JoYi).
- Pricing: Charter List free; Membership $15/mo founding, moves to $25 once all
  rooms open; Founding Villager $149/yr, 108 seats, locked for life. Founding
  Circle ($97) retired. All stale June/July dates removed.
- STRIPE: the old $97 and $19 payment links were removed from script.js CONFIG.
  New $149/yr and $15/mo links DO NOT EXIST YET (JoYi creates them). Until pasted
  into CONFIG.stripeVillager / CONFIG.stripeMembership, paid buttons route to the
  Charter List capture with a "checkout opens shortly" note (verified working).
- Alison Wagner removed (builders section + assets/alison.png); "the three of us"
  is now "the two of us"; Moxie Studio named as the XPRIZE entry, matching the
  submission doc.
- script.js v28 -> v29. Verified in rendered DOM: rooms, prices, builders JoYi +
  Gabby only, PlantLuck + HUSH links live, paid-button fallback focuses the email
  field.

## 2026-08-11 (later): Moxie Studio landing joins the Village — DEPLOYED

Deploy `6a7ad57d02f9635e1b1087d2` on JoYi's "lets ship". Verified live:
/moxie-studio/ serves 200 with "Membership runs $15 a month today and moves to $25 a
month once all rooms are open", Quiet Room x3, zero $97 / Den / Commons; the homepage
Moxie Studio room card links to /moxie-studio/.

Discovery: moxiestudio.netlify.app is the live-class JOIN screen (first name + class
code), not a landing page. The sales page (the bridge, canon per JoYi) was never
deployed publicly. Per JoYi: "these cannot be stand alone," and the committed language
is $15 up to $25, 108 seats, everywhere.

Done: the bridge page now lives at /moxie-studio/ on this site (copied from
~/dev/movemirror/landing/moxie-studio-village-bridge.html + its assets). Fixed while
staging: $19 → $15 "once all rooms are open"; Founding Circle $97 line deleted (that
Stripe link was still live in the page); room list and grid now canonical (Den → The
Quiet Room/HUSH free, The Commons → Safety Hall + tracker); all
practice-village.netlify.app absolute links now relative; nav gains "Practice Village
home"; privacy link fixed. The page's own empty-Stripe fallback (scroll to its Charter
capture) kept; STRIPE_ANNUAL_LINK / STRIPE_MONTHLY_LINK in the inline script join the
FLIP-AT-STRIPE list. Homepage Moxie Studio room card now links to /moxie-studio/
instead of the join screen; same fix queued on aidedeq (unpushed).

**Bugfix (same evening, found by JoYi):** clicking the Moxie Studio room card only
flipped it; the "Step into the Studio" link on the back face was eaten by the card's
flip handler, so the landing page was unreachable by click. Fixed: the flip handler now
ignores clicks on links (e.target.closest("a") returns early); the Studio door link is
also on the FRONT face of the card; and "Moxie Studio" was added to the main nav.
script.js v29 to v30, styles v58 to v59 (one .room__cta rule). Click-tested headless:
body click flips, link click navigates to /moxie-studio/ without flipping.

Bugfix DEPLOYED: deploy 6a7aecba8e97e32c5c2a3eef, verified live (nav link x3, front-face door, fixed flip handler in served script.js?v=30).

## 2026-08-11 (night): One-job-per-site logic pass — DEPLOYED

JoYi's architecture review: three sites repeated each other. New logic, decided with
JoYi: aidedeq.org = the company (Village appears once as a hand-off, no room grid, no
store membership card); Practice Village = single source of truth for rooms, pricing,
checkout, Charter List, and the 108-seat counter; Moxie Studio page = pure product page,
every join CTA deep-links to /#doors.

This repo's changes: Studio page lost its duplicate room grid, its own founding
checkout wiring (checkoutBtn/monthlyBtn/STRIPE config), its Charter form, and its live
seat counter (now a static "108 founding seats, priced in the open" line + same in
hero); nav CTA and ticket buttons -> /#doors. Homepage Founding Villager ticket gains
the live counter (CONFIG.seatsTaken in script.js, id="seatsLeft"). script v31, styles
v60. STRIPE FLIP now touches ONE file: script.js CONFIG (stripeVillager,
stripeMembership, seatsTaken).

**Studio page design + copy review (same night, JoYi's ask):** desktop and mobile pass
for a modern professional product page. Copy: hero lede no longer repeats the h1; the
"Who this is for" wall of text is now four scannable gold-dot cards; the First 30 Days
door breaks its run-on into a shape line + a Week 1-4 list; the "studies linked in the
footer" claim and the footer's dead "Studies and sources" href="#" link are gone; the
FAQ no longer references "the room grid above" (removed earlier); zero em dashes.
Visual: village band gains room-name chips + a real button; ticket seat line no longer
echoes the section heading; .ipad{overflow:hidden} kills a horizontal scrollbar caused
by the scaled showcase card. Mobile: nav rebuilt as brand + compact "Join · $149" pill
(three items could not fit 375px without overlap; the page body links to the Village
three times); hero headline calmed from 10vw to 7.6vw. Verified at 1280 and 375: no
horizontal overflow, who cards 2-col/1-col, chips centered, ticket sticky on desktop.

**Village homepage review (same night, same critical eye):** og:title/og:description
still carried the pre-rework positioning ("rebuilding is hard, we clear the confusion");
now match the YWCA canon, so shared links preview correctly. The Builders section's six
mission paragraphs are now three (merged the red-tape and human-work paragraphs,
rewrote the "not only logistical. It is human" construction, folded the two closing
invitations into one). Mobile: the sticky "Take a founding seat" pill wrapped to two
lines and collided with the Breathe button; it now docks bottom-right, one line, and
the two never overlap (verified by rect intersection at 375px). Hamburger menu
open/close verified by simulated clicks. No horizontal overflow at 1280 or 375. Zero em
dashes. styles v60 to v61.

**Charter email field (JoYi spotted it):** the input rendered as an unreadable grey slab
on the dark ticket. Two .ticket__capture input rule blocks competed; the later one (55%
transparent white, written for a light card) won the cascade. Consolidated to one block:
solid #FBF9F4 field, ink text, readable placeholder, clay focus ring. styles v61 to v63.

**Night deploy shipped:** PV deploy 6a7afc85b0584d7bb1f9ae18 (one-door logic + Studio
review + Village review + email field, styles v63). Verified live: seat counter markup,
canon og:title, 3 builder paragraphs, Studio who-cards/week-list/room-chips/compact-CTA
all serving, 3 CTAs to /#doors. aidedeq 26fae2e..46e93ef pushed, ready: v60, village
grid gone, PV store card gone, "Tools that stand on their own" + one-line room list live.

