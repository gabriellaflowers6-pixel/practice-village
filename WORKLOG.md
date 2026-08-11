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

## 2026-08-11 (late night): The Studio Window hero — PENDING DEPLOY

JoYi's redesign, talked through first: the old hero led with benefit copy and the
Concierge chat demo, so visitors could not tell what the building was. New hero =
walking up to the community center. Left: identity stated flat out ("A digital community
center for women." + YWCA line + CTAs). Right: an arched window into Moxie Studio (warm
chocolate interior, the mirror's warrior-two outline glowing through the glass) with a
brass room plaque: MOXIE STUDIO · the flagship room · open · Peek inside -> /moxie-studio/.
The Concierge demo moved to "sort the mess" where it demonstrates the claim (see the
building, see the fitness room through the glass, then meet the front desk). The Center
section no longer repeats the YWCA sentence. Fixed in the pass: lone-"A" headline break
(nbsp), and a real mobile clip where the window's fixed padding forced the hero wider
than the phone (hero children min-width:0, frame img max-width:100%). Verified at 1280
and 375 by DOM rects: nothing clipped, order chip > h1 > lede > CTAs > window > plaque.
styles v63 to v65.

**Window rebuild (JoYi: looked cheap, square cut off in the arch):** the scene now fills
the whole glass. Layers inside the arch: ceiling light glow, floorboards with a light
pool, the practitioner screen-blended into the room (brightness/contrast crush + radial
mask dissolve her screenshot rectangle), a transom bar at the spring line, one restrained
diagonal sheen, brass inner lining on the doubled frame. Research note: 2026 design
writing agrees glass effects read cheap when heavy; quality comes from the scene filling
the frame with depth cues, effects restrained. The plaque markup is JoYi's sign slot
(drop her image into .window__plaque). styles v65 to v67. OPEN: mid-scroll creativity
pass, JoYi's Moxie Studio sign.

## 2026-08-11 (latest): Concierge unit, six rooms, RAW — PENDING DEPLOY

JoYi's restructure, talked through and synced first:
- Window: head no longer cut (figure 80%, transom raised, mask widened).
- After "You are not the problem": one two-column Concierge unit — the live demo beside
  what powers it (Gemini grounded in AIdedEQ + The Practice Center IP), three point
  cards (answers that hold / routes to the right room / remembers with consent into Your
  PIL), closing line: Concierge handles the logistics, the Village holds the human part.
  The old duplicate splitcards are gone.
- Rooms now six and named her way: Moxie Studio, The Kitchen, The Quiet Room, Safety
  Hall, Your PIL (renamed from Record Room), Cur.AI.ted ("starter tier included with
  membership; the full studio is sold on its own"). Center tagline: the Concierge routes
  you to the right one.
- The Rebuild Arc left mid-page and became a compact workshop block after pricing:
  six-step philosophy, quarterly, four Saturday mornings, next one October, one workshop
  a year included with membership. Redeem-code mechanics deferred.
- Removed: the standalone Arc section and the big PIL cardstack section (job now done by
  the Concierge unit, the demo's save layer, and the Your PIL room). Page order:
  hero, how, center, hilo, builders, faq, doors, arc (RAW), gifts.
- aidedeq store: Cur.AI.ted card keeps full/tiered pricing and notes the included
  starter tier (committed on aidedeq repo).
Verified: 6 rooms, section order, head clear of transom, no overflow desktop or mobile,
single-column stacking at 375. styles v67 to v68.

**JoYi's punch list (2026-08-11 latest), one by one:**
1. Bridge spacing: "Practice Village helps you sort the mess" now sits 1px above the
   Concierge unit (was 204px). Root cause was worse than margins: an earlier regex had
   cut the demo card in half, orphaning demoBody/demoLayer between the bridge and the
   row (the ghost "How may we help you?" in her screenshot). Demo rebuilt whole,
   div-balance verified, chips click-tested.
2+5. Point cards: white background, ink text, per-card accent dots; no more grey on grey.
3. Plain language: "Answers that hold" et al replaced with Ask anything / Answers you
   can trace (Gemini + TPC 30 years + your own saved learning, not random internet
   advice) / You are wise (remember and re-remember) / It routes you.
4. Closing line now hers: "The magic of practice unfolds over the long arc of learning
   and healing."
6. Front Desk banner: title left of a gold rule, description right; no more crammed
   center in a wide box.
7. Whitespace: section padding tightened sitewide, room backs trimmed, faces tightened.
8. FAQ rewritten to copy rules: no "we're not pretending otherwise", info-handling
   answer expanded for transparency (PIL, on-device video, never sold or shared), stale
   Record Room reference fixed.
Plus: JoYi's MoxieStudios_logo.png (from Downloads, alpha-trimmed 2000x2000 to 1977x359)
installed as the window sign on a clean cream plaque. styles v68 to v71.

**Approved copy pass (JoYi sign-off, 2026-08-11 late):** Card 1 now carries the three
questions midlife women actually ask, per Mayo Clinic Proceedings (~5,000 women 45-60;
sleep among the most severe symptoms, 87% never sought care), AASM (50% of women 45-64
report menopause-disrupted sleep), and AARP (financial security + 61% of caregivers are
women): Why can't I sleep? Will my money last? Who cares for me while I care for
everyone else? Card 3 adds the RAW invitation; card 4 uses JoYi's routing framing
(quiet/people/practice). FAQ: Moxie's real words (Bott Om + the mirror), Gemini named
overtly for the buildathon, "in the open" removed. Builders heading: "Meet the
builders." Window plaque: "beginner yoga and meditation · open" + the sell line for
people not ready to walk into a class; plaque restyled brass-on-mahogany (the white
cheapened the gold sign). Glass below the transom color-matched to the sampled image
background (#2D2016) so no square-in-square. Serif swapped Fraunces -> Cormorant
Garamond for the prettier J (also unifies with the Studio page). Concierge heading
moved above both columns; demo and first card tops align (verified at row geometry;
the visible 20px in the pane is the pre-reveal translate in a throttled hidden tab —
IntersectionObserver does not fire in occluded tabs, which also explains tonight's
stale screenshots). Section padding tightened again. styles v71 to v73.

**JoYi round (11:18pm):** bridge line is now serious and single-line: "This is
complicated. We have real answers." Founder heading: "I've been practicing." Plaque
rebuilt as an ordered grid fully below the glass (sign, gold rule, meta, sell line, peek
link, consistent 7px rhythm, fixed width). Take-these-with-you grid grows to six in
three columns: the four teachings plus both Snapshots (WellBEing Snapshot, Sources of
Wholeness) with free/no-login language matching aidedeq. styles v73 to v74. Verified by
DOM: one-line bridge, 6 gifts, 3 columns, both snapshot links, plaque grid + rule, no
overflow.

**11:28pm round:** the closing quote (clay-rule paragraph) moved under the demo in the
left column, balancing the Concierge unit; both hilo boxes (JoYi bio + Meet the
builders) now share max-width 920px. styles v74 to v76. Logo unification proposed to
JoYi (one consistent mark, amber center + single dot color; kill the big multicolor
bloom above One Center) awaiting her pick before any dot changes.

