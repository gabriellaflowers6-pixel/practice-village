# Practice Village — XPRIZE demo video

**Deadline:** Sun Aug 17, 2026, 1:00 PM PT · **Runtime:** 2:55 as cut (hard cap 3:00)
**Entry:** Practice Village · Build with Gemini XPRIZE · Education & Human Potential (Track 01)
**Production order (JoYi's call):** script → voice + camera first → screen capture cut to match. Gabby supplies Moxie Studios footage.

---

## Part 1 — The overview

### What the judges score

Three equal thirds. The script hits each one on purpose, in this order.

| Third | Where the video earns it | Seconds |
|---|---|---|
| **Category impact** (Education & Human Potential) | The Moxie Fitness closure, the community-center career, Moxie teaching a beginner privately, the Record that travels with her | 0:00–0:50, 1:21–2:24 |
| **AI-native operations** | The Concierge on Gemini, the choice menu, the live HUD lookup from the official source, the refusals written into the system | 0:50–1:21 |
| **Business viability** | Live checkout, founding memberships, revenue by month, workshop and February dates | 2:24–2:40 |

### Pass/fail gates the video must not undermine

- **Gemini live in the deployed entry.** Verified working on production today: `POST thepracticevillage.org/concierge` returns a real reply from `gemini-flash-latest`. Say "runs live on Gemini." Do not say Vertex; Vertex was retired Aug 12 and prod runs the AI Studio backend.
- **Newly created after May 19.** First commit June 18. Nothing in the video should imply Moxie Fitness (2020) or PlantLuck's February prototype is the entry. The entry is the Village; Hilo is the backstory; PlantLuck is a disclosed, enhanced room.
- **Free unrestricted judge access.** The close names Safety Hall and HUSH as free. That one line answers the question a judge would otherwise have to test for.
- **Video rules.** Under 3 minutes, public on YouTube, no third-party trademarks on screen, own or royalty-free music only.
- **Open item before you record:** "at least one Google Cloud product in production." The Concierge calls the Gemini API. Gabby's checklist is the authority on whether that alone satisfies the gate. The script never claims more than Gemini, so it stays true either way.

### What actually runs on Gemini (walked live, Aug 16)

I signed into the member lobby and drove every room. What I found, so the video claims exactly what a judge can verify:

| Surface | Gemini | What I saw |
|---|---|---|
| Public Concierge (porch) | **Yes** | Reflection, choice menu, quick replies |
| Member desk `/member` | **Yes** | Same brain, full capability, zip lookups, routing |
| Member welcome and onboarding | **Yes** | `member_onboarding` mode on the same function |
| Room hand-off after a question | **Yes** | `member_help` mode returns the room to send her to |
| Your Record `/record` | Written by Gemini | The Concierge's saved cards, with their sources. No separate model call |
| Moxie Studios | **Yes, Gabby's side** | The `/coach` proxy on moxiestudio.netlify.app |
| Safety Hall | **No, on purpose** | I clicked "Help me make sense of this" and watched the network: zero outbound requests |

So the honest claim is stronger than "we use Gemini." One brain serves the porch, the desk, the welcome, and the hand-offs, Moxie runs its own coach, and Safety Hall deliberately has no AI and no network at all. Say the last part out loud. A judge who checks will find it true, and almost nobody else in this category can say it.

### The argument the video is actually making

A community center works. What breaks is the front line: turnover, stale information, and a person sent to a program that closed last year. An agent does that part of the job without burning out and without going stale, so the humans keep the part only humans can do. That is the thesis in one breath, and beat 2 is where it lands.

### The one thing to protect

The Concierge must never look like it is promising to secure benefits, fill forms, or give legal or medical advice. Beat 4 says the refusals out loud. That line is trust, and it is also the thing most demos in this category get wrong.

---

## Part 2 — The script

**Final: 352 spoken words, about 2:55 with the screen silences.** The rule: if the screen shows it, the voice does not say it. The bracketed silences are real. Do not fill them.

---

### 0:00 · CAMERA · 18s

> In 2020 I closed Moxie Fitness, my studio in Hilo.
>
> It was where I stayed fit, taught meditation and forgiveness, and watched people get braver because of who they met there.
>
> The building closed. The community went with it.
>
> I lost that twice more, moving islands for work.

### 0:18 · CAMERA · 26s

> I have spent my career in YMCAs, YWCAs, and community centers. Those buildings work.
>
> The systems around them break. Staff change. Information gets old. Someone who finally asks for help gets sent from one place to another.
>
> This year I started 200 hours of yoga teacher training at home, never sure I was doing the poses right.

### 0:44 · SCREEN · 6s
*[Hero, then the rooms revealing. Card on screen: **Practice Village · a digital community center · Education & Human Potential**.]*

> So I built the building.
>
> One membership, many rooms, help inside every one.

### 0:50 · SCREEN · 31s — the Concierge
*[Signed in at /member. Mostly watching.]*

> Every room shares one front desk. It runs on Gemini.
>
> *[Type the problem. 4s silence while the answer lands.]*
>
> *[Click One small action today. 3s silence on "Your clear next step."]*
>
> One clear step, and it asks before it keeps anything.
>
> *[Cut to the ZIP lookup.]*
>
> HUD-certified counselors by ZIP, from the official source, while she waits.
>
> It will not say she qualifies for a benefit, fill her forms, or give legal or medical advice. That is built in. People act on what AI tells them.

### 1:21 · SCREEN · 25s — Moxie Studios
*[Gabby's footage. Card on screen: **Moxie Studios**. See the naming note below before you record this.]*

> Moxie teaches beginner yoga and meditation.
>
> This is for the person who has not found a studio, or who has felt intimidated or irritated in one, and still knows this matters.
>
> *[3s silence on the form check.]*
>
> She teaches the basics, and the mirror lets you check your own form. It runs on your device. Nothing is recorded, nothing is sent.
>
> Every pose was reviewed with a human teacher first.

### 1:46 · SCREEN · 22s — Safety Hall

> Safety Hall is a private place to document patterns you are noticing, before you decide what they mean or what to do about them.
>
> No account. No AI. Nothing leaves your device.
>
> Documentation matters. What you write down now is what you will have later, for yourself, for HR, for a lawyer, or for someone you trust.

### 2:08 · SCREEN · 16s — Your Record

> Your Record is the working file. What you were given, what you did, the sources it came from. Download it any time.
>
> You should not have to rebuild your history from scratch every time you talk to someone new.

### 2:24 · SCREEN · 16s — the doors
*[Pricing, then the dates.]*

> We opened the doors this month with a handful of memberships. That was deliberate. The rooms had to be right before we sold them.
>
> $149 a year or $15 a month at thepracticevillage.org. The first workshop is October 31.

### 2:40 · CAMERA · 15s

> I am rebuilding the place I lost. This time it does not depend on one town, one building, one exhausted person holding all the answers.
>
> Safety Hall and HUSH are free today.
>
> Walk in.

**Out at about 2:55.** If your first read runs long, cut in this order: "Every pose was reviewed with a human teacher first," then "That was deliberate," then "moving islands for work."

---

### This sweep, line by line

**Safety Hall was underwritten and is now the strongest room copy in the script.** The old line described a private notepad. Yours describes what the room is for: documenting a pattern before you have decided what it means, which is exactly the stage where people talk themselves out of writing anything down. The HR, lawyer, trusted person line does the educational work in eleven words. It tells a woman her notes have a future use without telling her what to do with them.

**"Everything she chose to keep" is gone.** It described the storage, not the point. "Your Record is the working file" names it in four words, and "you should not have to rebuild your history from scratch every time you talk to someone new" is the argument. That sentence is also the Track 01 claim: a portable learning record is education infrastructure, not a feature.

**Moxie, not Bott Om.** Also gone: "for the person at home wondering, am I doing this right," which was too soft for what you described. The audience is specific: she has not found a studio, or she has been in those rooms and been condescended to or annoyed, and she still knows the practice matters. Naming the irritation is the confronting part, and it is why she trusts the room.

**The mirror is hers, not ours.** "The mirror lets you check your own form" puts her in charge of the checking. "Nothing is recorded, nothing is sent" closes the door on the surveillance read before anyone has time to imagine it. Never "it watches you," never "the system sees."

**Traction is stated, not apologized for.** "We opened the doors this month with a handful of memberships. That was deliberate. The rooms had to be right before we sold them." A judge scoring business viability respects a founder who chose readiness over a bigger number and says so in one line. Hedging reads worse than the small number does.

### Naming: the one thing to settle before capture

The live site says **Bott Om** four times on the landing page and throughout `/moxie-studio/`, including "Bott Om is the woman on our logo." If the voiceover says Moxie while the screen says Bott Om, judges see the seam. Three options:

1. **Update the site copy before capture.** Text-only edits in four spots plus the Moxie page. Fast and safe by your own rules, but the name also lives on Gabby's site and in the Zen Bott Om brand, so it is a decision, not a typo fix. Say the word and I will do the Village side.
2. **Do not hold that copy on screen.** Use Gabby's studio footage for this beat and never show the room card. Costs nothing, requires no rename tonight.
3. **Name the room, not the teacher.** "Moxie Studios teaches beginner yoga and meditation." No mismatch either way, and it loses the warmth of a named guide.

Option 2 for tonight, option 1 when the rename is a real decision, is my recommendation.

## Part 3 — Shot list for capture day

Record at 1920×1080, desktop browser at full width, browser chrome minimal, no bookmarks bar, no extensions visible, no other tabs with recognizable logos. Cursor moves slowly. Every screen beat needs 3 to 5 seconds of handle at each end so the edit can breathe.

| # | Beat | Capture | Must be visible |
|---|---|---|---|
| 1 | 3 | thepracticevillage.org, hero to room map, one slow scroll | "Your digital community center," the room cards with their Open tags |
| 2 | 4 | Member desk at /member. Type: **"I moved for a job, I do not know anyone here, and I stopped taking care of my body. I do not know where to start."** | The reply naming the situation, the quick replies, the two mode buttons |
| 3 | 4 | Same conversation: click **One small action today**, then **wrap up and review**, then the keep prompt | "Your clear next step" in the gold rule, then "Keep any of this in your Record?" with the checkboxes and Keep nothing beside it |
| 4 | 4 | A money or housing question with a zip code | The HUD counselors by name with the official source note underneath |
| 5 | 5 | **Gabby** — see her shot list below | Live pose with on-screen form guidance |
| 6 | 6 | /safety-hall, the entry screen, then the pattern log | Device safety, Discreet view, the crimson exit, and "Nothing is sent to Practice Village" |
| 7 | 6 | /record, scroll one kept card, then Download as PDF | A card with its trust note and steps, "11 kept," and the download landing |
| 8 | 7 | The three doors section, then the Rebuild Arc dates block | $149 / $15, the seat counter, October 31 and February 7 |
| 9 | any | thepracticevillage.org in a clean address bar, for the end card | The domain, readable |

**Do not capture:** the Stripe checkout page (its logo is a third-party trademark). Show your own pricing cards instead and say "checkout is live." Same rule for any partner logo, app store badge, or platform mark that is not yours or Google's.

### Four things I found walking it, that will bite the capture

1. **Sign in with a real member account, not the test one.** The test account prints "Test account" on the voucher card and "Test access does not create or use workshop vouchers." Judges reading that in frame will wonder what else is a test.
2. **Wait two seconds after each page loads before you roll.** Rooms fade in on scroll reveal. My first Kitchen screenshot was an empty cream page; the second, moments later, was the full room.
3. **The Record is already full.** Eleven kept cards with real sources, steps, and dates. Nothing to seed. Safety Hall is the one that needs an entry or two so the pattern log is not empty.
4. **The Moxie card in the member map says "Member entrance being confirmed."** True and honest, but it is the wrong frame to hold on screen while the voiceover calls Moxie the flagship room. Cut from Gabby's studio footage straight to the next beat, and do not linger on that card.

### For Gabby — Moxie Studios footage request

Twenty seconds of usable material, cut to about twelve:

1. The mirror reading a pose, on-screen guidance visible, from a camera angle where a viewer can see both the practitioner and the screen feedback.
2. A tight shot of the guidance updating as the pose corrects.
3. One clean frame of the Moxie Studios room inside the Village so the room reads as part of the building.

Requirements: no third-party marks in frame, no recognizable music playing in the room, 1080p or better, and it must show the on-device behavior we claim, since the script says the video never leaves the machine.

---

## Part 4 — Before you upload

- [ ] Runtime under 3:00. Check the export, not the timeline.
- [ ] Music is yours or royalty-free, and you can produce the license.
- [ ] No third-party trademarks in any frame, including reflections and browser tabs.
- [ ] Captions on. Judges watch muted more often than anyone admits.
- [ ] Public on YouTube, not unlisted, and the link opens in a private window.
- [ ] End card: thepracticevillage.org · Practice Village by AIdedEQ · Build with Gemini XPRIZE, Education & Human Potential.
- [ ] Revenue and member numbers in beat 7 filled with real figures, and the same figures appear in the written evidence pack.
- [ ] The Gemini call is working on prod on the morning you submit. One curl before you upload:

```bash
curl -s -X POST https://thepracticevillage.org/concierge -H 'content-type: application/json' -d '{"messages":[{"role":"user","text":"I moved for a job and I do not know where to start."}]}'
```
