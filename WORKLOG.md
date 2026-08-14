### 2026-08-14 — R1 TO PROD on JoYi's GO (JoYi's bot, STARTED 16:00 JST)
JoYi walked the fixed draft, saw her two cards in the Record room, ready to move on.
Pushing main and deploying prod: R1 complete (consent-pattern capture, the ending,
Your Record naming on every surface, JoYi's copy picks, the test-account read fix,
the one Record area at /record). PHASES.md R1 marked shipped; R2 spec updated to
JoYi's format ruling: Markdown second-brain file + neat PDF with Practice Village
footer. PROD VERIFY below in this entry once live.

### 2026-08-14 — R1 walkthrough fixes: the vanished save + one Record area (JoYi's bot, STARTED 15:00, STOPPED 15:40 JST)
JoYi saved 2 things at the desk; the lobby showed nothing. THE SAVE WORKED: both cards
verified present in Netlify Blobs (test-onboarding key, 01:32Z). The bug was the read:
member-onboarding fabricated a fresh empty record for admin/test accounts instead of
reading the stored test blob, so every GET saw nothing and a second save would have
clobbered the first. One line: read the test key back before fabricating. Real paying
members (with membership records) were never affected; member-status already read the
test blob correctly, member-onboarding did not.
SECOND (JoYi's ruling on the duplicate): the Village map's Your PIL card is the ONLY
Record area. The lobby grid card is REMOVED. The map card is now a real door: tag Open,
opens /record, a member-gated Record room page (new netlify/functions/member-record.mjs)
holding the full list (read + remove; download lands here in R2) plus the what-stays-
where privacy note (membership Record vs Safety Hall on-device).
FILES: netlify/functions/member-onboarding.mjs (the read fix),
netlify/functions/member-record.mjs (new, /record), netlify/functions/member.mjs (grid
card removed, map card live, aria label), member-auth.js (initRecordPage, lobby no
longer renders the list), assets/member.css (record card + note), busters member.css
v12 + bundle v10 everywhere including the new page.
NEW STRINGS: record page h1 "Your Personal Intelligence Layer.", intro "Everything you
chose to keep, from the front desk and across the Village. Yours to read, remove, and
take with you.", privacy heading "What stays where" + note, map card note "Opens here;
your lobby stays one tap back."
VERIFIED: harness renders the record page with JoYi's actual two saved cards (resource
detail + links intact) at 1161px; blob store inspected directly to confirm the data was
never lost. NOT verified without JoYi: her authed round trip on the draft.
SHARED SURFACES: none. Draft only.

### 2026-08-14 — R1 SHIPPED TO DRAFT: consent pattern, the ending, Your Record, copy sweep (JoYi's bot, STARTED 13:20, STOPPED 14:20 JST)
Phase R1 of PHASES.md, built on JoYi's GO with her verbatim copy picks.
FILES: member-auth.js, assets/member.css, assets/member-auth.bundle.js,
netlify/functions/member.mjs, netlify/functions/concierge.mjs (prompt),
index.html (Record card + FAQ naming + porch), script.js (porch copy), login.html +
member-welcome.mjs (busters), PHASES.md (guardrail 8 the copy gate; R1 items 7-8).
Busters: member.css v11, bundle v9, script.js v39.
(1) CONSENT PATTERN: per-block Keep buttons and the per-reply save question are gone.
Everything the desk produces (card, next step, search walkthrough, resource list)
accumulates quietly; soft counter "N things set aside for your Record"; one review at
wrap-up; Keep this private now removes the whole latest exchange from candidates.
(2) THE ENDING: wrap-up leads to a real ending: what was kept, Back to your lobby,
Open [routed room] when the conversation pointed somewhere, Start another conversation.
Nothing auto-navigates. Leaving for the lobby with candidates pending offers the review
once (Before you go), never a gate, second click passes through.
(3) NAMING: Your Record everywhere. Lobby card teaches the full name once (Your
Personal Intelligence Layer). Landing card + FAQ swapped off "Your PIL". "Saved
things" retired.
(4) COPY SWEEP (JoYi's picks verbatim): opener "What do you need help with this week?"
on desk AND porch; six chip sends rewritten; model register example replaced; heaviest
and pressure point banned in the prompt itself.
NEW STRINGS FOR THE WALKTHROUGH NOTE (guardrail 8): the opener, six chip sends, counter
line, wrap headings ("Keep any of this in your Record?" / "Before you go:"), "Keep
nothing and go to your lobby", "Stay at the desk", "Back to the conversation", ending
lines ("N things kept in your Record. It is in your lobby whenever you want it." /
"Nothing kept. This conversation stays private."), "Start another conversation",
lobby card intro "Your Personal Intelligence Layer: what you chose to keep.", landing
card "Your personal record of what helps. Yours to keep, download, and take with you."
VERIFIED in the harness (real initDesk source, stubbed endpoints): quiet accumulation
1→3, keep_private drops the exchange 3→1 and pins ✓ kept private, before-you-go
intercepts once and Stay at the desk returns intact, normal wrap keeps 3 (search detail
included) and lands on the ending with the Moxie route offered, discard ending stays
private, start-another resets clean. One bug caught pre-deploy: the wrap button passed
its click event into renderWrap and forced leaving mode.
NOT verified without JoYi: live Gemini's register under the new prompt.
SHARED SURFACES: none. Draft only, prod untouched.

### 2026-08-14 — PHASES.md: rewritten phase order + walkthrough guardrails (JoYi's bot, STARTED 12:20, STOPPED 12:50 JST)
JoYi called the mess: building ahead of the docs. Full re-read of MEMBERSHIP_ACCESS_PLAN.md
and CONCIERGE_SCOPE.md surfaced a real conflict: today's per-block "Keep this" buttons and
per-reply close question violate the approved PIL consent pattern (2026-08-12: never a save
decision per exchange, quiet accumulation, one review at session end). Phase R1 corrects
this BEFORE the draft goes near prod. FILES: PHASES.md (new), NEXT-SESSION.md (pointer),
WORKLOG.md. Doc only: no build, no deploy, both drafts unchanged. PHASES.md holds the
delineation (landing / lobby / linked rooms / Your Record = the PIL, two stores by design),
seven phases R1-R7 each with governing doc lines, a scope fence, and what JoYi checks vs
does not check, plus an out-of-fence log so mid-phase discoveries wait their turn.
SHARED SURFACES: none.

### 2026-08-14 — The desk closes, and what it produced can be kept (JoYi's bot, STARTED 10:40, STOPPED 11:45 JST)
JoYi walked the draft and found the real defect: saving was gated entirely on the model
choosing to emit a twelve-word `card`. Her tiredness conversation produced a
womenshealth.gov walkthrough and no card, so no "moments set aside" line ever appeared,
nothing could be saved, and Your saved things stayed empty. The walkthrough itself, the
most useful thing the desk made, had no save path at all. The desk also re-offered the
choice menu after delivering, so a session had no ending.
FILES: member-auth.js (desk keep controls, close line, richer pending entries, saved-card
detail rendering, banner copy), netlify/functions/member-onboarding.mjs (save_cards accepts
a card that carries its detail, bounded and sanitized server-side),
netlify/functions/concierge.mjs (CLOSING rule + porch override), assets/member.css,
assets/member-auth.bundle.js. Busters: member.css v10, bundle v8.
WHAT CHANGED: (1) Keep this sits on each thing the desk produces, the next step, the search
walkthrough, the resource list, so keeping is hers, not the model's. Model-written cards
still accumulate as before. (2) A kept entry can carry the thing itself: the query, the
trust note, up to 6 steps, or up to 8 resource links. Server bounds every field and only
accepts http(s) hrefs. The lobby renders it back, so the search she kept is the search she
gets. (3) The desk closes: after nextStep, searchHelp, or results the model sets choices
and quickReplies to [] and names what she has, and the UI asks JoYi's line, "Would you like
to keep any of this for your PIL?". (4) "Take the welcome conversation" is now "Start".
PORCH UNCHANGED AND STILL HONEST: the CLOSING rule is explicitly overridden in porch mode,
which keeps nothing and must never mention keeping, saving, or a record.
VERIFIED in a scratchpad harness running the real initDesk and initSavedCards source with
/concierge and /member-onboarding stubbed, replaying JoYi's exact failure: the walkthrough
is keepable, the close appears, the menu does not come back, the wrap-up saves the query
plus all three steps, and all three kinds (search, plain card, resources) round-trip into
the lobby with links carrying target=_blank rel=noopener. Removing a detail card still
removes cleanly. No horizontal overflow at 1161px or 375px.
NOT verified without JoYi: live Gemini actually honoring the CLOSING rule. That is her
walkthrough, and it is the one thing to watch.
OPEN QUESTION FOR JOYI: naming. The desk now says PIL, the lobby card says Your saved
things, and the member map says Your Record. Three names for one thing.
SHARED SURFACES: none. No schema, no env, no Stripe. Draft deploy only.

### 2026-08-14 — Saved things in the member lobby, with a Remove that really removes (JoYi's bot, STARTED 09:10 JST, STOPPED 10:05 JST)
JoYi's GO on the outline. The lobby card that said "Rolling out" now shows what the
Villager actually kept. Backend already saved cards (member-onboarding action
save_cards); nothing read them back. FILES: netlify/functions/member-onboarding.mjs
(GET and POST now return savedCards newest-first; new action remove_card),
netlify/functions/member.mjs (card markup), member-auth.js (initSavedCards renderer),
assets/member.css (appended saved-cards block), assets/member-auth.bundle.js (rebuilt).
Cache busters: member.css v8 to v9, member-auth.bundle.js v6 to v7, in login.html +
member.mjs + member-welcome.mjs.
REMOVE IS A REAL DELETE: the entry is filtered out of record.savedCards and the record
is written back. Not hidden, not tombstoned. One confirm step ("Remove this for good?"
Remove / Keep it), no undo after, because there is nothing left to undo from. Card text
is unique per record (save_cards de-dupes on text), so no id migration was needed for
cards saved before today. Copy states the boundary: removing a card does not change what
the Concierge remembers; that control is Phase 5.
States: empty (names where saved things come from), list (5 most recent, Show all N),
count pill, and an unavailable state that says nothing has been removed.
VERIFIED in a scratchpad harness running the real initSavedCards source against the real
member.css and the real card markup, fetch stubbed: newest-first order, remove deletes
the right card and decrements the count, removing everything lands on the empty state and
survives a re-read, toggle appears above 5 and disappears at 5, failed remove restores the
full row with a working Remove and leaves the count truthful, no horizontal overflow at
1161px or 375px. Two bugs the harness caught and fixed before deploy: the confirm handler
still passed the old argument shape so remove_card posted no text at all, and a failed
remove wiped the card text off the row with no way back.
NOT verified without JoYi: the live Identity-authenticated round trip (walkthrough).
SHARED SURFACES: none. No schema, no env, no Stripe, no concierge.mjs. Draft deploy only.

ANSWER for Gabby's bot (Supabase Site URL, open since 08-11): Practice Village auth does
NOT run on that Supabase project. The Village uses Netlify Identity end to end (invite,
login, roles, member routes), and member records live in Netlify Blobs. So the
http://localhost:3000 Site URL is Moxie's alone to set and is not a Village launch bug.
The service-role-only question on classes/signups/notify_subs is still JoYi's to answer.
STILL OPEN FROM YOUR SIDE, surfaced to JoYi this morning: Moxie member door destination,
Devpost draft state + team roster + entry name, the master checklist, and whether the
Gemini API alone satisfies "one Google Cloud product" or something must run on Cloud Run.
Deadline is Sunday Aug 17 1:00 PM PT.

### 2026-08-13 NIGHT — THE SWAP shipped to prod (JoYi's bot, STOPPED 23:55 JST)
PROD (thepracticevillage.org, commits 0a9aef7..7c11748): Safety Hall live at
/safety-hall (all 4 files + safety-controls.js, palette-bridged, room card open,
JoYi walked the checklist). Phase 2 member lobby = the Village map (public visual
language, truthful doors, Moxie unlinked until the member destination is confirmed).
THE SWAP: full Concierge at the member desk (/welcome desk-first; onboarding is an
invitation banner, never a gate), consented member notes feed the prompt, wrap-up
saves cards to the member record (member-onboarding action save_cards). Landing =
the porch: real Gemini, choice menu + quick replies, but lookups/searchHelp/cards
are member-only, six-exchange cap, light-funnel handoff; identity enforced server-
side (spoofed member mode verified = porch, on prod). TOPIC GUIDANCE in the brain
(money/housing/work/caregiving/stuck/body) incl. honest behavior-as-driver for
weight, no diet framing, and NEVER-ASSUME-LIFE-STAGE rule (rebuilding happens at 25
and 75). Porch honesty on the landing page: record layer removed, "porch saves
nothing" bullet, porch label on the demo card. No-orphan text-wrap in member area.
FOR GABBY: concierge.mjs now imports _shared/membership.mjs; member modes require
a live Identity token. SENDGRID_WEBHOOK_SECRET on this site is wanderpack residue,
unused here (JoYi deleting). Phase 4 still needs the real Moxie member destination.

### 2026-08-13 — Landing page warm-palette restyle from JoYi's reference mocks (JoYi's bot, STARTED 19:30, STOPPED 20:05 JST)
RESULT: DONE locally, commit d586b66 on main, NOT pushed, NOT deployed — awaiting
JoYi's preview approval. Full-page desktop + mobile QA passed (no horizontal
overflow, all sections re-toned, hero matches the mock, logo center dot = CTA
orange #A84214). Cache-buster bumped styles.css?v=94.
UPDATE 20:50 JST: botanicals restored per JoYi (they were in the mock + old live hero).
Extracted from the reference mock: hero branch + dried-flower cluster (transparent
PNGs, assets/flora-branch.png + flora-cluster.png) and golden grasses riding a new
CSS wave divider above the footer (assets/flora-grass.png + .prefooter block).
styles.css?v=95. Still local only, no push/deploy.
UPDATE 21:15 JST: JoYi rejected that pass (washed-out ghosts, not the reference).
Redone properly: the tall gold leaf sprays were extracted from MoxieStudiosHeader.png
(1122x1402 source, local-contrast keyed off the dark ground, baked in gold, bbox
trimmed) and now frame the hero left and right like the reference card.
flora-branch.png + flora-cluster.png DELETED. Also fixed the nav clipping JoYi
screenshotted: breakpoints cannot predict it (visitor font size / zoom / min-font
setting change the row width), so script.js now measures the row and falls back to
the menu button via .is-crowded. Verified by forcing oversized nav type: collapses
cleanly, menu opens, zero page overflow. styles.css?v=97, script.js?v=38.
FINAL 20:10 JST: room card titles darkened (serif 400 with no explicit color was
washing out on the cream cards; now var(--ink) at 600). styles.css?v=98.
SHIPPED on JoYi's go: pushed fefe70d..ad9a641 to gabriellaflowers6-pixel/practice-village
main, then `netlify deploy --prod --dir . --site aae16881-...` (deploy
6a7da580381b8371bda03dfc). LIVE VERIFIED on thepracticevillage.org: styles.css?v=98 +
script.js?v=38 + all four new assets serve 200, body cream #FBF3E8, CTA #A84214, room
titles #2B2013/600, logo dot orange, zero broken images, zero horizontal overflow;
/, /moxie-studio/, /login, /privacy, /terms all 200; POST /concierge answers (its
input validation, so the Gemini gate is alive); all 6 functions report deployed.
NOTE for Gabby's side: the deploy rewrote the tracked generated file
.netlify/netlify.toml to this machine's path; restored, not committed. That file is
in .gitignore but still tracked, so it will keep flip-flopping between machines until
someone runs `git rm --cached .netlify/netlify.toml`.
UI ONLY, landing page. New palette from "TPV header example.png" + "MoxieStudiosHeader.png"
(Downloads): warm cream ground, deep chocolate brown dark panels, metallic gold accents,
deeper burnt orange CTAs (#A84214), navy kept for the Practice Village wordmark; logo
center dot becomes the button orange. Hero window art swaps to a room-photo crop
(new assets/moxie-room.jpg). Copy, structure, links unchanged. Appending a token-override
layer at the bottom of styles.css per house rules.
FILES: index.html, styles.css, assets/moxie-room.jpg (new), WORKLOG.md.
NOT touching: member-auth.js, assets/member-auth.bundle.js, assets/member.css,
netlify/functions/* (another session is live on onboarding there), moxie-studio/.
SHARED SURFACES: none (no schema, no env, no functions). No push/deploy until JoYi
approves the local preview. NOTE: could not post this entry to the shared Drive worklog —
this session's Drive connector is create/read only; entry is here instead.

### 2026-08-13 — LAUNCH: thepracticevillage.org is live (JoYi's bot, STOPPED 21:10 JST)
DOMAIN LIVE. thepracticevillage.org (apex + www, Let's Encrypt cert issued) and
thepracticevillage.com pointed at the same Netlify site. Squarespace parking presets
deleted on both, email security TXT records preserved. Netlify site aae16881: custom
domain + 3 aliases. CLI deploys only (no repo connected).
PROD SHIPPED (commits 7aedb4b..4d0516f):
- Checkout live: Founding Villager $149/yr + Membership $15/mo, both verified.
  Pricing model corrected: $15 rises to $25 at Feb 7 2027 opening and $25 becomes the
  member's locked founding rate; annual $149 locked for life; new-member rates TBD.
  Stripe product description matches the page.
- CONCIERGE LIVE ON THE ENTRY DOMAIN (the Gemini gate). Verified on prod: reflection +
  choice menu + quick replies, and a Tier 2 lookup returning real HUD-certified
  counselors for 96720 (Legal Aid Society of Hawaii, Hawaiian Community Assets) with
  no sales pitch attached. Gemini paid tier active (free tier was 20 req/day/model).
- Copy: builders section tells the entry story (agent-first, Bott Om trained ground-up
  with human review, two builders using Gemini/Claude/Codex); JoYi bio updated IN its
  own section (a duplicate under builders was removed); WhatsApp porch removed; banned
  filler swept; The Practice Center added to the footer.
- REBUILD ARC new canon: Arrive/Notice/Connect/Practice/Explore/Choose as tap-to-read
  pills (3+3), four week pills (2x2, no orphan), all logistics folded behind a
  disclosure. First series Oct 31 + Nov 7/14/21, 3pm Central, 90-min Zoom. Voucher:
  registering consumes it, 48h cancellation keeps it, Founding Villagers get a second
  for Q1 2027.
- Responsive: nav fits at 125% zoom laptop widths, sticky pill never wraps, headings
  use text-wrap balance so no word stands alone.
STILL OPEN: Safety Hall deploy (built, needs font reconciliation Fraunces vs the site's
Cormorant Garamond), evidence pack, demo video, Moxie Studios plural sweep on the
zen-bott-om canonical landing (Gabby's side).

### 2026-08-12 NIGHT CLOSE (JoYi's bot) — Concierge v2 SHIPPED to repo, prod has checkout
PROD (practice-village.netlify.app): Stripe checkout LIVE both plans, honest CTAs,
Moxie Studios plural, /concierge function deployed (page toggle OFF pending JoYi's
final tone pass; latest draft has it ON with the full spec conversation).
CONCIERGE v2 (commits ed44d54..539f2bd): MVP-spec conversation (reflect + question +
choice menu), quick-reply taps, understand-arc that NAMES the pattern then offers
action/resource, routes ONLY at resolution moments (code-enforced), HUD + FDIC zip
lookups live, dating-safety = NSOPW/reverse-image/FTC walkthrough WITH the refusal,
PIL consent = ONE wrap-up review at session end (JoYi rule: never per-exchange).
Adversarial battery 10/10 on paid tier.
GEMINI: paid tier ACTIVATED on Default Gemini Project (free tier = 20 req/day/model,
verified; this was today's mystery outage). GEMINI_BACKEND=aistudio, model
gemini-flash-latest, thinkingLevel LOW (adaptive thinking truncates JSON).
TOMORROW: JoYi launches thepracticevillage.org (primary; .com also owned; Moxie =
subdomain/path). Then: tone pass -> prod flip of live Concierge, Safety Hall deploy
(font reconciliation: Fraunces vs site Cormorant), evidence pack.
STOPPED for the night. No servers running. Working tree clean.

# Practice Village — Work Log

Repo created 2026-08-11 by importing the live practice-village.netlify.app deploy
(no repo was connected to the Netlify site; source did not exist on this machine).
Deploys: `netlify deploy --prod --dir .` to the `practice-village` Netlify site,
only with JoYi/Gabby's OK. First commit is the as-deployed baseline; diff against
it to see every change.

---

## 2026-08-12: Concierge goes live on Gemini — STARTED ~13:30 JST (JoYi's machine)

IN PROGRESS. Building the real Concierge: Netlify function (netlify/functions/
concierge.mjs, NEW) ported from the proven Moxie coach pattern (env-switchable
AI Studio / Vertex), netlify.toml (NEW: functions dir + /concierge redirect),
free-text input added to the demo card, script.js wired to POST /concierge.
System prompt enforces the June scope guardrail (reflect, next question, route
to rooms; never claim benefits/forms/legal/medical). SHARED SURFACE: Netlify
site env (GEMINI_* vars) on practice-village.
UPDATE 15:40 JST: Scope doc CONCIERGE_SCOPE.md written (rooms x tiers x pipeline), JoYi GO.
Shipping the approved storefront to PROD first: Stripe links wired (Villager $149/yr
plink_1U3SBE2ZVkTQmuLQcHdmQ7s9, Membership $15/mo plink_1U3SHI2ZVkTQmuLQc8dFuGso),
CTA labels made honest (pill "See the founding offer", nav "Join the Village"),
Moxie StudioS plural sweep on OUR index.html (paths untouched; /moxie-studio/ page is
Gabby's canonical, needs the same sweep in zen-bott-om landing/). Live ask-row FLAGGED
OFF (CONFIG.liveConcierge=false) pending the spec rebuild. /concierge function deploys
(Gemini, aistudio backend; NOTE: Vertex API was enabled on project 674224384184 but
needs billing; JoYi decided NO VERTEX, Gemini API + Google TTS instead).
ANSWER for Claude (Gabby's bot): "Moxie Studios" PLURAL IS OFFICIAL (JoYi 2026-08-12).
Also: your live /coach 500s look like the same Vertex-not-enabled/billing failure family; key works on aistudio.
STOPPED 17:35 JST, spec rebuild BUILT + one hard finding. DONE: /concierge v2 per
02_MVP spec (reflection + next-best question + CHOICE MENU she picks; nextStep only
after she chooses an action; consent-led saves; server-resolved routes). Tier 2 live:
HUD counselors + FDIC banks by zip (free official APIs, zippopotam geocode, source +
date on results). Tier 3 live: searchHelp (exact query, .gov trust note, process
steps; dating safety = NSOPW/reverse-image/FTC walkthrough, never a check). Guards:
no-sell (doors never offered on hardship, deterministic), banned-claims scrub, em-dash
strip, 12s gemini timeout, 429-aware retry, thinkingLevel LOW (adaptive thinking was
truncating JSON, the PlantLuck failure). UI: one live conversation, chips seed it,
scripted theater retired. CONCIERGE_SCOPE.md = the approved rooms-x-tiers spec.
THE FINDING: **Gemini free tier = 20 requests/day/model** (verified quota violation
GenerateRequestsPerDayPerProjectPerModel-FreeTier, limit 20). Today's testing consumed
it; lite model 503s under load. All flows verified working while quota allowed.
**The Concierge cannot launch on free tier. Needs AI Studio paid tier (~$0.001/turn).**
FOR GABBY: your live /coach on moxiestudio very likely dies the same way, 20/day.
FILES: netlify/functions/concierge.mjs, script.js, index.html, styles.css,
CONCIERGE_SCOPE.md, WORKLOG.md. Draft (not prod): 6a7c4fea599a3b688143e1f2--.
PROD earlier today: checkout live (both Stripe links), honest CTAs, Moxie Studios
plural, /concierge v1 deployed with page toggle off.
 FILES: netlify.toml,
netlify/functions/concierge.mjs, index.html, script.js, WORKLOG.md.

---

## 2026-08-12: Checkout goes LIVE — Stripe wired, CTA consistency pass — DEPLOYED

STARTED ~12:30 JST, JoYi's machine (repo cloned here today; joyirhyss-tech
invitation accepted). Shipped on JoYi's "go" after 5 review drafts.

- Stripe payment links created in the AIdedEQ dashboard (live mode), driven in
  JoYi's browser session with her at the wheel:
  - Founding Villager $149/year: plink_1U3SBE2ZVkTQmuLQcHdmQ7s9
  - Practice Village Membership $15/mo: plink_1U3SHI2ZVkTQmuLQc8dFuGso
  - Both wired into script.js CONFIG (stripeVillager, stripeMembership).
  - Gotcha logged: a mistranscribed link (O read as 0 from a screenshot) still
    returns HTTP 200 on Stripe's "not found" page. Verify payment links by
    reading the URL from the dashboard DOM and loading the checkout in a real
    browser, never by status code.
- CTA consistency pass (JoYi's rule: words match the action):
  - Sticky pill button relabeled "Take a founding seat" -> "See the founding
    offer" (it scrolls to #doors; the label now says so).
  - Nav CTA "Get started" -> "Join the Village".
  - Full-page link audit: verbs act, nouns point; no other mismatches.
- FILES: script.js, index.html, WORKLOG.md, NEXT-SESSION.md.
- Old $97 / $19 payment links: JoYi deactivating in the dashboard (new links
  exist; deactivation does not affect existing subscribers).
- STOPPED ~13:20 JST, DEPLOYED to production: deploy 6a7be8cbe63997bf49a7431c. Verified live:
  nav CTA, pill label, 2 stripe links in script.js, zero $97/$19, /moxie-studio/ 200,
  both checkouts load real products.

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

**11:31pm round:** one mark sitewide, JoYi's pick: deep amber center (#C9862B), navy
dots (#1A1A4E), identical in nav, demo avatar, and footer (footer's sits on a cream coin
so navy reads on dark); favicon now amber with navy PV; the big multicolor bloom above
One Center is gone. Builders box text left-aligned and fills the box. Concierge closing
line breathes 54px below the demo. Gifts: intro line removed, header on one line with
tightened head margin. RAW box redone: left-aligned, six numbered step chips in a row,
phil and when lines full width. styles v76 to v77. Verified by DOM: 3 marks all
amber/navy, bloom gone, intro gone, one-line header, 6 step chips, no overflow.

**Hero resolution (11:35pm, JoYi: does this look high-end?):** honest answer was no,
three balance failures. Fixed: window frame and sign are now one mounted unit (frame
bottom radius/border removed, plaque takes the same 10px wood border and full frame
width, zero gap, verified 0px/0px by rect); the figure fills the glass (104% width,
wider mask, no hard side gutters); hero columns center vertically so the section ends
evenly (symmetric overhang, was 200px one-sided). styles v77 to v78.

**Final hero fix (11:39pm):** the transom bar cut the figure's neck once she filled the
glass; the bar lost. Window is one tall arched pane, figure whole at 96% width, head
clear under the curve. styles v78 to v79.

**Done well (11:47pm, approved first):** headline is "Your digital community center." at
clamp(2.2rem,4.7vw,3.6rem); "women" count in the hero is exactly 2 (chip targeting +
canon lede). The image's top band (with the glow-mode chip) cropped out of the source
PNG; arch snugged to 10/9.7 so her head clears the curve by ~67px. styles v79 to v80.

**JoYi caught the arch seam (11:52pm):** the image's top edge still drew a straight line
across the glass. Fixed in the source PNG, not CSS: alpha fade over the top 22% (power
curve) and 6% side fades, so the room dissolves into the arch shadow with no seam.
styles v80 to v81 (cache-bust only).

## SESSION CLOSE 2026-08-11 (~midnight)

Repo now lives at github.com/gabriellaflowers6-pixel/practice-village (private,
joyirhyss-tech invited with write). All work committed and pushed through the
cache-bust commit.

DEPLOY STATE: the live site (practice-village.netlify.app) is still the 10:41pm deploy
(6a7aecba, flip-fix). Everything after — one-door checkout logic, Studio page review,
Village review, email field, window hero with the Moxie sign, Concierge unit with
researched questions, six rooms (Your PIL + Cur.AI.ted), RAW block, one amber/navy mark,
all of JoYi's punch-list rounds — is committed and on GitHub but NOT DEPLOYED. Deploy
with: netlify deploy --prod --dir . --site aae16881-7774-4d75-a7f2-6065e8c2e45d
(only with an explicit OK).

Local preview: python3 -m http.server 8742 from the repo root (server was stopped at
close). NEXT-SESSION.md has the handoff.

