const KEY = "moxieMeditations";
const OUTBOX_KEY = "moxieMeditationSessionOutbox";

export function readMeditationFavorites(storage, slugs) {
  let values=[];
  try { values=JSON.parse(storage.getItem(KEY) || "[]"); } catch {}
  const migrated=[...new Set(values.map(value => Number.isInteger(value) ? slugs[value] : value).filter(value => slugs.includes(value)))];
  if (JSON.stringify(values) !== JSON.stringify(migrated)) storage.setItem(KEY, JSON.stringify(migrated));
  return new Set(migrated);
}

export function writeMeditationFavorites(storage, favorites) {
  storage.setItem(KEY, JSON.stringify([...favorites]));
}

export async function syncMeditationFavorite({ supabase, userId, slug, savedAt, enabled }) {
  if (enabled) return supabase.from("meditation_favorites").upsert({user_id:userId,meditation_slug:slug,saved_at:savedAt},{onConflict:"user_id,meditation_slug"});
  return supabase.from("meditation_favorites").delete().eq("user_id",userId).eq("meditation_slug",slug);
}

export async function recordMeditationSession({ supabase, userId, slug, durationMin, startedAt, completedAt }) {
  return supabase.from("meditation_sessions").insert({user_id:userId,meditation_slug:slug,duration_min:durationMin,started_at:startedAt,completed_at:completedAt});
}

export function queueMeditationSession(storage, record) {
  let rows=[];
  try { rows=JSON.parse(storage.getItem(OUTBOX_KEY) || "[]"); } catch {}
  rows.push(record);storage.setItem(OUTBOX_KEY,JSON.stringify(rows));return record;
}

export async function flushMeditationSessions({ storage, supabase, userId }) {
  let rows=[];
  try { rows=JSON.parse(storage.getItem(OUTBOX_KEY) || "[]"); } catch {}
  if (!rows.length) return 0;
  const result=await supabase.from("meditation_sessions").upsert(rows.map(row=>({...row,user_id:userId})),{onConflict:"id"});
  if (result.error) throw result.error;
  storage.removeItem(OUTBOX_KEY);return rows.length;
}
