// Pure flow logic for the guided practice player (zenbottom-practice.html).
// No DOM, no camera: lesson flattening, breath-hold timing, and the match ring
// accumulator. Unit-tested because automation cannot pose in front of a camera.
import { PRETTY, POSE_KEYS } from "./coach-lib.mjs";

export { PRETTY, POSE_KEYS };

// Which angle reads best for each pose: "front" faces the camera, "side" is a
// profile. Authored from yoga convention; refine against the chosen art.
export const POSE_ORIENT = {
  mountain: "front", chair: "front", tree: "front", eagle: "front",
  goddess: "front", prasarita: "front", forwardfold: "front", easyseat: "front",
  happybaby: "front",
  warrior: "side", warrior3: "side", sideangle: "side", triangle: "side",
  highlunge: "side", halfmoon: "side", dancer: "side", dog: "side", plank: "side",
  cobra: "side", camel: "side", boat: "side", bridge: "side", wheel: "side",
  pigeon: "side", seatedfold: "side", locust: "side", catcow: "side",
  birddog: "side", tabletop: "side", child: "side", legsupwall: "side",
  savasana: "side", lowlunge: "side", halfwaylift: "side", seatedtwist: "side",
};

const BREATH_MS = 4000;
const HOLD_MS = 1500; // sustained match needed to complete the ring
export const NEAR_MATCH_HINT = "You're close, settle in and hold it steady";

// Lesson (from the coach) -> a flat, ordered list of practice steps. Drops any
// pose whose label is not in the approved vocabulary (the coach already filters).
export function flattenLesson(lesson) {
  if (!lesson || typeof lesson !== "object" || !Array.isArray(lesson.sections)) return [];
  const steps = [];
  for (const sec of lesson.sections) {
    if (!sec || !Array.isArray(sec.poses)) continue;
    for (const p of sec.poses) {
      if (!p || !POSE_KEYS.has(p.pose)) continue;
      steps.push({
        pose: p.pose,
        pretty: typeof p.pretty === "string" ? p.pretty : (PRETTY[p.pose] || p.pose),
        holdBreaths: Number.isFinite(p.holdBreaths) ? p.holdBreaths : 5,
        cue: typeof p.cue === "string" ? p.cue : "",
        phase: typeof sec.phase === "string" ? sec.phase : "",
      });
    }
  }
  return steps;
}

// Suggested breaths -> hold duration in ms (a calm breath is ~4s).
export function breathToMs(holdBreaths, breathMs = BREATH_MS) {
  const n = Math.min(30, Math.max(1, Math.round(Number(holdBreaths) || 1)));
  return Math.min(90000, n * breathMs);
}

// Sparse, local voice-coach copy. Keeping this pure makes the browser speech
// layer a small adapter and ensures the spoken words match the visible step.
export function voicePlan(step) {
  const pretty = typeof step?.pretty === "string" && step.pretty.trim() ? step.pretty.trim() : "This pose";
  const cue = typeof step?.cue === "string" ? step.cue.trim() : "";
  const breaths = Math.min(30, Math.max(1, Math.round(Number(step?.holdBreaths) || 1)));
  return {
    intro: cue ? `${pretty}. ${cue}. Find your position.` : `${pretty}. Find your position.`,
    counts: Array.from({ length: breaths }, (_, i) => String(i + 1)),
  };
}

// Everything the tutor is allowed to teach, stated as data rather than trusted
// to memory. Without this the model is told only the current pose, never the
// lesson, so it happily invents a next pose and directs one the learner cannot
// see. The lesson is JoYi's approved sequence: the tutor discusses it, the app
// owns it.
export function lessonGrounding(steps, idx, title = "") {
  if (!Array.isArray(steps) || !steps.length) return "";
  const position = Number.isInteger(idx) && idx >= 0 && idx < steps.length ? idx : 0;
  const current = steps[position];
  const roster = steps.map((step, i) => `${i + 1} ${step?.pretty || step?.pose || "unknown"}`).join(", ");
  const name = current?.pretty || current?.pose || "the current pose";
  return `This practice is JoYi's approved lesson${title ? ` "${String(title).trim()}"` : ""}, and it is fixed. Its poses, in order, are: ${roster}. The learner is on pose ${position + 1} of ${steps.length}, ${name}. Never name, teach, or direct a pose that is not in that list. Never change the order, skip ahead, or add poses. The app advances the practice, not you. If the learner asks for a pose outside the list, say it is not part of today's practice and bring them back to ${name}.`;
}

// Speak one nudge only after the learner has remained in the near-match state
// for a while. The caller owns resetting `nearMatchSince` when that state ends.
export function shouldSpeakNearMatch(nearMatchSince, now, alreadySpoken, delayMs = 6000) {
  return !alreadySpoken && Number.isFinite(nearMatchSince) && now - nearMatchSince >= delayMs;
}

// Intentionally small command set for the browser-only listening stage. Match
// whole phrases so incidental speech does not change the practice flow.
function normalizeVoiceText(transcript) {
  return typeof transcript === "string" ? transcript.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z'\s-]/g, " ").replace(/\s+/g, " ").trim() : "";
}

export function parseVoiceIntent(transcript) {
  const text = normalizeVoiceText(transcript).replace(/-/g, " ").replace(/\s+/g, " ").trim();
  if (/\bmore time\b/.test(text)) return "more_time";
  if (/\bagain\b/.test(text)) return "again";
  if (/^(?:please )?next(?: pose)?(?: please)?$/.test(text)) return "next";
  if (/\bi (?:don't|do not) get it\b/.test(text)) return "explain";
  if (/\bis this right\b/.test(text)) return "assess";
  return null;
}

// Wake-word mode ignores all room speech unless it starts by addressing Moxie.
// Recognizers render the name loosely, so accept the close variants, but keep
// requiring the name to LEAD the sentence: saying "moxie" in passing is not
// addressing the tutor. "Bott Om" is JoYi's avatar and deliberately not a wake
// phrase; the two were being confused for each other.
export function parseWakeCommand(transcript) {
  const text = normalizeVoiceText(transcript);
  const match = text.match(/^(?:hey\s+|ok\s+|okay\s+)?mo(?:x|cks?)(?:ie|y|i)\b\s*(.*)$/);
  if (!match) return { addressed: false, intent: null, message: "" };
  const message = match[1].replace(/^[-,\s]+/, "").trim();
  return { addressed: true, intent: parseVoiceIntent(message), message };
}

// Accumulate how long the target pose has been held this bout. `matched` is
// whether the current frame reads the target pose. Returns the new state plus
// the ring fill (0..1) and whether the hold has completed. A single unmatched
// frame resets the bout (mirrors the live page's debounce intent).
export function matchProgress(prev, matched, now, holdMs = HOLD_MS) {
  if (!matched) return { startedAt: null, ringPct: 0, committed: false };
  const startedAt = prev && prev.startedAt != null ? prev.startedAt : now;
  const held = now - startedAt;
  const ringPct = Math.min(1, held / holdMs);
  return { startedAt, ringPct, committed: held >= holdMs };
}
