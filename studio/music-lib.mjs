export const DUCK_FACTOR = 0.22;

export function clampVolume(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.35;
}

export function musicVolume(baseVolume, ducked) {
  const base = clampVolume(baseVolume);
  return ducked ? base * DUCK_FACTOR : base;
}
