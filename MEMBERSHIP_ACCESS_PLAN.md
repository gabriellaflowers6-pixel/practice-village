# Practice Village Membership Access Plan

**Status:** Current product contract  
**Source of truth:** https://thepracticevillage.org/  
**Effective:** August 13, 2026

When an older plan, specification, price, date, or product name conflicts with the live site, the live site controls.

## The membership promise

Free visitors can understand the Village and use essential public tools. Members receive the ongoing practices, programs, personalization, saved learning, and human participation that make the Village a place to return to.

Membership is not payment for a safety answer. Membership is payment for continuity, full programs, saved learning, live participation, and access to the Village as it grows.

## Current ways to enter

### Charter List: free

- Founder build updates
- First word when new rooms open
- First access to February live classes after founding members
- The sixty-second HUSH app, free for everyone

### Founding Villager: $149 per year

- 108 founding seats
- Founding rate locked for life
- Everything in Moxie Studios, including practices, the mirror, and Bott Om
- Live classes with JoYi beginning February 7, 2027
- Every open Village room and each new room as it opens
- Early entry to the February live room
- Optional name in the Village lobby
- A vote on which room is built next
- One Rebuild Arc Workshop voucher per membership year
- One additional voucher in the first membership year only for the 108 Founding Villagers who join before the first Rebuild Arc Workshop begins on October 31, 2026 at 3:00 pm Central

### Membership: $15 per month

- Month-to-month access
- The Concierge and the member's record
- Moxie Studios, the Kitchen, and every open room
- $15 per month now
- $25 per month when all rooms open in February 2027
- The $25 founding rate is then locked
- Cancel anytime
- One Rebuild Arc Workshop voucher per membership year

## Public landing page

The public site explains what Practice Village is, who it serves, what is open, what people can try for free, what membership adds, and why the practices and technology are trustworthy.

It contains:

- The main promise and intended audience
- A short explanation of how the Village works
- A limited, unsaved Concierge demonstration
- The Village map with accurate Open, Free, Included, and Coming labels
- A short preview of each room
- The founder and teaching foundation
- Plain-language privacy and AI boundaries
- The three current ways to enter
- The Rebuild Arc Workshop overview
- Selected free teachings and tools
- Frequently asked questions

## Free access

- Public Village information and room previews
- Charter List
- Limited, unsaved Concierge routing
- The sixty-second HUSH app
- WellBEing Snapshot
- Sources of Wholeness
- Selected public teachings and sample practices
- Safety Hall's Something Feels Wrong tool, including local documentation, pattern review, responsibility sorting, support routes, and support handoff preparation

Safety Hall's essential functions remain free. A person does not have to pay to document concerning behavior, recognize a possible pattern, or find safety and rights information.

## Member access

- A private member lobby
- Full Moxie Studios access
- Bott Om practices and form support
- Live classes with JoYi and any member replays that are offered
- Rebuild Arc Workshop voucher and registration
- Full member curriculum and guided practice paths
- Expanded Concierge access
- Personalization based only on information the member explicitly saves
- The Personal Intelligence Layer as it rolls out
- Saved practices, plans, reflections, and resources across rooms
- The Kitchen and other open rooms as described on the live site
- Additional HUSH mindfulness apps and resources as they open
- Cur.AI.ted starter access
- Early access, feedback opportunities, and member voting where offered
- Founding benefits appropriate to the member's plan

## Member lobby

After login, a member enters the lobby rather than returning to the sales page. The first version contains:

- Welcome back
- Continue where you left off
- Ask the Concierge
- Your saved practices and plans
- Rooms open to you
- Upcoming live events
- New in the Village
- Workshop voucher status
- Account, privacy, export, and deletion controls

## Concierge-led welcome

The member account opens with the minimum information required for payment and access. Onboarding happens afterward as an optional conversation with the Concierge, not as an intake form.

- The member can talk or type.
- Voice becomes a transcript the member can review before sending. Practice Village does not keep the audio.
- The Concierge asks one useful, optional question at a time and no more than three questions in the first visit.
- The member can skip any question, finish for now, or return later without losing access.
- Questions follow what the member says. They may cover what would make membership useful, the first room she wants, how she likes support paced, the name she wants used, or an access need she wants remembered.
- State or zip is requested only when the member wants local resources. A street address is not part of onboarding.
- The Concierge does not seek medical details, account numbers, employer information, immigration information, or a trauma history for onboarding.
- At the end, the Concierge offers one short welcome note containing only useful details the member deliberately shared.
- The member chooses once whether to save that note or keep the entire conversation private. Raw onboarding conversation and audio are not saved.
- Public display of a Founding Villager's name remains a separate, explicit choice and is never inferred from onboarding.

## Copy standard

- Use direct, clear, kind, confronting, and educational language as the moment requires.
- Use only words that help the Villager understand, decide, or act.
- Do not use em dashes.
- Do not use generic AI phrasing, slogans, decorative explanations, or labels that describe what the interface already makes clear.
- Prevent orphaned words in headings, buttons, cards, and short display copy at supported screen sizes.
- Read every screen aloud before release. Remove any sentence that does not change what the Villager knows or can do.

## Onboarding punch list from the August 13 walkthrough

1. Replace the large welcome explanation with one warm greeting, one purpose sentence, and the first question.
2. Remove "A conversation, not a form" and other copy that explains the interface instead of helping the Villager use it.
3. Set and state a clear onboarding length. Target three optional questions and about two minutes.
4. Show progress in plain language, such as "Question 1 of up to 3."
5. Redesign Talk so listening does not end without notice. Show listening state, elapsed time, a Stop button, and a clear message when listening ends.
6. Preserve all voice results in the text box so a pause does not replace or lose earlier words.
7. Keep voice review before Send. Do not send automatically.
8. Use onboarding answers to make a useful first handoff. Yoga, movement, meditation, or poses should offer Moxie Studios.
9. Show the destination before leaving onboarding. Do not send the Villager to a generic page without explaining the next step.
10. Add optional paths for volunteering, teaching in Moxie Studios, product testing, and other Village participation.
11. Ask eligible Founding Villagers separately whether they want their name on the public landing page. Default to no public name. Include the exact display name and a removal path before publishing.
12. Decide which onboarding answers are useful enough to save. Do not turn onboarding into a diary or store the raw conversation.
13. Fix desktop spacing, heading measure, chat height, and action alignment. Test mobile separately.
14. Add a clear finish point and tell the Villager what happens after saving or keeping the note private.
15. Test each answer route, each privacy choice, voice ending, skip, finish, and return behavior before production.

## Roles

- `member`: active monthly membership
- `founding_villager`: active annual founding membership and founding benefits
- `admin`: staff access; never created through public signup

Public access does not require a role.

## Access and payment rules

- Public tools work without an account unless cross-device saving requires one.
- Paid content is protected on the server or Netlify CDN, not hidden with browser JavaScript.
- A successful Stripe purchase creates or updates entitlement through a verified webhook.
- Roles live in server-controlled account metadata. A browser never assigns its own paid role.
- Founding Villager and monthly Member entitlements remain distinct.
- A membership year is the 12-month period beginning on the member's start date. Workshop vouchers do not reset on January 1.
- Each active membership receives one Rebuild Arc Workshop voucher per membership year.
- The 108 Founding Villagers who join before the first Rebuild Arc Workshop begins on October 31, 2026 at 3:00 pm Central receive one additional voucher in their first membership year only.
- Cancellation keeps access through the paid period shown by Stripe.
- Failed, refunded, disputed, or expired payments update access according to the published terms.
- Safety Hall local records are not uploaded merely because someone becomes a member.
- Moving anything from Safety Hall into a member record requires a separate, specific choice.

## Build order

1. Keep the live offer, legal copy, and active source consistent.
2. Create the member lobby shell and login experience.
3. Enable invite-only Netlify Identity for the first release.
4. Add Stripe webhook verification and server-controlled role assignment.
5. Add protected member routes and protected member-data functions.
6. Connect successful payment to account invitation and onboarding.
7. Add account, logout, recovery, cancellation, privacy, export, and deletion paths.
8. Connect rooms one at a time.
9. Test purchase, login, logout, recovery, cancellation, failed renewal, refund, and expired access.
10. Run accessibility, privacy, and mobile checks before production release.

## Planned discussion after the current passes

- Decide the placement, consent language, display format, and removal process for the public Founding Villager name area.
- Implement the public Founding Villager name area only after that review. No member name is public by default.

## Release boundary

Member access is complete only when:

1. A paid member can enter without manual technical help.
2. A nonmember cannot load protected content by typing its URL.
3. A canceled or expired member loses access at the correct time.
4. A member can see how to cancel, export, and delete their information.
