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
12. Add optional interest in volunteering, teaching in Moxie Studios, product testing, and sharing feedback.
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

## Locked build order after the walkthrough

1. Onboarding pass. Approve the exact welcome, three-question structure, voice behavior, save choice, and destination ending before coding.
2. Member Village map pass. Define the room entrance pattern, remove sales behavior, confirm every destination, and redesign the protected member page.
3. Safety Hall integration pass. Move the existing Safety Hall build into the live project, connect the canonical route, and run its existing safety checklist.
4. Cross-room pass. Confirm Moxie Studios, PlantLuck, HUSH, and Cur.AI.ted member destinations. Do not invent missing links. Confirm how Cur.AI.ted starter access is recognized from a Practice Village membership.
5. Account and membership controls pass.
6. Reliability pass. Add Google Cloud public uptime checks, then test invisible reCAPTCHA on the public Concierge in monitor-only mode. Keep all logs free of conversations, Safety Hall records, screenshots, voice, email addresses, zip codes, and invitation tokens.
7. Full copy, desktop, mobile, accessibility, privacy, and regression pass.

## Next action

Review the onboarding welcome and three-question sequence in plain text. No code changes are made until that sequence is approved.
