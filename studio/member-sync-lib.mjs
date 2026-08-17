const text = value => typeof value === "string" ? value : "";

export function planRow(plan, userId) {
  if (!plan || !userId) return null;
  const notifications = plan.notifications || {};
  return {
    user_id: userId,
    style: plan.style,
    start_date: plan.startDate,
    days: plan.days || [],
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
  };
}

export function sessionRows(plan, userId) {
  return (plan?.completions || []).filter(item => item?.slotId && item?.completedAt).map(item => ({
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
}

function fail(label, error) {
  if (error) throw new Error(`Could not sync ${label}: ${error.message || "unknown error"}`);
}

export async function syncPracticePlan({ supabase, userId, plan }) {
  if (!supabase?.from || !userId || !plan) throw new Error("A signed-in member and practice plan are required for sync.");
  const saved = await supabase.from("practice_plans").upsert(planRow(plan, userId), { onConflict: "user_id" });
  fail("practice plan", saved.error);

  const localRows = sessionRows(plan, userId);
  const remote = await supabase.from("practice_sessions").select("id,slot_id").eq("user_id", userId).eq("source", "plan").neq("slot_id", "");
  fail("practice history", remote.error);
  const localIds = new Set(localRows.map(row => row.slot_id));
  const remoteIds = new Set((remote.data || []).map(row => row.slot_id));
  const missing = localRows.filter(row => !remoteIds.has(row.slot_id));
  if (missing.length) {
    const inserted = await supabase.from("practice_sessions").insert(missing);
    fail("practice history", inserted.error);
  }
  const removedIds = (remote.data || []).filter(row => !localIds.has(row.slot_id)).map(row => row.id);
  if (removedIds.length) {
    const removed = await supabase.from("practice_sessions").delete().eq("user_id", userId).in("id", removedIds);
    fail("practice history", removed.error);
  }
  return { plan: 1, insertedSessions: missing.length, removedSessions: removedIds.length };
}

async function replaceOwnedRows({ supabase, table, userId, rows }) {
  const remote = await supabase.from(table).select("id").eq("user_id", userId);
  fail(table, remote.error);
  const localIds = new Set(rows.map(row => row.id));
  const removedIds = (remote.data || []).map(row => row.id).filter(id => !localIds.has(id));
  if (removedIds.length) {
    const removed = await supabase.from(table).delete().eq("user_id", userId).in("id", removedIds);
    fail(table, removed.error);
  }
  if (rows.length) {
    const saved = await supabase.from(table).upsert(rows, { onConflict:"id" });
    fail(table, saved.error);
  }
}

export async function syncMemberSettings({ supabase, userId, bundle }) {
  if (!supabase?.from || !userId || !bundle) throw new Error("A signed-in member and settings bundle are required for sync.");
  if (bundle.practiceProfiles.length) {
    const profile = await supabase.from("practice_profiles").upsert(bundle.practiceProfiles, { onConflict:"user_id" });
    fail("practice profile", profile.error);
  }
  await replaceOwnedRows({ supabase, table:"saved_lessons", userId, rows:bundle.savedLessons });
  await replaceOwnedRows({ supabase, table:"curriculums", userId, rows:bundle.curriculums });
  for (const curriculum of bundle.curriculums) {
    const cleared = await supabase.from("curriculum_lessons").delete().eq("curriculum_id", curriculum.id);
    fail("curriculum lessons", cleared.error);
    const rows = bundle.curriculumLessons.filter(row => row.curriculum_id === curriculum.id);
    if (rows.length) {
      const saved = await supabase.from("curriculum_lessons").insert(rows);
      fail("curriculum lessons", saved.error);
    }
  }
  return { profile:bundle.practiceProfiles.length, lessons:bundle.savedLessons.length, curriculums:bundle.curriculums.length };
}
