# Practice Village — Session Handoff (written 2026-08-14, ~02:00 JST)

## Read first, every session
1. Read the shared bot worklog BEFORE any task: Google Doc `1l72hQDZR0AeamW16ECULzvtzT3JO7g0RF35KVfw7Hv0`
   (Gabby's bot tab = hands-off files; write only in JoYi's tab; the Drive connector can read but
   not edit it, so mirror entries in this repo's WORKLOG.md, which both bots read).
2. One source of truth for product rules: MEMBERSHIP_ACCESS_PLAN.md. Phase order and
   walkthrough method: PHASES.md (2026-08-14, supersedes the audit's sequencing).
   Concierge architecture: CONCIERGE_SCOPE.md. Read ALL THREE fully before building;
   the PIL consent pattern in CONCIERGE_SCOPE.md is binding on any save/keep UI.
   One phase at a time, JoYi checkpoint per phase, DO NOT SKIP.
3. JoYi is the director: outline → her GO → build → draft deploy → her walkthrough → prod.
   Never invent links: unconfirmed destinations stay labeled unavailable.

## Where everything is
- Repo: gabriellaflowers6-pixel/practice-village, branch main. Local checkout:
  /Users/jkr/Documents/ALL Build Projects/practice-village (Desktop/ALL Build Projects is a
  SYMLINK to the same place). Old folders "Practice Village" and gatherwell-landing = retired
  source, never deploy from them.
- Netlify site aae16881-7774-4d75-a7f2-6065e8c2e45d, NO repo connected: CLI only.
  Draft: `netlify deploy --dir .`  Prod: `netlify deploy --prod --dir .`
- LIVE: https://thepracticevillage.org (+.com, www). Member area: /login, /member (lobby),
  /welcome (the desk; onboarding via ?onboarding=start|review). Safety Hall: /safety-hall.
- member-auth.js is bundled: edit it, then `npm run build` (writes assets/member-auth.bundle.js),
  bump ?v= busters in login.html + member.mjs + member-welcome.mjs.

## What is live (do not re-litigate)
- Checkout: Founding Villager $149/yr (locked for life) + $15/mo (rises to a LOCKED $25 when all
  rooms open Feb 7 2027; new-member rates TBD). Stripe descriptions match.
- THE SWAP: landing Concierge = the porch (real Gemini, choice menu + quick replies, NO lookups/
  searchHelp/cards, 6-exchange cap, light-funnel handoff, keeps nothing and says so). Member desk
  at /welcome = FULL brain (lookups, walkthroughs, consented memory, wrap-up saves to record).
  Identity-enforced server-side; spoofed member mode = porch.
- Concierge brain: gemini-flash-latest, aistudio backend, paid tier, thinkingLevel LOW (never
  thinkingBudget). TOPIC GUIDANCE for money/housing/work/caregiving/stuck/body: honest about
  behavior as a driver (never timid), no diet/calorie framing, NEVER assume life stage, guardrails
  battle-tested (no forms, no checks, no legal/medical, crisis 988/DV once, dating safety =
  NSOPW/reverse-image/FTC walkthrough with the refusal).
- Membership machine: Stripe webhook → Netlify Blobs record → Identity invite (invite-only) →
  /login → lobby. Onboarding = optional invitation banner on the desk, never a gate.
- Rooms: JoYi's six banners head cards on BOTH maps; open rooms have front-face doors; all Moxie
  links open the LIVE https://moxiestudio.netlify.app/ landing (our /moxie-studio/ copy is
  unlinked); PlantLuck labeled best-on-phone; Safety Hall live and linked everywhere.

## Immediate queue (Phase 4 remainder, then 5-7)
1. HUSH room build — BLOCKED on JoYi's v1 contents list (app + which resources).
2. cur.AI.ted starter — BLOCKED on JoYi's definition of starter access.
3. Moxie member door — BLOCKED on Gabby (never substitute the marketing page).
4. Saved-cards display in the lobby ("Your saved things" backend already saves via
   member-onboarding action save_cards).
5. Phase 5 account controls, Phase 6 reliability (uptime checks, reCAPTCHA monitor-only,
   never log conversations/zips/tokens), Phase 7 final pass (copy standard, a11y, no orphans).

## SUBMISSION — the real critical path (deadline Sun Aug 17 1:00 PM PT; Gabby travels ~16th)
- Demo video <3 min, public YouTube, own/royalty-free music. Best scene: visitor meets porch →
  joins → same door → full brain + rooms.
- Evidence pack: revenue by month May-Aug (related-party separate), users + testimonials, API
  usage records, AI-native-operations file (Roo digests, ops board, pose-model accept/reject).
- From Gabby: Devpost draft state + team roster + entry name; master checklist; her answer on
  whether Gemini API alone satisfies "one Google Cloud product" (Vertex retired; billing link
  granted free Cloud Run/Storage if a second surface is wanted).
- Judge access: comp/test membership path exists (test_member role); document it.

## Gotchas that cost time before
- Screenshots of backgrounded Chrome windows return stale/ghost frames (IntersectionObserver
  throttle): verify by DOM measurement, not pixels. Playwright MCP is clean for public pages.
- JoYi browses at 125% zoom: effective ~1161px on a 1470 window. Design to it.
- Free Gemini tier = 20 req/day/model (fixed by paid tier; don't burn requests in test loops).
- Netlify env:set needs the repo linked (it is); env list has JoYi cleanup items: a var whose
  NAME is an AIza key (delete + rotate) and SENDGRID_WEBHOOK_SECRET (wanderpack residue, unused).
- magick + sips available for images; assets/rooms/*.jpg are the six JoYi banners (masters in
  ~/Downloads: MS/Plant/HUSH/SafetyHall/cur.AI.ted/PIL.png).
