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

## Out of scope for this worksheet

Room interiors, the Concierge brain, Stripe flows, the public landing page.
