import { POSE_KEYS } from "./coach-lib.mjs";

// ONE figure, ever: the Moxie girl renders. A previous set mixed her with a
// stock cartoon character in a red top and blue shorts, plus literal stick
// figures, so a single lesson changed person pose to pose. Those files are
// deleted and must never come back. If a pose has no Moxie render yet, this
// returns "" and the caller shows the pose name instead. A missing render is a
// commission to make, not a licence to borrow somebody else's figure.
const MOXIE_ART = new Set(["birddog", "bridge", "catcow", "chair", "child", "cobra", "dancer", "dog", "eagle", "easyseat", "forwardfold", "halfmoon", "halfwaylift", "lowlunge", "mountain", "plank", "savasana", "seatedfold", "seatedtwist", "sideangle", "tabletop", "tree", "triangle", "warrior", "warrior3"]);

// The art brief: JoYi's APPROVED curriculum poses with no render yet, ordered by
// the first day that needs them. Derived from moxie-approved-curriculum.json,
// not from the classifier vocabulary. Getting that wrong once already put three
// poses on the brief that her curriculum never uses (highlunge, boat, locust)
// while omitting three it does. A test recomputes this from the curriculum, so
// it fails rather than drifts. Empty since 2026-08-14: her curriculum is fully
// covered. Poses in the wider classifier vocabulary still have no art, but they
// are not in her lessons.
export const AWAITING_MOXIE_ART = [];

export function poseArtSource(pose) {
  if (pose === "catcow") return "assets/poses/catcow-cat.webp";
  return MOXIE_ART.has(pose) ? `assets/poses/${pose}.webp` : "";
}

export function poseArtSources(pose) {
  if (pose === "catcow") return ["assets/poses/catcow-cat.webp", "assets/poses/catcow-cow.webp"];
  const source = poseArtSource(pose);
  return source ? [source] : [];
}

export function hasDedicatedPoseArt(pose) {
  return MOXIE_ART.has(pose) && POSE_KEYS.has(pose);
}
