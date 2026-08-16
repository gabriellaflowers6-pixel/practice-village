# Practice Village — XPRIZE demo video

**Deadline:** Sun Aug 17, 2026, 1:00 PM PT · **Runtime:** cut to length from the recorded audio (hard cap 3:00)
**Entry:** Practice Village · Build with Gemini XPRIZE · Education & Human Potential (Track 01)
**Production order (JoYi's call):** script → voice + camera first → screen capture cut to match. Gabby supplies Moxie Studios footage.

---

## Part 1 — The overview

### What the judges score

Three equal thirds. The script hits each one on purpose, in this order.

| Third | Where the video earns it | Seconds |
|---|---|---|
| **Category impact** (Education & Human Potential) | Moxie teaching a beginner privately, Safety Hall, the Record she downloads, the Hilo credential | 1:04–2:11 |
| **AI-native operations** | The Concierge on Gemini, she picks the help, the live HUD lookup from the official source, the refusals built in | 0:18–1:04 |
| **Business viability** | Rooms open, memberships sold, pricing, workshop and February dates | 2:11–2:32 |

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

## Part 2 — What a demo script has to do

Judged demos are not marketing videos. Five rules, and the old draft broke the first one.

1. **The product runs by 0:20.** A judge watching thirty entries decides early whether this is real. The old cut spent 46 seconds on backstory before anything moved on screen.
2. **One person, one problem, start to finish.** Not a tour of rooms. Follow one woman through one real flow and let the other rooms appear as she needs them.
3. **Name the required tech out loud.** Gemini is a pass/fail gate. Say it plainly, once, early.
4. **Say what is open and what is not.** Judges punish overclaiming and reward a builder who draws the line herself.
5. **Founder story is evidence, not an opening.** It answers "why should she be the one building this," which is a question the judge asks after they believe the product, not before.

So the story moved to 1:50, where it lands as proof. If you want it back at the top, it is a copy and paste.

---

## Part 3 — The script

Read at your own pace. I will time the recorded takes and cut to fit, so ignore the second counts below when you are in the booth.

### 1 · CAMERA · ~18s

> When somebody finally asks for help, they get sent from one place to another until they quit trying. I built Practice Village so that stops.
>
> It is a digital community center for women rebuilding parts of their lives. One membership, a lot of rooms, and real help inside them.

### 2 · SCREEN · the Concierge · ~46s
*[Signed in at /member. Let her type the problem on screen. Do not narrate what she typed.]*

> Every room shares one front desk, and the Concierge there runs on Gemini.

**[pause — the answer lands]**

> It tells her what is going on in plain language, then she picks the kind of help she wants. She decides, not the machine.

**[pause — she picks one small action]**

> She asks for one thing she can do today, and it gives her one. Nothing is saved unless she says keep.

**[pause — the zip lookup returns counselors]**

> When she needs somebody local, it pulls HUD-certified housing and money counselors by zip code, straight from the official source, while she waits.
>
> It will not tell her she qualifies for a benefit, fill out her forms, or give her legal or medical advice. We built those limits in on purpose, because people act on what AI tells them.

### 3 · SCREEN · Moxie Studios · ~23s
*[Gabby's footage: the practitioner and the form check both in frame.]*

> Moxie teaches beginner yoga and meditation. She is for the person who has not found a studio yet, or who has been in one and felt intimidated or irritated, and still knows this matters.
>
> She takes you through the basics, and the mirror is there so you can check your own form. It runs on your device, and nothing is recorded or sent anywhere.

### 4 · SCREEN · Safety Hall · ~24s
*[The entry screen with the exit and discreet view in frame, then the pattern log.]*

> Safety Hall is where you document a pattern you are noticing, before you decide what it means or what to do about it. No account, no AI in that room, and nothing leaves your device.
>
> What you write down now is what you will have later, whether it stays with you or goes to HR, a lawyer, or somebody you trust.

### 5 · SCREEN · Your Record · ~17s
*[A kept card with its sources, then the download.]*

> Everything she keeps lands in her Record: what she was given, what she did, and where it came from. She can download all of it.
>
> She should not have to rebuild her history from scratch every time she talks to somebody new.

### 6 · CAMERA · why me · ~21s

> I ran Moxie Fitness in Hilo until 2020. When the building closed, the community went with it.
>
> I spent my career in YMCAs, YWCAs, and community centers, so I know what these buildings do and I know what breaks. It is never the mission. It is the front line.

### 7 · SCREEN · where we are · ~21s
*[Pricing, then the dates.]*

> Four rooms are open today. We opened this month with a handful of memberships, on purpose, because the rooms had to be right before we sold them.
>
> It is one hundred forty nine dollars a year or fifteen a month. The first workshop is October 31, and live classes start February 7.

### 8 · CAMERA · ~8s

> Safety Hall and HUSH are free right now, no account.
>
> thepracticevillage.org. Walk in.

---

### What came out of the old draft

Every line that described what the screen was already showing. The Concierge beat used to narrate the typed question; now she types it and you stay quiet. The Village definition beat is gone entirely, because beat 1 already says what this is and the room map says the rest.

"One clear step, and it asks before it keeps anything" and the rest of the clipped fragments are gone. Every line is a sentence a person says.

The three-sentence backstory opening is now a twenty-second credential at 1:50. Same words, different job.

## Part 5 — Before you upload

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
