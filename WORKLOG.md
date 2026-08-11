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

## 2026-08-11 (later): Moxie Studio landing joins the Village — PENDING DEPLOY

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
