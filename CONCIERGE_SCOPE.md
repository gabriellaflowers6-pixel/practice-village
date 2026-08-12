# The Concierge: Scope

**Drafted 2026-08-12 for JoYi + Gabby markup. Status: OUTLINE, not approved.**
The Concierge is the front desk of a digital community center. It is not a chatbot with a personality. It is the person at the YWCA desk who knows every room, every program, and every trustworthy place in town, and who never pretends to be a lawyer, doctor, or caseworker.

---

## The three tiers (approved by JoYi 2026-08-12)

- **Tier 1 · In-house.** Tools and practices we own and run: the rooms, the Record, the triage loops, the email pings. Where the answer is internal (authentic responsibility), this tier IS the answer.
- **Tier 2 · Live-fetched.** Free, non-commercial, authoritative sources reached by API or grounded search, localized to her zip/state, always carrying source + date + official link.
- **Tier 3 · Guided-out.** When the answer lives outside our map: the Concierge writes her the exact search query or AI prompt, names the sites to trust, previews what the form or process will ask, and walks her through it. We never lose her at the edge of our map; we hand her a compass and stay on the line.

## Governance (applies to every room, every tier)

1. **Route, never determine.** No eligibility calls, no diagnoses, no legal opinions, no "you qualify."
2. **Never done-for-you.** No form filling, no applications submitted, no background checks run. We teach the official free tool instead; that is the product, not a limitation.
3. **Sources must be free, non-commercial, no-upsell.** Prefer .gov, .edu, WHO, and nonprofits that do not sell. No affiliate anything, ever.
4. **Every fetched fact carries its source and date checked**, with the official link beside it.
5. **Consent-led.** Intake sharpens routing; nothing saves to the Record without her choice.
6. **Crisis floor everywhere:** 911 / 988 / National DV Hotline (800-799-7233), said once, gently, when the conversation calls for it.
7. **US-centric v1.** Everything tagged state/zip so expansion is data work, not rebuild.
8. **Values lines that never move:** plant-forward by addition not subtraction; we will NEVER build "ethical meat consumption" guidance (no such thing here); no calorie/diet/subtraction framing anywhere.

---

## Room by room

### Front Desk (the Concierge itself)
- **T1:** Intake-aware conversation per the MVP spec: one reflection, one next-best question, choice menu (Understand / One action / Trusted resource / Save / Keep private). The Record. Session context so "what does this mean?" refers to what's on screen.
- **T2:** Orchestrates every lookup below; Gemini API with Google Search grounding for the long tail.
- **T3:** The "search with me" mode, available in every domain.

### Money (lives at the Front Desk until it earns a room)
- **T1: Dynamic money triage.** Her real numbers once (intake, consent). A this-week plan: what's due, what moves, the one call to make. **Resend email pings** on her stated goal; her reply updates the Record. Adapted from CFPB's public-domain *Your Money, Your Goals* curriculum, cited. Not a static sheet; a loop.
- **T2:** CareerOneStop (DoL) training finder + American Job Centers by zip (real local financial/career classes, free coaching centers). HUD/CFPB housing-counselor API (HUD-certified, fiduciary, free). FDIC BankFind + NCUA locator (low-fee banking). IRS VITA locator (free tax prep by zip).
- **T3:** State benefit portals (SNAP, Medicaid, LIHEAP): query written for her, .gov-only rule taught, document checklist previewed before she starts the form.

### Safety Hall
- **T1:** What Keeps Happening (the pattern log / microaggression tracker, built, deploying). Six-dimensions safety planning. Scam-literacy training: the romance-scam and grandparent-scam red-flag checklists, taught as skills, in her Record when she chooses.
- **T2:** SAMHSA findtreatment.gov API. Legal Services Corporation grantee data (the free legal-aid org covering her county). Eldercare Locator for elder-safety concerns. FTC scam alerts (public data).
- **T3 (the dating-safety answer):** We do not run background checks; that claim is banned. Instead the Concierge walks her through the government's own free tools: **NSOPW.gov** (the DOJ national sex-offender public search) step by step for her zip; **reverse image search** (Google Images/TinEye) on a suspicious profile photo, click by click; the FTC romance-scam checklist against the conversation she's actually having; where to report (IC3, FTC). Five minutes, her hands on the official tools, a skill she keeps. Registry data carries legal use restrictions, which is exactly why teaching the official search beats wrapping it.
- **Never:** run checks on people, hold registry data, or output "this person is safe."

### The Kitchen (PlantLuck)
- **T1:** PlantLuck itself: pantry-first weekly planning, cooking-forward, addition not subtraction. Neutral voice, no family copy, no calories.
- **T2:** NutritionFacts.org (free, science, non-commercial; JoYi's go-to), WHO and CDC nutrition guidance, **USDA FoodData Central API** (free nutrition facts), USDA SNAP-Ed recipe library (public domain), SNAP retailer + farmers-market locator APIs, food bank routing.
- **T3:** Local pantry schedules, WIC office walkthroughs.
- **Never:** meat-consumption guidance of any kind, subtraction framing, diet culture.

### The Quiet Room (HUSH)
- **T1:** HUSH. Sixty seconds, free, no account.
- **T2:** Only free-use, non-selling mindfulness sources: UCLA MARC free guided meditations, Palouse Mindfulness (free full MBSR course), Healthy Minds Program (nonprofit, free), NIH/NCCIH evidence pages, VA mindfulness apps (free to all). **Exclusion rule: any platform whose free tier exists to sell a subscription does not get routed.**
- **T3:** How to evaluate a meditation app before giving it money or data.

### Moxie Studios *(P1: naming sweep everywhere — PV nav and room card still say "Moxie Studio")*
- **T1:** The Studio: guided practice, the mirror that never records, Bott Om, JoYi's curriculum lock.
- **T2:** CDC/WHO physical-activity guidance, National Institute on Aging exercise resources (free, made for midlife+ bodies), MedlinePlus for pain/condition basics.
- **T3:** Evaluating a local studio or trainer (what to ask, what a beginner class should feel like).
- **Never:** medical clearance claims, diagnosis of pain.

### RAW + The Circle (inner work)
- **T1:** Almost entirely in-house, deliberately: the Rebuild Arc, the MF method under its Village names, quarterly RAW workshops. This is the room where the answer is internal.
- **T2:** Sparingly: NIH/MedlinePlus on grief and stress physiology when she asks "is this normal."
- **T3:** Finding a therapist (Psychology Today filters taught, sliding-scale questions scripted, what to ask in a consult call).

### The Commons (connection / social fitness)
- **T1:** Circles, matched by season of life (the long-term big bang). Social-fitness practices as curriculum.
- **T2:** Area Agencies on Aging social programs, public library event calendars (free, everywhere, underused).
- **T3:** How to find the free things in her town nobody told her about (library, park district, community college).

### Health / My Body (cross-room, lives at the Front Desk)
- **T2:** MedlinePlus Connect (NIH), Office on Women's Health (womenshealth.gov) menopause resources, NIA aging-health pages.
- **T3:** The doctor-visit prep: her symptoms written into the questions to bring, the "what to say when dismissed" script.
- **Never:** diagnosis, treatment, medication guidance.

### Caregiving (cross-room)
- **T2:** Eldercare Locator / Area Agencies on Aging (respite programs by county), ARCH respite network, VA caregiver support if the person she cares for served.
- **T3:** The caregiver-grant landscape for her state, searched together.

---

## The pipeline (how the library stays alive without hand-curation)

Source registry (the APIs + vetted orgs above) → scheduled fetch jobs (the Roo infrastructure pattern: scheduled functions + digest + review queue) → **human review gate before anything goes live** (same accept/reject discipline as the pose library) → Supabase `resources` table (domain, state, zip, source, date_checked, status) → Concierge queries the table first, grounded search second, guided-out third. Every fetch logged: this pipeline is itself AI-native-operations evidence.

## Intake (what makes a member's Concierge sharp)

State + zip · domains she wants help with (the room list as checkboxes) · situation in her words · consent choices (what the Concierge may remember). Nothing medical, nothing extractive. Members get the sharpened Concierge; visitors get the demo.

## Build phases

- **P1 (this week, XPRIZE):** This scope approved → demo card rebuilt to the MVP-spec conversation (reflection / question / choice menu) → Tier 3 live in every domain (it's prompt + routing work, no new infrastructure) → two flagship Tier 2 APIs wired (CareerOneStop + HUD counselors) → Moxie Studios naming sweep → guardrail suite rerun.
- **P2 (post-submission):** Resource pipeline + review gate, intake for members, remaining Tier 2 APIs, dynamic money triage with Resend pings.
- **P3:** Dating-safety walkthrough polish, Commons matching, state-by-state depth, non-US expansion.
