# Practice Village

A membership village for women rebuilding a life: after divorce, job loss, illness, caregiving, or starting over somewhere new. Every room teaches a skill. None of it is a course.

**Live site:** https://thepracticevillage.org
**Submission:** Build with Gemini XPRIZE, Education and Human Potential, Track 01
**Built by:** AIdedEQ

## Reviewer access

The landing page, pricing, privacy, and terms are open to anyone.

The member area is behind a login. Reviewer credentials are provided in the Devpost submission under "Try it out," and they open the full member experience: the Concierge, My Practice, and every room. No payment is required to use them.

Safety Hall is stored only in the reviewer's own browser, so anything entered there stays on that device.

## What it does

A member signs in and lands in one place. The Concierge is right there, already open, and asks what she needs help with today. She answers in plain language. It either helps her inside the Village, looks up a real service near her, or walks her out to a trustworthy site with the exact search already written.

Rooms she can walk into:

| Room | What it teaches |
|---|---|
| The Concierge | Naming what she needs and finding the next concrete step |
| Safety Hall | Recording what happened, seeing patterns, separating what is hers to carry |
| The Kitchen | Cooking mostly plants from what is already in the house, plus finding food nearby |
| HUSH | Getting back to calm on purpose, in sixty seconds |
| Moxie Studios | Yoga and meditation with real-time posture feedback |
| cur.AI.ted | Finding the story inside her own camera roll |
| Her Record | Keeping what she chose to keep, portable, downloadable, hers |

## Architecture

Static front end, Netlify Functions for everything that touches a person.

- **Pages that hold member data are server-rendered functions**, not static HTML. There is no client-side gate to bypass. `netlify/functions/member*.mjs`
- **Auth is Netlify Identity, invite only.** Roles live in server-controlled `app_metadata`, never in anything the browser can edit.
- **The Concierge is Gemini** (`gemini-flash-latest`) behind `netlify/functions/concierge.mjs`, with structured output enforcing a conversation contract: it asks one question at a time, names a source for every factual claim, and never invents a program or a phone number.
- **Two storage models, one promise.** The member Record travels with the membership and lives server side in Netlify Blobs. Safety Hall never leaves the device. `safety-hall.js`
- **Payment to access is one signed path.** A Stripe payment link fires a signature-verified webhook, which writes a membership record, sends an account invitation, and grants included access to cur.AI.ted through an HMAC-signed cross-product call. `netlify/functions/stripe-membership-webhook.mjs`, `netlify/functions/_shared/curaited-notify.mjs`
- **Members can end it themselves.** Stripe billing portal to cancel, and two separate irreversible actions: erase the Record, or close the membership and erase everything. `netlify/functions/member-account.mjs`
- **Moxie Studios** runs pose estimation in the browser with MediaPipe. Nothing from the camera is uploaded. `moxie-studio/`, `studio/`

## Repo map

```
index.html              Landing page
login.html              Member sign in
safety-hall.*           Safety Hall, on-device only
moxie-studio/, studio/  Moxie Studios practice app
member-auth.js          Member area behavior, bundled to assets/member-auth.bundle.js
assets/                 CSS, room art, bundled JS
netlify/functions/      Every server-rendered page and every API action
  concierge.mjs           The Concierge
  member.mjs              Member home
  member-record.mjs       Her Record
  member-practice.mjs     My Practice
  member-hush.mjs         HUSH, and its vetted shelf
  member-kitchen.mjs      The Kitchen, and its vetted shelf
  member-account.mjs      Billing, erasing, closing
  member-onboarding.mjs   First visit, and what she chooses to keep
  stripe-membership-webhook.mjs  Payment to membership to access
  record-export.mjs       Record as a PDF she can hand a therapist
  studio-session.mjs      Moxie Studios access
  _shared/                Membership lookups, approved resource shelves, PDF builder
emails/                 Transactional email templates
```

Design and product decisions are written down, not folklore: `PHASES.md`, `MEMBER_LOBBY_PRD.md`, `CONCIERGE_SCOPE.md`, `MOXIE-COPY-RULES.md`, `WORKLOG.md`.

## Running it locally

```bash
npm install
npm run build      # bundles member-auth.js
netlify dev
```

`npm run build` is required after any edit to `member-auth.js`. The member area reads the bundle, not the source.

### Environment variables

Names only. Values are never committed.

| Variable | Used for |
|---|---|
| `GEMINI_API_KEY` | The Concierge |
| `GEMINI_MODEL`, `GEMINI_BACKEND` | Which model the Concierge runs on |
| `STRIPE_SECRET_KEY` | Membership, billing portal, cancellation |
| `STRIPE_MEMBERSHIP_WEBHOOK_SECRET` | Verifying every webhook signature |
| `CURAITED_WEBHOOK_SECRET`, `CURAITED_WEBHOOK_URL` | Granting included cur.AI.ted access |
| `RESEND_API_KEY` | Transactional email |
| `NETLIFY_API_TOKEN`, `NETLIFY_SITE_ID`, `NETLIFY_IDENTITY_INSTANCE_ID` | Reading and writing member roles through the Identity admin API |

Netlify Blobs needs no key. It is provided by the deploy.

## License

Copyright AIdedEQ. All rights reserved. Shared with XPRIZE and Devpost reviewers for the purpose of judging this submission.
