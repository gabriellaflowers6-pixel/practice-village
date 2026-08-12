# Practice Village — Next Session Handoff (written 2026-08-11 midnight)

## Where things stand
- Repo: github.com/gabriellaflowers6-pixel/practice-village (private; joyirhyss-tech
  has write). Local canonical: ~/dev/practice-village. First commit = the old live
  site as deployed; diff against it for everything.
- LIVE site = 10:41pm flip-fix deploy. ~16 commits since are NOT deployed. Review at
  localhost preview, then: netlify deploy --prod --dir . --site aae16881-7774-4d75-a7f2-6065e8c2e45d
- Read WORKLOG.md top to bottom for tonight's full decision trail.

## RESOLVED 2026-08-12: Stripe links live and wired (see WORKLOG). Was: The one blocking item: STRIPE
script.js CONFIG needs stripeVillager ($149/yr) and stripeMembership ($15/mo) payment
links from JoYi's Stripe, plus seatsTaken as sales land. Until then paid buttons route
to the Charter List with a note. This is the entire checkout flip: one file.

## Open threads, in order
1. Deploy the staged 16 commits after JoYi's morning-eyes review.
2. Stripe links -> paste -> redeploy (also aidedeq store buttons if desired).
3. aidedeq repo has 2 committed UNPUSHED commits (Cur.AI.ted store-card starter-tier
   line + deploy log). Push to main deploys them.
4. Cur.AI.ted starter-tier design (protect Gemini/API costs) - separate session.
5. RAW redeem-code mechanics - separate session.
6. Mid-scroll creativity on the Moxie Studio PAGE (/moxie-studio/) was reviewed; the
   PV homepage mid-scroll got tonight's pass. Revisit after fresh eyes.
7. XPRIZE gates (JoYi's launch plan): Gemini deploy on Moxie app, Vertex flip, Devpost
   naming, submission assets. Deadline Sun Aug 17, 1pm PT; internal target Aug 14-15.

## Verification habits that saved us tonight
- The embedded preview pane throttles IntersectionObserver when occluded: reveals never
  fire, screenshots go stale, layout looks broken when it is not. Verify with DOM rect
  measurements, or keep the pane visibly fronted.
- Assets edited in place (same filename) hide behind browser cache: bump ?v= on the img.
