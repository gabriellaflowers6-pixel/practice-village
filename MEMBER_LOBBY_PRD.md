# The Member Lobby: PRD Worksheet

**Status: DRAFT for JoYi's markup, 2026-08-14. Becomes the lobby PRD when her answers
land. Governing sources: MEMBERSHIP_ACCESS_PLAN.md (the contract),
AUGUST_13_SESSION_AUDIT.md Phase 2, PHASES.md delineation, CONCIERGE_SCOPE.md.**

## Purpose (the boundary sentence)

The lobby is home base, not a hallway. Every road leads here: sign-in lands here,
every room returns here, every account action starts here. It is the working Village
with no marketing, no pricing, no join language. A Villager should know within one
screen: where she left off, where she can go, what is happening, and where her
account controls live.

## What the contract already promises (MEMBERSHIP_ACCESS_PLAN, Member lobby)

The first version contains, verbatim from the plan:
1. Welcome back
2. Continue where you left off
3. Ask the Concierge
4. Your saved practices and plans
5. Rooms open to you
6. Upcoming live events
7. New in the Village
8. Workshop voucher status
9. Account, privacy, export, and deletion controls

Plus: same visual language as the public site; room links open the working thing or
say plainly they are not ready; the audit adds a real guided orientation (a short
demo-style video is on the table after format and script approval).

## What exists today (verified against member.mjs on prod)

| Contract item | Today | State |
|---|---|---|
| Welcome back | Greeting with first name, plan pill | BUILT |
| Continue where you left off | Nothing | MISSING |
| Ask the Concierge | Front desk card to /welcome | BUILT |
| Saved practices and plans | Your Record room at /record, download live | BUILT (as a room) |
| Rooms open to you | The Village map: 5 open doors, 2 honest waits | BUILT |
| Upcoming live events | One static Coming up card (Oct 31 workshop, Feb 2027) | PARTIAL, static |
| New in the Village | Nothing | MISSING |
| Voucher status | Live card with allowance and membership year | BUILT |
| Account controls | Privacy, Terms, mailto for help, sign out | PARTIAL (R5: cancel, export, delete visible) |
| Guided orientation | Optional welcome conversation banner | PARTIAL (audit wants a real orientation) |

## Best practices from the field, filtered through Village values

From membership-site and community-center research (sources at the bottom), what
actually retains members:

1. **Re-entry beats discovery.** The strongest pattern is a personalized way back in:
   returning members want to continue, not re-orient. This is our biggest gap.
2. **One clear next action for new members.** An orientation path, not a wall of
   tiles. We have the banner; the audit wants a real orientation.
3. **The bulletin board.** A community center lobby always shows what is happening
   this week and what is new. Events with dates, briefly. Our Coming up card is
   static and will rot.
4. **Self-service account controls in plain sight.** Cancel, export, delete without
   hunting builds trust, especially for a membership serving women rebuilding.
   Already scoped as R5.
5. **Level-aware experience.** Founding Villagers and monthly members see the same
   Village, with founding recognition where it belongs. The contract promises an
   optional name in the Village lobby for Founding Villagers; nothing exists yet.

**What the field does that the Village refuses:** engagement streaks, usage
analytics shown to the member, gamification, upsell modules inside the member area,
"we miss you" pressure. HUSH has no streak on purpose; the lobby follows the same
ethic. Nothing on the lobby measures her. Personalization draws only on what she
explicitly saved (contract line, non-negotiable).

## Assumptions (correct me)

A1. The lobby stays one page. Rooms are pages; the lobby is the hub.
A2. Order of the page = greeting, continue or start, the map, happenings, account.
    The map stays the visual heart.
B3. "Continue where you left off" must not require new tracking. Candidate sources
    that respect the consent line: her Record (last kept thing), or a this-device
    memory of the last room she opened (sessionStorage or localStorage, never
    server-side), or nothing automatic: she pins a room herself.
A4. "New in the Village" is editorial: JoYi writes it, short, dated; it is not
    generated activity.
A5. Events become a small list JoYi can edit without a deploy pipeline change
    (one data file), showing the next two or three dates, nothing more.
A6. The Founding Villager name-in-lobby area waits for the consent design already
    promised in the plan (separate explicit step, default no).

## Questions to fill the gaps

Q1. **Continue where you left off: what may the lobby know?** Pick one:
    (a) this-device only, the last room she opened, stored in her browser, never
    sent to us; (b) from her Record, the last thing she kept; (c) both; (d) she
    pins her own "my next thing" by hand; (e) skip the feature.
Q2. **Upcoming live events: what is the source of truth?** A small file I maintain
    on your word each time, or a piece of the ops flow you and Gabby already run?
    And is Rebuild Arc plus the February date the whole list until 2027?
Q3. **New in the Village: your voice, what cadence?** Weekly line? Only when a room
    opens? Written by you, or drafted by me from the worklog for your approval?
Q4. **Orientation: what is it?** (a) The Concierge conversation that already exists,
    promoted properly; (b) a guided tour of the map, on the page; (c) the short
    video the audit floated (format and script would need your approval first);
    (d) some combination.
Q5. **Founding recognition in the lobby:** does the optional name in the Village
    lobby (contract line) live on the lobby page itself, and is now the time to
    design its consent flow, or does it wait for Phase 5?
Q6. **The boundary list:** confirm what is banned from the lobby forever: marketing,
    pricing, join language, engagement metrics, streaks, upsells, anything that
    measures her. Anything to add?
Q7. **Layout hierarchy:** what does she see FIRST, above the fold: the front desk
    card (talk to someone), or the map (go somewhere)? Today it is desk first.

## The personalized area: proposed design (from JoYi's direction, 2026-08-14)

JoYi's rulings, recorded: the front desk stays first after Welcome back. Beside it
sits her personal area: her calendar, what she is working on, what she has saved to
work FROM. Not the Record itself; the Record (PIL) stays a room at the bottom of the
map. The voucher moves below the rooms. Coming up merges into the calendar or sits
small beneath it. The area holds commitments she chooses: a thirty-day yoga path,
HUSH every day, PlantLuck daily, returning to a resource the desk surfaced.

**The shape: one dataset, her choice of view.**
A plan item is something she chose: title, an optional link into the Village (a room,
a Record entry, a resource), a rhythm (today only, daily, weekly, a date), and the
room it came from. She sees her items as a week (a calendar) or as a list (a to-do),
one toggle, her preference remembered because she set it. If she likes a calendar it
is a calendar; if she likes a list it is a list.

**Where Add to my calendar lives (one click, preset, editable):**
- The HUSH room app card: Practice HUSH daily.
- The Kitchen card: PlantLuck each day.
- Moxie, when the door opens: the thirty-day beginner path.
- Every Record entry on /record: Put this on my calendar.
- The desk ending panel: after the wrap-up, one more route offers the just-kept
  things for her calendar. Never mid-conversation, never per reply.

**Her real calendar too:** every plan item can download as an .ics file, so it lands
on her phone's own calendar with recurrence. Built like the Record downloads: in her
browser, sent nowhere.

**Village dates live inside the same card:** the Rebuild Arc dates and the February
opening appear under her items as "On the Village calendar." Coming up stops being a
separate static card. The voucher becomes a compact card below the rooms.

**The trade (JoYi's words: encourage exploration and connection):** her plan is part
of her consented member record, so the member desk may see it exactly the way it sees
her consented notes. In return the Concierge gets one standing instruction: when it
fits, point to a room she has not tried, or to a live moment with people: a workshop
date, a class, the Commons when it opens. Gently, at most once a conversation, never
as pressure. The porch never sees any of it.

**What this area will never do:** streaks, missed-day language, completion
percentages, usage graphs, guilt copy. Checking something off is hers; history is not
kept in v1. Nothing on this surface measures her.

**Build phasing (proposed, becomes PHASES entries on JoYi's GO):**
- L1: the area itself: plan storage on the member record, list + week views, the
  one-click adds from HUSH, Kitchen, and /record, Village dates section, .ics
  download, edit and remove. Voucher card moves below the rooms; Coming up card
  retires into the calendar.
- L2: the desk: ending-panel add, plan context into the member desk prompt, the
  exploration-and-connection instruction.
- L3: Moxie thirty-day path add (waits on the member door), room-completion links.

## My Practice: JoYi's copy spec (2026-08-14, verbatim, this is the build contract)

**The name is My Practice.** Not My Plan (productivity and obligation), not Your Week
(one view, not the thing). My Practice says: these are the things I chose to return
to. Views are simply **List | Week**. Default List; once she chooses Week, remember it.

**Coming Up merges into My Practice** with Village dates in their own labeled
subsection, **In the Village**. Personal items and Village dates never visually blur:
one is "I chose this," the other is "this is happening around me."

**Surface copy, hers, exact:**
- Header: "My Practice" / "Things you've chosen to come back to."
- Helper: "Nothing gets added here unless you add it."
- Empty state: "Nothing here yet." / "When there's something you want to return to,
  you can add it from a room, your Record, or the Concierge."
- HUSH room button: "Add HUSH daily" / confirmation: "Added. HUSH will be here each
  day." / on My Practice: "HUSH · 60 seconds" + "Open HUSH" / after checking:
  "Done for today". Recurring items simply come back tomorrow. No applause machine.
- Record entries: NOT "Put this on my calendar" (makes the calendar sound like the
  product). Use "Come back to this" then "When do you want this back in front of
  you?" [Tomorrow] [This week] [Choose a day] / confirmation: "Added to My Practice."
- Desk ending: "Anything here you want to come back to?" with "Add to My Practice"
  per eligible item. Maintains the consent rhythm; never interrupts the conversation.
- In the Village: "Things happening around the Village that may be worth knowing
  about." / "Rebuild Arc begins Oct 31" / if eligible: "Your voucher covers this." /
  CTA "Take a look" / optional "Add to My Practice". Village events appear because
  they are Village information; they join My Practice only when she says so.
- External calendar: "Add to my calendar" / helper: "Downloads to your device as a
  calendar file. Nothing is synced back to the Village." Never lead with ".ics".
- List groups: Today / Later this week / Ongoing (or by Village area if testing
  proves it better).
- Moxie, at L3: "Want the 30-day Moxie path in My Practice?" / "Add the 30-day
  path". No automatic enrollment because the door opened.

**Concierge outward line, corrected by JoYi:** v1 keeps no completion history, so the
Concierge cannot truthfully say "you practice most days." It knows only what she
explicitly scheduled. The approved register:
"You've got HUSH in My Practice each day. Rebuild Arc starts Oct 31, and your voucher
covers it. If you want some practice with actual people too, take a look."
It sounds like the Concierge, not a recommendation engine.

**The core language rule for this whole feature:**
Reserved words: Choose. Add. Return. Come back. Practice. Open. Remove.
Banned words: Goals. Progress. Consistency. Missed. Completed. Performance.
Engagement. Streak. Habit score. Optimization.
The product is not asking "How well are you doing?" It is asking "What do you want
to keep within reach?"

## Out of scope for this worksheet

Room interiors, the Concierge brain, Stripe flows, the public landing page.
