# Practice Village Projects — PRD

**Version:** 2 · 2026-09-01
**Supersedes:** `~/Downloads/Practice_Village_Projects_Concierge_PRD_Process.md` (v1 process brief — kept for reference, do not build from it)
**Companion doc:** `On_and_Off_the_Zafu_Season_One_Podcast_Outline.md` (the "Belief, Lived" season — the first real project this feature must serve)
**Status:** Decisions locked with JoYi 2026-09-01. Audit next, then build.

---

## 1. What this is

Add a **Project lifecycle** to the existing Practice Village Concierge. Not a podcast room, not a new Village room, not a standalone tool. A reusable system: a member brings something she wants to do, and the Concierge helps her audit what she has, research what's missing, decide, build, and distribute it — producing real artifacts along the way.

**Mental model:**
- The PIL remembers the person.
- The Project remembers the work.
- The Concierge connects the two and removes obstacles.

**First real test:** JoYi uses it to plan and launch *On and Off the Zafu* Season One ("Belief, Lived") — screen-recorded start to finish for marketing.

---

## 2. Decisions locked (2026-09-01)

1. **Scope = Slice 1 + distribution plan.** Full project lifecycle with artifacts, hooks, scripts, and export. Canva / NotebookLM / Blotato ship as **handoff packs**, not live integrations. Never fake an integration.
2. **Conversation-first entry.** No "New Project" form, no mid-conversation ask. The Concierge helps with whatever the member brought. At the **end of the session**, a button appears: **"Open this as a project."** A button, not a question.
3. **No LLM-speak anywhere.** No "carry," "I'd love to," "great question," "let's dive in," no negation-leads, no fragment percussion, no hollow filler. Audit `MOXIE-COPY-RULES.md` and JoYi's copy-voice rules; they are the rulebook for all Concierge copy.
4. **No assumed emotional state.** Members arrive stuck, ready, returning, or revamping. Copy never presumes "stuck." The intake reads all four states naturally.
5. **Name things by what they are.** Audit output says "10 episode run-of-show maps, a record-day one-sheet, a season outline" — never vague labels the member has to decode.
6. **Momentum, not compliments.** Motivation comes from found material, a named blocker, a shrunken next action, and a first artifact made in the same session. No cheerleading.
7. **PIL uses the Village's existing consent flow.** Nothing new invented. Find the current flow during audit and route Project-derived suggestions through it exactly.
8. **The test is recorded in one continuous take.** Marketing capture is planned from the beginning — see §10.

---

## 3. Audit first (before any code)

Map the existing repo and live flows. Do not duplicate anything that exists.

- [ ] Framework, routing, current Concierge architecture (`CONCIERGE_SCOPE.md`)
- [ ] PIL architecture, storage, and the **existing PIL consent flow**
- [ ] Auth/user model, database schema
- [ ] Existing rooms/tools, reusable UI components
- [ ] Any existing project/task/asset structures
- [ ] Copy/voice files (`MOXIE-COPY-RULES.md` + JoYi's copy rules)
- [ ] Current analytics/events
- [ ] Existing connectors/integrations

Document architectural decisions and any new dependencies (check maintenance, licensing, security, lock-in, and whether we already have an equivalent). Move from audit to a working vertical slice quickly — no giant speculative architecture document.

---

## 4. Entry and session flow

1. Member talks to the Concierge as she already does. She may be starting something, resuming something, or revamping something she built long ago.
2. The Concierge does useful work in the conversation itself — no gate.
3. At session end, if the conversation was project-shaped, the button appears: **"Open this as a project."**
4. Opening a project preserves everything from the conversation — nothing is re-asked.

---

## 5. Intake (inside the project, 3–5 questions max)

Questions arrive one at a time, conversationally:

1. What are you trying to make, change, solve, or finish?
2. Who is it for, or who is affected?
3. What would "done enough to move" look like?
4. What's the biggest obstacle right now? *(obstacle — not "what's blocking you"; the ready member answers "nothing, I have time now" and that's a valid answer)*
5. **Before asking:** the Concierge searches what it's already authorized to see — PIL cards, past Village conversations, prior projects — and leads with findings. Then: "Anything you already have? Drag files in, paste links, or say no." **The drop zone is in the chat.** No separate upload screen. Uploads become **project assets**, never PIL.

---

## 6. IAMAR flow (Choice for Peace as decision architecture)

Not five screens of homework. The flow moves: *what I want → what deserves attention → what it means → how I approach it → what I'm doing now.*

**INTENTION →** Project Intent Card: project, why it matters, who it's for, done-enough definition, current constraint, first milestone.

**ATTENTION →** the Concierge does the heavy lifting. Reads assets and authorized context, returns four lists — **Already Have / Missing / Noise / Blockers** — plus Unknowns Worth Researching. Everything named concretely. Includes the Pattern + Gap Scan for meaningful projects (3–7 high-signal precedents: what to borrow, what to avoid, our useful difference). Research stops when more research won't change the decision.

**MEANING →** Meaning Brief: problem, for whom, current alternative, useful difference, promise, evidence/assumptions, what we refuse to become. This is the spine for both build and marketing.

**ATTITUDE →** operating posture: collaboration style, decision rights, voice, quality threshold, what stays human, what AI appropriately does. For collaborations: owners, roles, dependencies, consent, IP, exit process. When progress has quietly become contingent on another person, the Concierge names the dependency and offers a path that keeps the member moving without dropping the collaboration.

**RESPONSE →** milestones, tasks, smallest useful experiment, next action — and a **real artifact created in the same session** (brief, outreach draft, script, research pack, launch calendar…). The session never ends with "here's what you should do."

**Recommendations, not menus.** Show a recommendation with the reason, the meaningful tradeoff, and what would change it.

---

## 7. Distribution Track (auto for public-facing projects)

If a project is public-facing, distribution is part of finishing it — no "would you like marketing help?" The member can reduce or disable it.

This slice produces:

- **Positioning** (from the Meaning Brief)
- **Marketing Source Bank** — mined from the real work: decisions, quotes, failures, questions people keep asking. Never generic "10 posts about my product."
- **Hook Bank** — 10 raw hooks scored across jobs (curiosity, contradiction, useful warning, before/after, confession, concrete result…), top 3 recommended with reasons and platform fit. Reject fake urgency, unsupported claims, LLM-coded vagueness, anything that loses the member's voice.
- **One short script** (30–60s talking head) in the member's voice, loaded from her voice rules and approved copy.
- **Launch/content plan**
- **Handoff packs** (no live integrations this slice):
  - `canva_brief.md` — size, hierarchy, exact copy, visual direction, source images, CTA, accessibility notes
  - `notebooklm_source_pack.md` — sources, source notes, contradictions, questions to ask, angles, facts to verify
  - `blotato_plan.md` — platforms, queue, captions, suggested schedule, draft-only default
- **Build-to-Content Log** — when something meaningful happens in the project, the Concierge can offer: save this to the Content Bank? (a decision, a failure, a before/after, a moment the member changed her mind)

Slice 2+: live Canva/Blotato connections (official OAuth, minimum scopes, draft+approval default, no silent publishing, no password storage), analytics learning loop, connected sources.

---

## 8. PIL intersection

Project data stays in the project. A PIL candidate must pass three gates:

1. **About her, not the work** — a pattern of the person, not a fact of the project.
2. **Portable** — would change how she approaches a different project.
3. **Recurred or confirmed** — observed at least twice, or stated plainly by the member.

Candidates are offered at natural pauses (end of a phase, never mid-flow) and routed through the **Village's existing PIL consent flow**. The member approves, edits, or declines. She can view, edit, and delete every card.

**Export:** the whole project as useful Markdown (brief, plan, research pack, marketing pack, decisions, learnings) — usable by any AI or human collaborator without Practice Village.

---

## 9. Data model

Audit current schema first; reuse existing primitives where they're better. Conceptually:

```
Project { id, ownerId, title, description, publicFacing, status,
  intention{}, attention{}, meaning{}, attitude{}, response{},
  people[], assets[], links[], decisions[], sourcePack[],
  marketingPlan, learnings[], pilCandidates[] }
```

Statuses: Idea · Active · Waiting on someone · Ready to test · Ready to launch · Live · Learning · Complete · Paused. A blocked project names the blocker's type (informational, decision, technical, administrative, marketing, relational) and what can still move anyway.

---

## 10. The recorded test — ZBO Season One, "Belief, Lived"

**The project object is the new season** (see companion outline): a 10-week practice circle of 6–8 women across traditions, Choice for Peace as curriculum, Jessica/Holy Sssh as parallel experiment, episodes edited from session material. The run of show is being refined in a separate Q&A with JoYi; the project test does not wait for it.

**Entry state: ready, not stuck.** JoYi's real framing: "I built this ecosystem, I have time now, and I'm using it to relaunch the podcast." She runs the flow exactly as any member would — nothing pre-loaded, she drops her real material (season outline, ZBO Production kit) into the chat when asked.

**Capture: one continuous screen recording**, intake through export. Clips get pulled afterward. If something breaks, re-run the segment; never fake a moment.

### Show & Tell — the take must contain these moments

1. The conversation flowing naturally with no project ceremony
2. The **"Open this as a project"** button appearing at session end
3. The search-before-ask moment: the Concierge leading with what it already found
4. Dropping the real ZBO material into the chat
5. The **Attention reveal**: Already Have / Missing / Noise / Blockers, everything named concretely
6. A recommendation with reason + tradeoff (not a menu)
7. The **first artifact** created in-session
8. The Hook Bank generating, and a hook being rejected for voice
9. A script in JoYi's actual voice
10. A handoff pack being produced (Canva brief or Blotato plan)
11. A PIL suggestion going through the consent flow — and JoYi editing or declining one
12. The Markdown export

What the test measures: did the Concierge reduce work, find what she already had, make recommendations, produce tangible things fast, and keep her in control — **did the project move?**

---

## 11. Acceptance criteria (this slice)

A member can:

1. Reach a project through a natural conversation and the end-of-session button
2. Complete intake in ≤5 questions with the in-chat drop zone
3. See a concise IAMAR-based Project Brief
4. Get the four-list Attention audit with concrete naming
5. Trigger a Pattern + Gap research step
6. Receive a recommended first milestone + next action
7. Get at least one real artifact in the same session
8. (Public-facing) get positioning, Hook Bank, one script, launch plan, and handoff packs automatically
9. Keep project data separate from PIL; approve/edit/decline PIL suggestions via the existing consent flow
10. Export the whole project as Markdown

All copy passes the no-LLM-speak sweep and assumes no emotional state.

---

## 12. Related docs

- `CONCIERGE_SCOPE.md` — existing Concierge architecture (audit input)
- `MOXIE-COPY-RULES.md` — copy rulebook (audit input)
- `On_and_Off_the_Zafu_Season_One_Podcast_Outline.md` — the season this feature serves first
- v1 process brief in Downloads — superseded, reference only

---

## 13. Friction map — traditional process vs. the Village (added 2026-09-02)

The differentiation claim, stated honestly. "Native" = the Village does it. "Prepared" = the Village
does the thinking and hands her a pack she executes in her own tool. Nothing here pretends an
integration that does not exist.

| Traditional best practice | The friction | What the Village does instead |
|---|---|---|
| Research the field: courses, YouTube, 47 tabs | Weeks of procrastination disguised as research | Attention audit reads HER material first; pattern scan gives 3-7 precedents with borrow/avoid; research stops when it will not change a decision (native) |
| Gather scattered notes and docs into one place | Files everywhere, work redone | Drop zone; every file named for what it is and used, never re-explained (native) |
| Write a plan or PRD from a blank page | The blank page kills the project | IAMAR conversation builds intent card, meaning brief, and a real PRD from what she already said and dropped in (native) |
| Keep asking "what do I do next" | Momentum dies between sessions | One concrete next action, always current; the project remembers the work across visits (native) |
| Wait on a collaborator | Progress becomes someone else's calendar | Blocker named by type; an independent next move offered without dropping the collaboration (native) |
| "Do the marketing" as a separate scary discipline after building | Blank-page marketing, generic AI copy | Public-facing projects get distribution as part of finishing: positioning, hooks, scripts mined from the real work in her voice (native) |
| Re-explain the project inside every tool: design app, research app, scheduler | The same decisions re-made five times | Handoff packs carry the decisions in: Canva brief with exact copy, NotebookLM source pack, Blotato queue plan. She never re-decides messaging inside a tool (prepared) |
| Lessons evaporate when the project ends | Every project starts from zero | Decisions log in the project; portable personal patterns offered to the PIL through the existing consent review; the next project starts warmer (native) |
| Your work lives inside someone's platform | Lock-in | One-click Markdown export: the whole project stands alone, usable with any AI, developer, or collaborator. Autonomy is the product (native) |
| Tools quietly keep everything you type | Consent as afterthought | Nothing reaches the Record without her choice at wrap-up; keep-private interrupt always available (native) |

**The space:** community platforms offer rooms and content; project tools (Notion, Asana) hold plans
the user must think up; chatbots wait for good prompts; AI copilots have no lifecycle, no consent
layer, no community. The Village front desk walks a woman from "I want to do this" to a shipped,
distributed, exportable thing, and the work stays hers. That is the digital community center
difference.

## 14. Walkthrough v2 — the full recorded arc (replaces the 12-moment list as the master plan)

JoYi records this over multiple sessions, one continuous take each. Transparency rule: she vibecodes;
Claude is on camera as her build partner where that is true. The Village prepares; her tools execute.

**Session A — cold start to PRD (in the Village)**
1. Fresh desk conversation in her words; things set aside; wrap-up; "Open this as a project"
2. The system knows nothing about the podcast until she IMPORTS HER FILE: season outline dropped
   into the room, named concretely by the audit
3. Attention audit: already have / missing / noise / blockers
4. "Build the PRD" and the prd artifact lands, drawn from her file and answers
5. First tangible artifact beyond the PRD (recruitment invitation exists; next is her call)

**Session B — record the first episode (outside the Village, per the ZBO kit)**
6. GarageBand session per the run-of-show one-sheet; the Village project holds the checklist and
   logs the decision when the episode is in the can

**Session C — marketing, transparent toolchain**
7. Village produces the marketing source bank + hook bank + script from the real project
8. NotebookLM: source pack handed off; grounded synthesis on camera
9. Canva: brief handed off; assets made without re-deciding messaging
10. Remotion with Claude: vibecoding the promo video on camera, driven by the Village hook/script
11. Blotato: distribution plan executed; drafts + approval before anything publishes

**Session D — the loop closes**
12. Results discussed back in the project; learnings logged; PIL suggestions through consent review
13. Full Markdown export shown leaving the Village: the standalone project, autonomy on camera
