# Practice Village Build Phases

**Written 2026-08-14. Supersedes the phase sequencing in AUGUST_13_SESSION_AUDIT.md.**
Product rules stay where they live: MEMBERSHIP_ACCESS_PLAN.md is the contract,
CONCIERGE_SCOPE.md is the Concierge architecture, the live site controls on conflict.
This file is only the order of work and the method for walking through it.

---

## The method (guardrails, applied to every phase)

1. **One phase at a time.** A phase runs outline, JoYi's GO, build, draft deploy,
   JoYi's walkthrough, then prod. No phase starts before the previous one ships
   or JoYi parks it.
2. **Docs before build.** Every phase names the document lines that govern it before
   any code is written. If no document covers the work, the document line is written
   and approved first. Building without the governing line is what makes things messy.
3. **A scope fence per phase.** Each phase lists the files it may touch. Anything
   discovered outside the fence gets logged at the bottom of this file, not fixed.
4. **The walkthrough contract.** Each phase states what JoYi checks and what she does
   not check. Observations during a walkthrough are recorded in reported order and
   fixed after, not live, unless one blocks the next checkpoint.
5. **One name.** Your Record is the Personal Intelligence Layer. Membership surfaces
   say the full name once so a Villager learns it. The landing page says it plainly:
   your personal record of what helps, yours to keep, download, and take with you.
   "Your saved things" is retired.
6. **The copy standard applies to every string** (MEMBERSHIP_ACCESS_PLAN.md, Copy
   standard section): direct, clear, kind; no em dashes; no orphaned display words;
   no words that do not help her understand, decide, or act.
7. **Links tell the truth.** A live link opens the working thing. An unconfirmed
   destination is labeled before she clicks. No invented links, ever.
8. **The copy gate.** No phase reaches draft deploy until every new or changed string
   is read against the copy standard, and the walkthrough note lists every new string
   in one place. Plain language, first person, specific enough to act on, no therapy
   voice. "Heaviest," "pressure point," and their whole family of polished AI language
   are banned. Nobody walks up to a front desk and performs insight; she says
   "I need help with housing," and the system helps.

---

## What lives where (the delineation)

**Landing page (public):** explains and previews the Village. The porch Concierge
(unsaved, capped, honest that it keeps nothing). The Village map with truthful labels.
Free tools: HUSH sixty-second app, Safety Hall, Charter List. The three ways to enter.
Nothing here saves to a Record.

**Member lobby (signed in):** the working Village. The front desk (full Concierge),
Your Record, voucher and live-event status, the member Village map, account controls.
No marketing, no pricing, no join language.

**Linked through the lobby:** the rooms. Each room card opens the working member
experience or says plainly that the door is still being connected. Safety Hall opens
inside the Village. The Kitchen and HUSH open in new tabs so the Village stays open.

**Your Record (the Personal Intelligence Layer):** everything she chooses to keep.
Two stores by design, one idea:
- What she keeps from the Village travels with her membership (server side, hers to
  read, download, delete).
- What she documents in Safety Hall stays on her device and is never uploaded
  (MEMBERSHIP_ACCESS_PLAN.md, Access and payment rules: becoming a member never
  uploads Safety Hall records; moving anything requires a separate, specific choice).
  Members do not lose the local tool by becoming members; the same mechanism is
  available inside the membership.
- Both are downloadable. Download is assembled in the browser and saved to her
  device, the way Safety Hall already builds its files. Nothing new is sent anywhere
  to make the file.

---

## Phase R1: The Record captures the way the scope says

**Status: SHIPPED 2026-08-14. JoYi walked the draft; the save-read bug and the
duplicate Record card found in that walkthrough were fixed and re-walked; her GO
sent it to prod.**
**Governing lines:** CONCIERGE_SCOPE.md, PIL consent pattern (2026-08-12): never a
save decision per exchange; candidates accumulate quietly; one review at session end;
Keep this private available as an interrupt. MEMBERSHIP_ACCESS_PLAN.md member lobby
list. JoYi's naming ruling (2026-08-14, this file, guardrail 5).

Work:
1. Everything the desk produces (next step, search walkthrough, resource list, and
   the Concierge's own cards) accumulates quietly as candidates. No per-block Keep
   buttons, no per-reply save question. A soft counter at most.
2. The wrap-up review shows everything the visit produced, each item checkable.
   She keeps what she keeps.
3. A before-you-go moment: leaving for the lobby with candidates pending offers the
   review once. Never a gate.
4. Keep this private stays available at any moment as an interrupt.
5. Naming sweep: Your Record in the lobby card and desk copy; full name taught once
   in the lobby; landing room card says the plain-language line; map card updated.
6. Kept entries keep carrying their detail (query, steps, links), rendered in the
   Record, removable with one confirm. That part of today's build stands.
7. The ending (JoYi walkthrough, 2026-08-14): after the wrap-up review, the desk
   shows what was kept and where she can go: back to the lobby, the room this
   conversation routed to when there is one, or start another conversation. She
   chooses; nothing auto-navigates. Keep nothing gets the same ending without the
   confirmation.
8. The copy sweep (JoYi picks, 2026-08-14, verbatim): opener on desk and porch is
   "What do you need help with this week?". Chip sends: Money "I need help with
   money.", Housing "I need help with housing.", Work "I need help with work.",
   Family "I need help with a family situation.", I feel stuck "I don't know what
   to do.", My body "Something doesn't feel right with my body." Model register
   example: "Money is the problem right now. We don't have to solve everything
   today. Let's start with what needs attention first." Heaviest and pressure point
   die on every surface, prompt included.

Scope fence: member-auth.js, assets/member.css, netlify/functions/member.mjs,
netlify/functions/member-welcome.mjs, netlify/functions/member-onboarding.mjs,
netlify/functions/concierge.mjs (prompt only), index.html (Record card + Record FAQ
naming + porch copy hooks only), script.js (copy strings only, JoYi authorized
2026-08-14), cache busters.

JoYi checks: the desk conversation end to end, the quiet accumulation, the wrap-up
review, the before-you-go moment, the Record card in the lobby, every new string.
JoYi does not check: storage internals, auth, bundle mechanics, responsive internals.

## Phase R2: The Record downloads

**Status: SHIPPED 2026-08-14. JoYi walked the draft; PDF title changed to My PIL on
her ruling; her GO sent it to prod.**

**Governing lines:** MEMBERSHIP_ACCESS_PLAN.md member lobby list (export control);
Release boundary item 4; the delineation section above; JoYi's format ruling
(2026-08-14): two formats, exactly.

Work: a Download control on the /record page.
1. A Markdown file, built like a second brain: readable headings, each kept thing
   with its date, searches with their steps, resources with their links. Built in
   the browser from what is already on screen, nothing new sent anywhere.
2. A neat PDF with Practice Village information in the footer of every page.
   Composed from her record only; no third-party service ever sees it.

JoYi checks: both files read clean and complete, the Markdown pastes where she would
take it, the PDF looks like something she would hand a therapist, the footer says
Practice Village. Does not check: file-generation code.

## Phase R3: The HUSH room

**Status: SHIPPED 2026-08-14. Shelf list approved with JoYi's Moxie addition; room
copy is JoYi's verbatim; her GO sent it to prod.**

**Governing lines:** MEMBERSHIP_ACCESS_PLAN.md (additional HUSH mindfulness apps and
resources as they open); AUGUST_13_SESSION_AUDIT.md product rule 7 (HUSH is the room
and the app); CONCIERGE_SCOPE.md HUSH tier list: UCLA MARC, Palouse Mindfulness,
Healthy Minds Program, NIH and NCCIH evidence pages, VA mindfulness apps, and the
exclusion rule: any platform whose free tier exists to sell a subscription is not
routed.

Work: the member HUSH room page holding the sixty-second app plus the vetted shelf.
Every resource entry carries organization, what it is good for, its limits, cost,
and review date, the same honest shape as safety-resources.js. Every URL fetched and
verified before it ships. The shelf list goes to JoYi for approval before the page
is built around it.

JoYi checks: the shelf list first (separate GO), then the room page, entry language,
and every link. Does not check: resource data structure.

## Phase R4: The remaining doors

**Governing lines:** audit Phase 4; guardrail 7.

Work, each when its destination is confirmed, honestly labeled until then:
1. cur.AI.ted starter access (needs JoYi's definition of what starter access is).
2. Moxie Studios member door (needs the confirmed member destination).
3. Consistent return navigation from every room, internal and external.

JoYi checks: each confirmed link and what a Villager sees on arrival. Does not
approve placeholders.

## The lobby phases (added 2026-08-14, governed by MEMBER_LOBBY_PRD.md)

### Phase L1: My Practice

**Governing lines:** MEMBER_LOBBY_PRD.md, "My Practice: JoYi's copy spec" (the build
contract, her words verbatim) and the core language rule.

Work:
1. The My Practice card beside the front desk: List | Week views, default List,
   her view choice remembered on her record. List groups Today / Later this week /
   Ongoing.
2. Plan items on the member record: title, optional Village link, rhythm, source.
   Added only by her, removable, checkable ("Done for today"), recurring items
   return tomorrow. No history kept.
3. One-click adds: HUSH room ("Add HUSH daily"), the Kitchen map card (assumption:
   "Add PlantLuck daily", JoYi to confirm the string), /record entries ("Come back
   to this" with Tomorrow / This week / Choose a day).
4. In the Village subsection inside the card: Rebuild Arc and February dates, her
   copy, visually separate from her items, optional Add to My Practice.
5. Add to my calendar on every item: a calendar file downloaded to her device,
   nothing synced back.
6. Layout: voucher card moves below the rooms, Coming up card retires.

Scope fence: member-auth.js, assets/member.css, netlify/functions/member.mjs,
netlify/functions/member-practice.mjs (new), netlify/functions/member-hush.mjs,
netlify/functions/member-record.mjs (page hook only), cache busters.

JoYi checks: every string against her spec, the empty state, both add flows, the
List | Week toggle, the In the Village separation, Done for today behavior, one
calendar file landing on her phone, remove. Does not check: storage schema or
calendar-file internals.

### Phase L2: the desk trade

**Governing lines:** MEMBER_LOBBY_PRD.md spec: desk ending "Anything here you want
to come back to?"; plan context joins the member desk prompt with the same consent
as member notes; the outward instruction uses JoYi's approved register and speaks
only of what she scheduled, never of what she did. Porch sees nothing.

### Phase L3: Moxie path add

Waits on the Moxie member door. "Want the 30-day Moxie path in My Practice?" No
automatic enrollment.

## Phase R5: Account controls complete

**Governing lines:** MEMBERSHIP_ACCESS_PLAN.md build order 7 and Release boundary:
a member can see how to cancel, export, and delete.

Work: cancellation, export, deletion, recovery, and membership help paths visible
and working from the lobby. Voucher display against membership-year dates.

JoYi checks: language, consent, visible outcomes. Does not check: Stripe events,
role metadata, deletion internals.

## Phase R6: Reliability

**Governing lines:** audit Phase 6, decisions already approved: public uptime checks
first; invisible reCAPTCHA on the public Concierge in monitor-only mode; never log
conversations, Safety Hall records, screenshots, voice, emails, zips, or tokens;
no Cloud Run move for the Concierge, no member data in Firestore.

JoYi checks: one test alert arrives; the public Concierge feels unchanged.

## Phase R7: Final pass

**Governing lines:** audit Phase 7 unchanged, plus: every link on both maps live or
truthfully labeled; the landing, the plans, and the rooms tell one truth; the
Meet your Concierge two-column layout verified on prod.

JoYi performs the final experience walkthrough. Technical checks reported separately
as pass, fail, follow-up.

---

## Out-of-fence log

Items noticed mid-phase go here with a date. They wait their turn.

- (empty)
