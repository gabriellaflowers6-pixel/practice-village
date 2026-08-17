// Browser-local settings storage for the no-accounts era. The data shape is
// deliberately simple so it can later move behind the existing Supabase proxy.
const PREFIX = "zbSettings:";
const AREAS = new Set(["wrists", "knees", "hips", "shoulders", "lower_back", "neck"]);
const INTENTIONS = new Set(["stress_relief", "mobility", "sleep", "strength", "desk_reset"]);
const EQUIPMENT = new Set(["mat", "chair", "blocks", "bolster", "wall"]);
const MOVEMENT_OPTIONS = new Set(["seated_options", "avoid_inversions", "shorter_holds"]);
const RANGE_LEVELS = new Set(["just_starting", "building_ease", "comfortable", "very_mobile"]);

export function emptyPracticeProfile() {
  return { enabled: false, areas: [], intentions: [], equipment: [], movementOptions: [], rangeLevel: "", note: "" };
}

export function normalizePracticeProfile(value) {
  const source = value && typeof value === "object" ? value : {};
  const allowed = (items, set) => [...new Set(Array.isArray(items) ? items.filter(item => set.has(item)) : [])];
  return {
    enabled: source.enabled === true,
    areas: allowed(source.areas, AREAS), intentions: allowed(source.intentions, INTENTIONS),
    equipment: allowed(source.equipment, EQUIPMENT), movementOptions: allowed(source.movementOptions, MOVEMENT_OPTIONS),
    rangeLevel: RANGE_LEVELS.has(source.rangeLevel) ? source.rangeLevel : "",
    note: typeof source.note === "string" ? source.note.trim().slice(0, 240) : "",
  };
}

export function settingsKey(email) {
  const value = String(email || "").trim().toLowerCase();
  return PREFIX + (value || "guest");
}

export function emptySettings() {
  return { lessons: [], curriculums: [], notifyAll: false, practiceProfile: emptyPracticeProfile() };
}

export function readSettings(storage, email) {
  try {
    const value = JSON.parse(storage.getItem(settingsKey(email)) || "null");
    if (!value || typeof value !== "object") return emptySettings();
    return {
      lessons: Array.isArray(value.lessons) ? value.lessons : [],
      curriculums: Array.isArray(value.curriculums) ? value.curriculums : [],
      notifyAll: value.notifyAll === true,
      practiceProfile: normalizePracticeProfile(value.practiceProfile),
    };
  } catch {
    return emptySettings();
  }
}

export function withPracticeProfile(settings, profile) {
  return { ...settings, practiceProfile: normalizePracticeProfile(profile) };
}

export function practiceProfileSummary(profile) {
  const p = normalizePracticeProfile(profile);
  if (!p.enabled) return "";
  const names = {
    wrists: "wrists", knees: "knees", hips: "hips", shoulders: "shoulders", lower_back: "lower back", neck: "neck",
    stress_relief: "stress relief", mobility: "mobility", sleep: "sleep", strength: "strength", desk_reset: "a desk reset",
    mat: "a mat", chair: "a chair", blocks: "blocks", bolster: "a bolster", wall: "a wall",
    seated_options: "seated options", avoid_inversions: "avoiding inversions", shorter_holds: "shorter holds",
    just_starting: "just starting / feeling stiff", building_ease: "building ease", comfortable: "comfortable in most shapes", very_mobile: "very mobile",
  };
  const part = (label, values) => values.length ? `${label}: ${values.map(value => names[value]).join(", ")}` : "";
  return [part("be gentle around", p.areas), part("intentions", p.intentions), part("available", p.equipment), part("preferences", p.movementOptions), p.rangeLevel ? `current range: ${names[p.rangeLevel]}` : "", p.note ? `learner note: ${p.note}` : ""].filter(Boolean).join("; ");
}

export function writeSettings(storage, email, settings) {
  storage.setItem(settingsKey(email), JSON.stringify(settings));
  return settings;
}

export function saveLesson(settings, lesson, now, id) {
  if (!lesson || typeof lesson !== "object" || !Array.isArray(lesson.sections)) return settings;
  const record = {
    id: id || `lesson-${now}-${Math.random().toString(36).slice(2, 8)}`,
    savedAt: now,
    title: typeof lesson.title === "string" && lesson.title.trim() ? lesson.title.trim() : "Your practice",
    lesson: JSON.parse(JSON.stringify(lesson)),
  };
  return { ...settings, lessons: [record, ...settings.lessons] };
}

export function removeLesson(settings, lessonId) {
  const lessons = settings.lessons.filter(lesson => lesson.id !== lessonId);
  const curriculums = settings.curriculums.map(curriculum => ({
    ...curriculum,
    lessonIds: curriculum.lessonIds.filter(id => id !== lessonId),
  })).filter(curriculum => curriculum.lessonIds.length);
  return { ...settings, lessons, curriculums };
}

export function addCurriculum(settings, title, lessonIds, now, id) {
  const name = String(title || "").trim();
  const validIds = [...new Set(lessonIds || [])].filter(id => settings.lessons.some(lesson => lesson.id === id));
  if (!name || !validIds.length) return settings;
  const curriculum = { id: id || `curriculum-${now}-${Math.random().toString(36).slice(2, 8)}`, title: name.slice(0, 80), lessonIds: validIds, savedAt: now };
  return { ...settings, curriculums: [curriculum, ...settings.curriculums] };
}

export function removeCurriculum(settings, curriculumId) {
  return { ...settings, curriculums: settings.curriculums.filter(curriculum => curriculum.id !== curriculumId) };
}

export function curriculumLessons(settings, curriculum) {
  return curriculum.lessonIds.map(id => settings.lessons.find(lesson => lesson.id === id)).filter(Boolean);
}
