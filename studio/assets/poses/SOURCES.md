# Guided-practice pose figures — sources

**One figure only: the Moxie girl.** The WebP renders are the approved
dark-amber direction and are the ONLY pose art permitted.

**Deleted 2026-08-14, on Gabby's instruction, never to return:** every `.svg` in
this folder. They were not her. Most were a stock cartoon character in a red top
and blue shorts with pale skin, and `warrior.svg` plus `pose-fallback.svg` were
literal stick figures. Because `poseArtSource()` preferred a WebP whenever one
existed, a single lesson changed person from pose to pose. A test in
`mockups/pose-art.test.mjs` now fails if any SVG reappears here.

**A pose with no Moxie render shows its name on the glow**, never a borrowed
figure. Still awaiting a render, in priority order (the first three are core
First-30-Days material): `tabletop`, `child`, `dog`, `plank`, `seatedfold`,
`highlunge`, `boat`, `locust`. The list is also exported as `AWAITING_MOXIE_ART`
from `mockups/pose-art.mjs` so it cannot drift from the code.

## Gabby-supplied line-art replacements (2026-08-11)

Source: ChatGPT-generated PNGs supplied in Gabby's Downloads folder, visually
audited against the current 32-pose vocabulary, then resized to 960×720 WebP at
quality 84 for lesson performance. Mappings: `birddog`, `bridge`, `chair`,
`cobra`, `easyseat`, `forwardfold`, `mountain`, `savasana`, `sideangle`, `tree`,
and `warrior`. Cat/Cow uses both `catcow-cat.webp` and `catcow-cow.webp`; the
guided player alternates them across breaths.

Second audited batch: added `eagle`, `dancer`, `warrior3`, `triangle`, and
`halfmoon`. Three repeat downloads were byte-for-byte duplicates. A new Warrior
II was also anatomically correct, but the existing approved Warrior II was
retained because it is equally legible and preserves more variety in body
representation.

Not imported from the same download set: Low Lunge and Half Lift are outside
the current vocabulary. The image labeled Seated Fold depicts Child's Pose, so
its baked-in label conflicts with the anatomy and it was rejected rather than
shown under the wrong lesson pose. Five duplicate downloads were also omitted.

## Interim SVG figures

- Source: SVG Repo "Yoga Poses" collection — https://www.svgrepo.com/collection/yoga-poses/
  Individual files fetched from https://www.svgrepo.com/show/<id>/yoga.svg
- Uploader/generator noted in each SVG comment ("SVG Repo Mixer Tools").
- LICENSE: verify per-icon before shipping publicly. SVG Repo hosts icons under
  mixed licenses (CC0 / MIT / CC BY). Attribution page: mockups/practice-credits.html.
  For the hackathon submission, either confirm each is CC0/attribution-OK or swap
  to the line-art set.

## label -> svgrepo id (mapped by visual identification; audited at large size)
easyseat=16702  catcow=24621  tabletop=115262  mountain=13955  tree=9883
chair=37015  highlunge=42131  dancer=28077  dog=42629  forwardfold=42630
plank=42627  boat=37017  child=24620  seatedfold=37013  locust=76076  savasana=36522

## Not yet mapped (the supplied sets lack a clean figure)
goddess, prasarita, camel, pigeon, happybaby, wheel, and legsupwall. All
remaining supported poses use the
intentional original Moxie studio figure
(`pose-fallback.svg`) rather than disappearing from a lesson card. The line-art
set will eventually give all 32 poses a dedicated figure.

## Replacements 2026-08-14

Gabby generated a batch of six and reviewed them side by side against the
existing renders. Two were better and were imported; four were kept out.

- **Standing Forward Fold** replaced. The new one reads more clearly.
- **Cobra** replaced.
- **Easy Seat** kept as it was. Two new versions (front and three-quarter)
  were rejected.
- **Mountain** kept as it was. Two near-identical new versions were rejected.

Import spec, matching the existing set: source 2390x1792, resized to 960x720 at
quality 84. Same 4:3 aspect, so a straight resize with no crop.

Note for the next batch: none of those six filled a gap, they were all poses we
already had. The still-missing list above is the one to work from. Every
generated image so far has the pose name burned into the bottom-right corner,
which the app has to crop off; asking for no caption would let the figure sit
better in the circle.

## Gap closed 2026-08-14: all 19 approved poses have her

Second batch of eight, generated to the brief and imported at the same spec
(source 2390x1792, resized to 960x720 quality 84, straight resize, no crop):
child, tabletop, dog, lowlunge, halfwaylift, plank, seatedfold, seatedtwist.

JoYi's approved curriculum is now fully covered: 19 of 19. `AWAITING_MOXIE_ART`
is empty. Poses in the wider classifier vocabulary (boat, highlunge, locust and
others) still have no art, but they are not in her lessons.

### FLAGGED, needs Gabby's decision

**`seatedtwist` and `seatedfold` appear to show the figure with no clothing.**
Every other render in the set has clear sports-bra and shorts lines; these two
do not, and under the app's gold treatment they read as nude. They are imported
and live locally, NOT pushed and NOT deployed. Either regenerate those two with
clothing specified explicitly in the prompt, or decide the line art is abstract
enough. Recorded here rather than quietly shipped.

Also worth noting: the second batch is dimmer at source than the first, most
noticeably halfwaylift, plank, seatedfold and seatedtwist. They survive the
treatment, but a brighter generation would sit better beside the earlier set.
Every image in both batches still has the pose name burned into the bottom-right
corner, which the app crops off.
