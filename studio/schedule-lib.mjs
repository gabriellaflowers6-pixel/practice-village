// Pure schedule/calendar logic shared by zenbottom-teach.html and
// zenbottom-schedule.html. No DOM, no fetch: node-testable.
const MIN = 60e3, DAY = 86400e3;
export const JOIN_EARLY_MIN = 15;

export function liveWindow(cls, nowMs) {
  const start = new Date(cls.starts_at).getTime();
  const end = start + (cls.duration_min || 60) * MIN;
  if (nowMs < start - JOIN_EARLY_MIN * MIN) return "upcoming";
  if (nowMs <= end) return "joinable";
  return "over";
}

export function dayKey(iso) {
  const d = new Date(iso);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") +
    "-" + String(d.getDate()).padStart(2, "0");
}

export function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
export function fmtDay(iso) {
  return new Date(iso).toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

export function groupByDay(classes, nowMs) {
  const sorted = [...classes].sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
  const todayKey = dayKey(new Date(nowMs).toISOString());
  const tomorrowKey = dayKey(new Date(nowMs + DAY).toISOString());
  const out = [];
  for (const c of sorted) {
    const k = dayKey(c.starts_at);
    let bucket = out.find(b => b.dayKey === k);
    if (!bucket) {
      const label = k === todayKey ? "Tonight" : k === tomorrowKey ? "Tomorrow"
        : fmtDay(c.starts_at).replace(",", " ·");
      bucket = { label, dayKey: k, classes: [] };
      out.push(bucket);
    }
    bucket.classes.push(c);
  }
  return out;
}

export function monthGrid(year, monthIndex0, classes) {
  const counts = {};
  for (const c of classes) {
    if (c.status === "cancelled") continue;
    const k = dayKey(c.starts_at);
    counts[k] = (counts[k] || 0) + 1;
  }
  const first = new Date(year, monthIndex0, 1);
  const startOffset = first.getDay(); // Sunday start
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, monthIndex0, 1 + i - startOffset);
    const k = dayKey(d.toISOString());
    cells.push({ day: d.getDate(), inMonth: d.getMonth() === monthIndex0,
                 dayKey: k, count: counts[k] || 0 });
  }
  return cells;
}

export function expandWeekly(fields, weeks) {
  const n = Math.max(1, Math.min(12, weeks | 0));
  const out = [];
  for (let i = 0; i < n; i++) {
    const starts = new Date(new Date(fields.starts_at).getTime() + i * 7 * DAY);
    out.push({ ...fields, starts_at: starts.toISOString() });
  }
  return out;
}

// Student browser: search matches class name, theme, or teacher name.
export function matchesQuery(cls, q) {
  const s = (q || "").trim().toLowerCase();
  if (!s) return true;
  return [cls.name, cls.theme, cls.teacher_name]
    .some(v => (v || "").toLowerCase().includes(s));
}

// Distinct teacher names present in the class list, sorted, blanks dropped.
export function teacherOptions(classes) {
  const set = new Set();
  for (const c of classes) if (c.teacher_name) set.add(c.teacher_name);
  return [...set].sort((a, b) => a.localeCompare(b));
}

// Soft-capacity label: never blocks, just describes. "" when nothing to show.
export function capacityLabel(cls, count) {
  const n = count || 0;
  if (cls.size_cap) {
    return n + " of " + cls.size_cap + (n >= cls.size_cap ? " · full" : "");
  }
  return n > 0 ? n + " going" : "";
}
