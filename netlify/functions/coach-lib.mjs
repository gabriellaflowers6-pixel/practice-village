// Pure coach logic shared by the Netlify /coach function (coach.mjs).
// No IO, no network: history trimming, gemini-contents shaping, and lesson
// pose filtering. serve.py mirrors this logic in Python; keep them in step.

// The 32 camera-trained poses plus three teacher-approved curriculum movements.
// The latter remain manual-advance movements until their camera models land.
export const PRETTY = {
  chair: "Chair", dancer: "Dancer", dog: "Downward Dog", forwardfold: "Forward Fold",
  mountain: "Mountain", tree: "Tree", triangle: "Triangle", warrior: "Warrior II",
  goddess: "Goddess", halfmoon: "Half Moon", highlunge: "High Lunge", cobra: "Cobra",
  plank: "Plank", child: "Child's Pose", bridge: "Bridge", boat: "Boat", eagle: "Eagle",
  warrior3: "Warrior 3", easyseat: "Easy Seat", savasana: "Savasana", pigeon: "Pigeon",
  seatedfold: "Seated Forward Fold", sideangle: "Side Angle", tabletop: "Tabletop",
  catcow: "Cat/Cow", camel: "Camel", birddog: "Bird-Dog", happybaby: "Happy Baby",
  wheel: "Wheel", locust: "Locust", prasarita: "Wide-Leg Fold", legsupwall: "Legs Up the Wall",
  lowlunge: "Low Lunge", halfwaylift: "Halfway Lift", seatedtwist: "Gentle Seated Twist",
};

export const POSE_KEYS = new Set(Object.keys(PRETTY));
export const CONCERNS = new Set(["wrist_sensitive","knee_sensitive","hip_sensitive","shoulder_sensitive","lower_back_sensitive","neck_sensitive","foot_sensitive","prefer_seated","avoid_inversions","shorter_holds","current_pain","skin_injury","unknown_health","urgent_symptoms"]);
const CONCERN_BLOCKS = {
  wrist_sensitive:["wrist_pressure"], knee_sensitive:["knee_pressure","deep_knee_bend"],
  hip_sensitive:["hip_flexion","hip_extension","hip_load"], shoulder_sensitive:["shoulder_load","shoulder_overhead"],
  lower_back_sensitive:["backbend","forward_fold","spinal_rotation","spinal_flexion_extension"],
  neck_sensitive:["backbend","shoulder_overhead"], foot_sensitive:["foot_pressure","single_foot_pressure","foot_top_pressure"],
  prefer_seated:["standing","wrist_pressure","knee_pressure","prone"], avoid_inversions:["inversion"], shorter_holds:["long_hold"],
};

const MAX_MESSAGES = 16;
const MAX_CHARS = 1200;
const PRACTICE_MODES = new Set(["yoga", "meditation", "blended"]);

export function cleanPracticeMode(value) {
  return PRACTICE_MODES.has(value) ? value : "yoga";
}

export function practiceModeInstruction(value) {
  const mode = cleanPracticeMode(value);
  if (mode === "meditation") return "\n\nCURRENT PRACTICE MODE: Meditation. Change gears fully. Do not generate or continue a yoga pose lesson; return lesson as null. Use a brief open-ended check-in and respond as a secular meditation guide without diagnosis, forced disclosure, or pressure to focus on breath.";
  if (mode === "blended") return "\n\nCURRENT PRACTICE MODE: Yoga + Meditation. Change gears fully. When useful, create a concise yoga movement lesson that can lead into meditation, and tell the learner that the meditation follows the movement. Do not treat this as yoga-only.";
  return "\n\nCURRENT PRACTICE MODE: Yoga. Change gears fully. Respond as the yoga guide and generate a pose lesson only when useful.";
}

// Keep only user/model turns with real text, cap each turn's length, and keep
// the most recent MAX_MESSAGES turns so upstream cost stays bounded.
export function trimHistory(messages, maxN = MAX_MESSAGES, maxChars = MAX_CHARS) {
  if (!Array.isArray(messages)) return [];
  const clean = [];
  for (const m of messages) {
    if (!m || (m.role !== "user" && m.role !== "model")) continue;
    const text = typeof m.text === "string" ? m.text.trim() : "";
    if (!text) continue;
    clean.push({ role: m.role, text: text.slice(0, maxChars) });
  }
  return clean.slice(-maxN);
}

// Shape trimmed history into Gemini's `contents` array.
export function sanitizeContents(messages) {
  return messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] }));
}

export function cleanConcerns(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter(value => CONCERNS.has(value)))];
}

export function profileConcerns(profile) {
  if (!profile || profile.enabled !== true) return [];
  const areaMap={wrists:"wrist_sensitive",knees:"knee_sensitive",hips:"hip_sensitive",shoulders:"shoulder_sensitive",lower_back:"lower_back_sensitive",neck:"neck_sensitive"};
  const concerns=(Array.isArray(profile.areas)?profile.areas:[]).map(area=>areaMap[area]).filter(Boolean);
  const options=Array.isArray(profile.movementOptions)?profile.movementOptions:[];
  if(options.includes("seated_options"))concerns.push("prefer_seated");
  if(options.includes("avoid_inversions"))concerns.push("avoid_inversions");
  if(options.includes("shorter_holds"))concerns.push("shorter_holds");
  return cleanConcerns(concerns);
}

export function lessonDemands(approved, curriculumId) {
  const spec=approved?.lessons?.[curriculumId],base=spec?.base?approved?.lessons?.[spec.base]:null,sections=spec?.sections||base?.sections;
  if(!sections)return new Set();
  return new Set(Object.values(sections).flat().flatMap(pose=>approved?.poses?.[pose]?.demands||[]));
}

export function compatibleLessonIds(approved, values) {
  const concerns=cleanConcerns(values);
  if(concerns.includes("urgent_symptoms")||concerns.includes("unknown_health")||(concerns.includes("current_pain")&&!concerns.some(value=>CONCERN_BLOCKS[value]))||(concerns.includes("skin_injury")&&!concerns.includes("foot_sensitive")))return [];
  const blocked=new Set(concerns.flatMap(value=>CONCERN_BLOCKS[value]||[]));
  return Object.keys(approved?.lessons||{}).filter(id=>![...lessonDemands(approved,id)].some(demand=>blocked.has(demand)));
}

function wholeBreaths(v) {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n > 0 ? n : 1;
}

// Drop any pose outside the 32, enrich survivors with their display name, drop
// sections that empty out, and return null if the whole lesson is empty/invalid.
export function filterLesson(lesson, approved) {
  // Gemini is a selector, not the author. It may return only a curriculum ID;
  // every displayed movement, order, hold and cue is expanded from JoYi's
  // committed source data. Invented lesson bodies and unknown IDs fail closed.
  if (!lesson || typeof lesson !== "object" || typeof lesson.curriculumId !== "string") return null;
  const spec = approved?.lessons?.[lesson.curriculumId];
  const base = spec?.base ? approved?.lessons?.[spec.base] : null;
  const fixedSections = spec?.sections || base?.sections;
  if (!spec || !fixedSections || typeof fixedSections !== "object") return null;
  const sections = Object.entries(fixedSections).map(([phase, keys]) => ({
    phase,
    poses: Array.isArray(keys) ? keys.map((pose, index) => {
      const fixed = approved?.poses?.[pose];
      if (!fixed || !POSE_KEYS.has(pose)) return null;
      const cue = spec.cueStyle === "breath" ? "" : (spec.cueStyle === "light" && index > 0 ? "" : fixed.cue);
      return { pose, pretty: fixed.pretty, holdBreaths: wholeBreaths(fixed.holdBreaths), cue };
    }).filter(Boolean) : [],
  })).filter((section) => section.poses.length);
  if (!sections.length) return null;
  return {
    curriculumId: lesson.curriculumId,
    title: spec.title,
    intro: spec.intro,
    sections,
    outro: spec.outro,
  };
}
