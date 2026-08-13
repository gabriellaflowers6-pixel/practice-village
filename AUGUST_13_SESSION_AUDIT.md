# August 13 Session Audit

This audit covers work completed or reviewed on August 13, 2026. It does not reopen older design decisions.

## Working rule

Walkthrough observations are added in the order reported. They are not fixed during the walkthrough unless they block access to the next checkpoint. After the walkthrough, each pass is reviewed, built, tested, and released before the next pass begins.

## Done and live today

1. The live domain and canonical page address use `thepracticevillage.org`.
2. The public landing page received the launch copy, layout, pricing, Rebuild Arc, builder, and heading passes recorded in today's commits.
3. Member access, invite-only identity, Stripe membership provisioning, protected member routes, member status, and password recovery were added.
4. The invitation email and account creation screen were rewritten as one warm account-creation path.
5. The invitation link now opens account creation instead of the public landing page.
6. The account-creation session bug was fixed so a new member can enter the protected area.
7. A first conversational onboarding flow was built with type, browser voice transcription, skip, finish, and optional saving.
8. Copy rules were added to the membership plan: no em dashes, no orphaned display words, no generic AI language, and no words that do not help the Villager understand, decide, or act.
9. Google Cloud tools were reviewed without adding another AI layer. The approved reliability plan is: add public uptime checks first; add invisible reCAPTCHA to the public Concierge in monitor-only mode after the walkthrough; add privacy-safe operational logging later if needed. Do not move the Concierge to Cloud Run or duplicate member data in Firestore.

## Built today but not approved

1. The onboarding screen works, but its copy, spacing, timing, voice behavior, question structure, ending, and room handoff do not yet meet the agreed experience.
2. The member lobby works as a protected page, but its design and room logic do not yet feel like the Village.
3. The Village Map change keeps the link on the member page, but it only points to the room section on the same page. It has no clear visible result and does not solve member navigation.

## Product rules confirmed today

1. The live site is the current source of truth. Older plans, names, prices, dates, and links must match it when they conflict.
2. The public landing page explains and previews the Village. The protected member area removes marketing and opens working member rooms, apps, resources, events, and account controls.
3. The initial member account collects only what is required for payment and access. Optional onboarding continues through the Concierge by voice or type, not a form.
4. Do not collect information simply because it might be useful later. Ask only what improves the Villager's experience now, and ask permission before remembering it.
5. Workshop vouchers follow the membership year, not the calendar year. One voucher is included in each membership year.
6. The only voucher exception is for the 108 Founding Villagers who become members before the first Rebuild Arc Workshop begins on October 31, 2026 at 3:00 pm Central. They receive one additional voucher in their first membership year.
7. Quiet Room is retired as a name. HUSH is the room and the app. The HUSH room will include the sixty-second app plus additional member mindfulness apps and resources.
8. The public landing page needs a future area for the 108 Founding Villager names. Placement, display format, exact consent, and removal must be approved before implementation. No name is public by default.
9. Cur.AI.ted starter access is included with membership. The full Cur.AI.ted studio remains a separate offer. Member access and the correct starter destination still need to be connected.
10. Participation invitations happen after someone has experienced the Village. Volunteering, teaching, testing, and feedback are not onboarding questions.

## Approved language and content confirmed today

1. Member sign-in language passed review before the invitation walkthrough.
2. The invitation email uses the approved Practice Village message, one Accept the invitation action, and a seven-day link.
3. The Terms and Privacy pass was approved. The AI warning begins with "Important:" and states that the Concierge can be incomplete or wrong, should be verified, and is not professional advice.
4. The approved Concierge onboarding architecture is recorded in `MEMBERSHIP_ACCESS_PLAN.md`.

## Build constraints confirmed today

1. The Concierge already uses the Gemini API. The Google Cloud review was for reliability, protection, and operations, not another AI feature.
2. No additional product features are being added during this pass. Work is limited to completing agreed functions, correcting logic and flow, connecting rooms, and strengthening reliability.
3. Shared-branch work must be checked before each change so partner updates are not overwritten.
4. Do not invent a member destination when the working room or access link is not ready. Label the room honestly and wait for the correct link.
5. Each review checkpoint states what JoYi checks and what does not need checking at that step.
6. Use the check-balance process before approval: what the Villager gives, what the Village returns, what is saved, what remains private, and whether the exchange asks for more than it provides.

## Onboarding walkthrough notes in reported order

1. Remove "A conversation, not a form."
2. Replace the large explanation with one warm greeting, one purpose sentence, and the first optional question.
3. State the limit: up to three questions and about two minutes.
4. Show progress.
5. Talk currently stops after one recognition result and can end after a pause without warning.
6. Talk needs a listening state, elapsed time, Stop control, preserved transcript, clear ending message, and a 60-second limit.
7. Voice must never send automatically. The Villager reviews and sends the transcript.
8. The raw onboarding conversation remains private and is not stored. Only the short note is stored after explicit consent.
9. The Concierge produced a destination, but the onboarding page ignored it.
10. "I want to start with a yoga pose" should offer Moxie Studios.
11. The ending must show where the Villager is going before navigation.
12. Do not ask about volunteering, teaching in Moxie Studios, product testing, or feedback during onboarding. Surface the invitation after the Villager has experienced the Village.
13. Founding Villager public-name consent is a separate explicit step with a default of no public display.

## Member lobby walkthrough notes in reported order

1. The page does not yet feel like the working Village.
2. The page feels unfinished and visually cheap.
3. Moxie Studios opens the public Moxie landing page. The full member destination is not confirmed. Do not guess or substitute a link. Wait for the correct destination.
4. PlantLuck opens in a phone-shaped layout on desktop. Confirm whether this is the intended app layout. Flag it as a cross-room Village experience issue.
5. HUSH opens the single app. The HUSH room needs to hold the app plus additional member mindfulness apps and resources.
6. Safety Hall returns 404 from the live member page.
7. The Safety Hall build exists in the older `Practice Village` project but is not present in the live `practice-village` project.
8. The Safety Hall source includes local incident recording, screenshot handling, pattern review, responsibility mapping, support routes, discreet view, quick exit, reviewed resources, and the hackathon walkthrough.
9. Safety Hall needs a deliberate transfer into the live project at the canonical route. It is not a new build.
10. The Village team pill looks interactive but does nothing. Either give it a clear purpose or present it as plain status text.
11. Village Map points to the room section on the current page. It appears to do nothing and should not remain in this form.
12. Each room needs a member-facing room entrance that can contain apps, resources, live offerings, status, and return navigation.
13. Room links must tell the truth. A working link opens the working member experience. An unconfirmed or unfinished destination is labeled before the Villager clicks.
14. Cur.AI.ted starter access is included in the published membership offer but is missing from the member lobby.
15. Add Cur.AI.ted to the member Village map only after the starter-tier destination, member handoff, and access logic are confirmed. Keep the separate full-studio offer distinct.

## Safety Hall integration status

Source project:

`/Users/jkr/Desktop/ALL Build Projects/Practice Village`

Live project:

`/Users/jkr/Desktop/ALL Build Projects/practice-village`

The live member page currently points to `/safety-hall/`, but that route has no deployed Safety Hall files. The Safety Hall integration pass must preserve local-only storage, screenshot separation, microphone release, discreet view, quick exit, reviewed resources, privacy language, and the approved Practice Village visual system.

## Phased punch list after the walkthrough

### Phase 1: Onboarding

Status: approved architecture, not implemented.

1. Build the approved opening, optional preferred-name setup, and three-question arc.
2. Let a specific need interrupt onboarding so the Concierge can help immediately.
3. Keep current destinations separate from enduring memories.
4. Show proposed memories and require Remember these before saving.
5. Explain the destination before offering Open the room and Explore the Village.
6. Build the separate Founding Villager public-name consent.
7. Move participation invitations out of onboarding.
8. Repair Talk with a visible listening state, Stop, elapsed time, preserved transcript, a clear ending, and a 60-second limit.
9. Put raw onboarding conversation and voice-audio retention facts in Privacy or Help.
10. Fix onboarding spacing and test desktop and mobile.

Review checkpoint: JoYi checks the words, order, choices, memory proposal, destination explanation, public-name consent, and one complete voice walkthrough. JoYi does not check storage code, event handling, authentication, or responsive implementation details.

### Phase 2: Member Village map

Status: protected page works, experience not approved.

1. Redesign the member page in the public site's visual language without marketing, pricing, demos, or join language.
2. Replace the ineffective Village Map anchor with useful member navigation.
3. Resolve or restyle the Village team pill.
4. Give each room a member-facing entrance that can hold apps, resources, live offerings, status, and return navigation.
5. Label unavailable or unconfirmed destinations before a click.
6. Keep account, voucher, event, saved-item, Concierge, and room status accurate.
7. Replace the temporary text orientation with a real guided orientation. Consider a short demo-style video after the format and script are approved.

Review checkpoint: JoYi checks whether the member page feels like the Village and whether the information hierarchy makes sense. JoYi does not test room applications during this phase.

### Phase 3: Safety Hall integration

Status: built in the older project, missing from the live project.

1. Transfer the existing Safety Hall build into the live project at the canonical route.
2. Preserve local-only records, screenshot separation, voice behavior, discreet view, quick exit, reviewed resources, and privacy boundaries.
3. Apply the approved Practice Village logo, fonts, navigation, footer, Privacy, and Terms.
4. Connect Safety Hall from both the public and member Village maps with accurate availability language.
5. Run the existing Safety Hall hackathon and safety-control checklist.

Review checkpoint: JoYi checks the working route, one saved entry, one screenshot, one voice entry, pattern review, responsibility mapping, support handoff, discreet view, and quick exit. JoYi does not re-review already approved Safety Hall product philosophy in this phase.

### Phase 4: Cross-room destinations and membership access

Status: destinations and access vary by room.

1. Confirm the real member destination for Moxie Studios. Do not use the public landing page as a substitute.
2. Review PlantLuck's desktop phone layout and confirm whether the app needs a Village wrapper or app-side adjustment.
3. Create the HUSH member-room entrance for the sixty-second app plus additional mindfulness apps and resources.
4. Add Cur.AI.ted starter access to the member map after its destination and membership handoff are confirmed.
5. Keep the full Cur.AI.ted studio offer separate from included starter access.
6. Confirm consistent return navigation from every external or internal room.

Review checkpoint: JoYi checks each confirmed link and what the Villager sees on arrival. JoYi does not approve an invented placeholder destination.

### Phase 5: Membership participation and account controls

Status: partly built, not fully walked through.

1. Surface Share feedback, Test something new, Volunteer, and Teach in Moxie Studios only after the Villager has experienced the Village.
2. Implement the approved public-name area for consenting Founding Villagers, including change and removal.
3. Complete cancellation, export, deletion, password recovery, and membership help paths.
4. Verify voucher display, membership-year dates, cancellation timing, failed renewal, refund, and expired access.

Review checkpoint: JoYi checks language, consent, and visible account outcomes. JoYi does not inspect Stripe events, role metadata, or deletion internals.

### Phase 6: Reliability and abuse protection

Status: decisions approved, not implemented.

1. Add Google Cloud public uptime checks for the homepage, login, invitation path, and critical member routes.
2. Add invisible reCAPTCHA to the public Concierge in monitor-only mode before any blocking rule.
3. Add privacy-safe operational logging later if needed.
4. Never log conversations, Safety Hall records, screenshots, voice, email addresses, zip codes, or invitation tokens.
5. Do not move the Concierge to Cloud Run or duplicate member data in Firestore.

Review checkpoint: JoYi checks that one test alert arrives and the public Concierge feels unchanged. JoYi does not configure dashboards, thresholds, credentials, or backend failure handling.

### Phase 7: Final release pass

Status: pending completion of phases 1 through 6.

1. Run the full copy standard across public, member, onboarding, room, account, Privacy, and Terms pages.
2. Check for em dashes, orphaned display words, generic AI language, and unnecessary copy.
3. Test desktop, mobile, zoom, keyboard, focus, screen-reader labels, contrast, and reduced motion.
4. Run authentication, invitation, recovery, routing, room-link, storage, privacy, and regression checks.
5. Confirm the live site, project plans, and room status all tell the same truth.

Review checkpoint: JoYi performs the final experience walkthrough. Technical checks are reported separately with pass, fail, and follow-up status.

## Next action

Implement Phase 1 only after JoYi confirms that the approved onboarding architecture above is captured correctly.
