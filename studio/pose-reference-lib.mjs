// Bott Om as the reference for lesson poses the classifier cannot name
// (Halfway Lift, Low Lunge). Data: pose-reference-avatar.json, built by
// scripts/build_pose_reference.py, which also records the measured rates.
// `f` is the live 39-number feat() vector.

const KEYS = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
const Y = (f, key) => f[2 * KEYS.indexOf(key) + 1];

// How far the lower knee sits above the lower ankle, in torso lengths
// (image y runs down, so a knee on the floor reads about 0).
export function kneeClearance(f) {
  return Math.max(Y(f, 27), Y(f, 28)) - Math.max(Y(f, 25), Y(f, 26));
}

// Closest distance from f's legs and torso to any of her shapes for the pose.
export function referenceDistance(ref, pose, f) {
  const P = ref.poses[pose];
  let best = Infinity;
  for (const r of P.feats) {
    let s = 0;
    for (let i = 0; i < ref.dims.length && s < best * best; i++) { const d = f[ref.dims[i]] - r[i]; s += d * d; }
    best = Math.min(best, Math.sqrt(s));
  }
  return best;
}

export function hasReference(ref, pose) {
  return !!(ref && ref.poses && ref.poses[pose]);
}

// Is the student in Bott Om's shape for this pose?
export function matchesReference(ref, pose, f) {
  if (!hasReference(ref, pose)) return false;
  const P = ref.poses[pose];
  return kneeClearance(f) <= P.kneeMax && referenceDistance(ref, pose, f) <= P.refMax;
}
