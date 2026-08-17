import { loadPlan } from "./practice-plan-lib.mjs";
import { readSettings } from "./settings-lib.mjs";

const MARKER_PREFIX = "moxieMemberImport:v1:";

const text = value => typeof value === "string" ? value : "";
const numberOrNull = value => value !== null && value !== undefined && value !== "" && Number.isFinite(+value) ? +value : null;

export function importMarkerKey(userId) {
  return MARKER_PREFIX + text(userId).trim();
}

export function readImportMarker(storage, userId) {
  if (!text(userId).trim()) return null;
  try {
    const value = JSON.parse(storage.getItem(importMarkerKey(userId)) || "null");
    return value?.version === 1 && value.completedAt ? value : null;
  } catch {
    return null;
  }
}

function planRows(plan, userId) {
  if (!plan) return { plans: [], sessions: [] };
  const notifications = plan.notifications || {};
  const plans = [{
    user_id: userId,
    style: plan.style,
    start_date: plan.startDate,
    days: plan.days,
    times: plan.times || {},
    default_time: plan.time || "",
    duration_min: plan.durationMin,
    time_zone: plan.timeZone || "",
    notify_calendar: notifications.calendar === true,
    notify_email: notifications.email === true,
    notify_email_address: notifications.email === true ? text(notifications.emailAddress) : "",
    paused_from: plan.pausedFrom || null,
    paused_until: plan.pausedUntil || null,
    skipped_dates: plan.skippedDates || [],
    rescheduled: plan.rescheduled || {},
  }];
  const sessions = (plan.completions || []).filter(item => item?.slotId && item?.completedAt).map(item => ({
    user_id: userId,
    slot_id: text(item.slotId),
    scheduled_date: item.date || null,
    completed_at: item.completedAt,
    duration_min: plan.durationMin,
    session_type: "yoga",
    journey_day: null,
    lesson_id: "",
    source: "plan",
  }));
  return { plans, sessions };
}

function settingsRows(settings, userId, importedAt) {
  const profile = settings.practiceProfile;
  const practiceProfiles = [{
    user_id: userId,
    enabled: profile.enabled,
    intentions: profile.intentions,
    areas: profile.areas,
    equipment: profile.equipment,
    movement_options: profile.movementOptions,
    range_level: profile.rangeLevel,
    note: profile.note,
    consented_at: profile.enabled ? importedAt : null,
  }];
  const savedLessons = settings.lessons.filter(item => item?.id && item?.lesson).map(item => ({
    id: text(item.id),
    user_id: userId,
    title: text(item.title).trim() || "Your practice",
    lesson: item.lesson,
    duration_min: numberOrNull(item.durationMin ?? item.lesson?.durationMin),
    source: "guide",
    saved_at: item.savedAt || importedAt,
  }));
  const lessonIds = new Set(savedLessons.map(item => item.id));
  const curriculums = settings.curriculums.filter(item => item?.id && text(item.title).trim()).map(item => ({
    id: text(item.id),
    user_id: userId,
    title: text(item.title).trim().slice(0, 80),
    description: text(item.description),
    icon: text(item.icon),
    saved_at: item.savedAt || importedAt,
  }));
  const curriculumLessons = [];
  for (const curriculum of settings.curriculums) {
    if (!curriculums.some(item => item.id === curriculum?.id)) continue;
    (curriculum.lessonIds || []).filter(id => lessonIds.has(id)).forEach((lessonId, position) => curriculumLessons.push({
      curriculum_id: curriculum.id,
      lesson_id: lessonId,
      position,
      scheduled_day: null,
    }));
  }
  return { practiceProfiles, savedLessons, curriculums, curriculumLessons };
}

export function buildMemberImport(storage, email, userId, importedAt = new Date().toISOString()) {
  const id = text(userId).trim();
  if (!id) throw new Error("A signed-in user is required for import.");
  const settings = readSettings(storage, email);
  const plan = loadPlan(storage, email);
  return { importedAt, ...settingsRows(settings, id, importedAt), ...planRows(plan, id) };
}

const STEPS = [
  ["practice_profiles", "practiceProfiles", "user_id"],
  ["practice_plans", "plans", "user_id"],
  ["saved_lessons", "savedLessons", "id"],
  ["curriculums", "curriculums", "id"],
  ["curriculum_lessons", "curriculumLessons", "curriculum_id,lesson_id"],
];

async function importSessions(supabase, rows, userId) {
  if (!rows.length) return;
  const slotIds = rows.map(row => row.slot_id);
  const { data, error: readError } = await supabase.from("practice_sessions").select("slot_id").eq("user_id", userId).in("slot_id", slotIds);
  if (readError) throw new Error(`Could not inspect practice_sessions: ${readError.message || "unknown error"}`);
  const existing = new Set((data || []).map(row => row.slot_id));
  const missing = rows.filter(row => !existing.has(row.slot_id));
  if (!missing.length) return;
  const { error } = await supabase.from("practice_sessions").insert(missing);
  if (error) throw new Error(`Could not import practice_sessions: ${error.message || "unknown error"}`);
}

export async function importMemberData({ storage, email, userId, supabase, now = new Date().toISOString() }) {
  const prior = readImportMarker(storage, userId);
  if (prior) return { status: "already_imported", marker: prior };
  if (!supabase?.from) throw new Error("Supabase is unavailable.");
  const bundle = buildMemberImport(storage, email, userId, now);
  const counts = { practice_sessions: bundle.sessions.length };
  for (let index = 0; index < STEPS.length; index++) {
    const [table, key, onConflict] = STEPS[index];
    const rows = bundle[key];
    counts[table] = rows.length;
    if (!rows.length) continue;
    const { error } = await supabase.from(table).upsert(rows, { onConflict, ignoreDuplicates: true });
    if (error) throw new Error(`Could not import ${table}: ${error.message || "unknown error"}`);
    if (table === "practice_plans") await importSessions(supabase, bundle.sessions, userId);
  }
  if (!bundle.plans.length) await importSessions(supabase, bundle.sessions, userId);
  const marker = { version: 1, completedAt: now, counts };
  storage.setItem(importMarkerKey(userId), JSON.stringify(marker));
  return { status: "imported", marker };
}
