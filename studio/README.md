# Moxie Studios, the practice app

Everything in this folder is the built studio: the member dashboard, lesson
library, guided practice with the pose mirror, meditations, live classes,
settings and profile. It is static, so Practice Village serves it as-is at
`/studio/` and the existing `npm run build` does not touch it.

## Where it comes from

The source lives in `gabriellaflowers6-pixel/moxie-studios`, branch
`agent/combine-joyi-source`, under `mockups/`. This folder is the output of
`deploy/build.sh` in that repo, minus its `_redirects` file, which is left out
on purpose: it maps `/` to the live-class lobby and would take over the
Practice Village home page.

Until the source moves here too, a change to the studio means rebuilding there
and recopying, so treat this folder as generated rather than edited.

## It works from a folder, not just a site root

Pages resolve their endpoints against wherever they were served from
(`studio-base.mjs`), and the five functions the studio calls each answer at two
paths, the root and `/studio/...`. That is what keeps the studio from claiming
`/coach` or `/schedule` at the root of a site that already has its own app. If
this folder is ever renamed, update the `path` arrays in those functions to
match.

## Environment variables it needs

| Variable | Used by | For |
|---|---|---|
| `GEMINI_API_KEY` | `/coach`, `/live-token` | the written coach and the spoken Live Guide |
| `GEMINI_MODEL`, `GEMINI_LIVE_MODEL`, `GEMINI_BACKEND` | same | model selection, optional |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | `/auth-config` | browser sign-in |
| `SUPABASE_SERVICE_KEY` | `/schedule`, `/signups` | class schedule and signups, server-only |

Without them the studio still loads and the pose mirror still works, because
the pose model runs entirely in the browser. The coach, the Live Guide, sign-in
and the class schedule are what go quiet.

## Not included

The studio's own membership functions are deliberately absent. Practice Village
already owns membership, and one of them declares `/stripe-membership-webhook`,
the exact route `netlify/functions/stripe-membership-webhook.mjs` already
serves here. Shipping it would have put two handlers on the live Stripe
webhook.
