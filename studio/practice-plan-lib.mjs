const PREFIX = "moxiePracticePlan:";
const DAY_MS = 86400000;
const DOW = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const MODES = new Set(["yoga", "meditation", "blended"]);
const FOCUSES = new Set(["yoga", "meditation", "balanced"]);
const MODE_LABELS = { yoga: "Yoga", meditation: "Meditation", blended: "Yoga + Meditation" };
const FOCUS_PATTERNS = {
  yoga: ["yoga", "yoga", "blended", "yoga", "meditation"],
  meditation: ["meditation", "meditation", "blended", "meditation", "yoga"],
  balanced: ["yoga", "meditation", "blended"],
};
const PHASES = ["Arrive", "Feel", "Steady", "Integrate"];
const JOURNEY = [
  ["yoga","day-01","Day 1 · Mountain"],["yoga","day-02","Day 2 · Easy Seat and the Breath"],["yoga","day-03","Day 3 · Cat-Cow"],["yoga","day-04","Day 4 · Child's Pose"],["yoga","day-05","Day 5 · Week One Integration"],
  ["meditation","sleep","Day 6 · The Wind-Down"],["meditation","arrival","Day 7 · Choice and Rest"],
  ["yoga","day-08","Day 8 · Tabletop"],["yoga","day-09","Day 9 · Balancing Table"],["yoga","day-10","Day 10 · Downward Dog"],["yoga","day-11","Day 11 · Cobra"],["yoga","day-12","Day 12 · Low Lunge"],["yoga","day-13","Day 13 · Standing Forward Fold"],["yoga","day-14","Day 14 · Floor Integration"],
  ["yoga","day-15","Day 15 · Warrior II"],["yoga","day-16","Day 16 · Extended Side Angle"],["yoga","day-17","Day 17 · Triangle"],["yoga","day-18","Day 18 · Tree"],["yoga","day-19","Day 19 · Standing Integration"],["yoga","day-20","Day 20 · Mini-Flow"],
  ["meditation","release","Day 21 · Review and Rest"],["yoga","day-22","Day 22 · Your Four-Pose Sequence"],["yoga","day-23","Day 23 · Half Sun Salutation"],["yoga","day-24","Day 24 · Sun Salutation, Level One"],["yoga","day-25","Day 25 · Seated Closing"],
  ["yoga","day-26","Day 26 · The Full Sequence, Fully Guided"],["yoga","day-27","Day 27 · The Full Sequence, Lighter Cues"],["yoga","day-28","Day 28 · Personal Emphasis"],["yoga","day-29","Day 29 · The Quiet Run"],["yoga","day-30","Day 30 · The Moxie Sequence"],
];
const BEGINNER_YOGA = JOURNEY.filter(item => item[0] === "yoga");
const BEGINNER_MEDITATION = [["meditation","arrival","Arrival and the Breath"],["meditation","reset","A Steady Pause"],["meditation","attention","Open Attention"],["meditation","release","Release the Day"],["meditation","sleep","A Softer Landing"],["meditation","afterflow","Rest and Notice"]];

const pad = value => String(value).padStart(2, "0");
const keyFromDate = date => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
const parseKey = key => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ""));
  if (!match) return null;
  const date = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3], 12));
  return keyFromDate(date) === key ? date : null;
};

export function planKey(email) {
  return PREFIX + (String(email || "").trim().toLowerCase() || "guest");
}

export function loadPlan(storage, email) {
  try {
    const value = JSON.parse(storage.getItem(planKey(email)) || "null");
    if (!value) return null;
    if (value.version === 2) return value;
    if (value.version === 1) return { ...value, version: 2, focus: "yoga", modeOverrides: {} };
    return null;
  } catch {
    return null;
  }
}

export function savePlan(storage, email, plan) {
  storage.setItem(planKey(email), JSON.stringify(plan));
  return plan;
}

export function migrateGuestPlan(storage, email) {
  const target = String(email || "").trim().toLowerCase();
  if (!target) return loadPlan(storage, "");
  const existing = loadPlan(storage, target);
  if (existing) return existing;
  const guest = loadPlan(storage, "");
  if (!guest) return null;
  savePlan(storage, target, guest);
  storage.removeItem?.(planKey(""));
  return guest;
}

export function createPlan(answers, today) {
  const start = parseKey(today);
  if (!start) throw new Error("today must be YYYY-MM-DD");
  const style = answers.style === "journey" || answers.style === "week" ? "journey" : "freeform";
  const days = [...new Set((answers.days || []).map(Number).filter(day => day >= 0 && day <= 6))].sort();
  if (!days.length) throw new Error("choose at least one practice day");
  const time = /^([01]\d|2[0-3]):[0-5]\d$/.test(answers.time || "") ? answers.time : "";
  const times = Object.fromEntries(days.map(day => {
    const hasDayTime = answers.times && Object.prototype.hasOwnProperty.call(answers.times, day);
    const value = hasDayTime ? answers.times[day] : time;
    return [day, /^([01]\d|2[0-3]):[0-5]\d$/.test(value || "") ? value : ""];
  }));
  const durationMin = [10, 20, 30, 45, 60].includes(+answers.durationMin) ? +answers.durationMin : 20;
  const notifications = {
    calendar: answers.notifications?.calendar === true,
    email: answers.notifications?.email === true,
    emailAddress: answers.notifications?.email === true ? String(answers.notifications.emailAddress || "").trim().toLowerCase() : "",
  };
  const timeZone = String(answers.timeZone || "").trim();
  const focus = FOCUSES.has(answers.focus) ? answers.focus : "balanced";
  const requestedSeriesDays=answers.style === "week" ? 7 : Math.round(Number(answers.seriesDays));
  const seriesDays = Number.isFinite(requestedSeriesDays)&&requestedSeriesDays>=1&&requestedSeriesDays<=30 ? requestedSeriesDays : 30;
  return { version: 2, style, focus, seriesDays, startDate: today, days, daysPerWeek: days.length, time, times, durationMin, timeZone, notifications, completions: [], modeOverrides: {} };
}

export function modeLabel(mode) {
  return MODE_LABELS[MODES.has(mode) ? mode : "yoga"];
}

export function focusLabel(focus) {
  return { yoga: "Mostly yoga", meditation: "Mostly meditation", balanced: "A balanced mix" }[focus] || "A balanced mix";
}

function modeForIndex(plan, index) {
  const focus = FOCUSES.has(plan?.focus) ? plan.focus : "yoga";
  if (plan?.style !== "journey") return focus === "balanced" ? "blended" : focus;
  const pattern = FOCUS_PATTERNS[focus];
  return pattern[index % pattern.length];
}

function phaseForIndex(index) {
  return PHASES[index < 7 ? 0 : index < 14 ? 1 : index < 21 ? 2 : 3];
}

export function setSlotMode(plan, date, mode) {
  if (!plan || plan.style === "journey" || !parseKey(date) || !MODES.has(mode)) return plan;
  return { ...plan, modeOverrides: { ...(plan.modeOverrides || {}), [date]: mode } };
}

export function updatePlanFocus(plan, focus, effectiveFrom) {
  if (!plan || !FOCUSES.has(focus) || !parseKey(effectiveFrom) || plan.focus === focus) return plan;
  const modeOverrides = { ...(plan.modeOverrides || {}) };
  for (let cursor = parseKey(plan.startDate); cursor && keyFromDate(cursor) < effectiveFrom; cursor = new Date(cursor.getTime() + DAY_MS)) {
    const key = keyFromDate(cursor), index = matchingDayIndex(plan, key);
    if (index >= 0 && (plan.style !== "journey" || index < 30) && !modeOverrides[key]) modeOverrides[key] = modeForIndex(plan, index);
  }
  return { ...plan, focus, modeOverrides };
}

function matchingDayIndex(plan, key) {
  const start = parseKey(plan.startDate), target = parseKey(key);
  if (!start || !target || target < start) return -1;
  let index = 0;
  for (let cursor = new Date(start); cursor <= target; cursor = new Date(cursor.getTime() + DAY_MS)) {
    const cursorKey=keyFromDate(cursor);
    if (plan.pausedFrom && plan.pausedUntil && cursorKey >= plan.pausedFrom && cursorKey <= plan.pausedUntil) continue;
    if (plan.days.includes(cursor.getUTCDay())) {
      if (cursorKey === key) return index;
      index++;
    }
  }
  return -1;
}

function baseSlotForDate(plan, key, savedLessons = []) {
  const date = parseKey(key);
  if (!date || !plan || !plan.days.includes(date.getUTCDay())) return null;
  const index = matchingDayIndex(plan, key);
  const seriesDays=Number.isFinite(+plan.seriesDays)&&+plan.seriesDays>=1&&+plan.seriesDays<=30?Math.round(+plan.seriesDays):30;
  if (index < 0 || (plan.style === "journey" && index >= seriesDays)) return null;
  const saved = savedLessons.length ? savedLessons[index % savedLessons.length] : null;
  const series=plan.focus==="meditation"?BEGINNER_MEDITATION:plan.focus==="yoga"?BEGINNER_YOGA:JOURNEY,source=plan.style==="journey"?series[index%series.length]:null;
  const journey=source?[source[0],source[1],`Day ${index+1} · ${source[2].replace(/^Day \d+ · /,"")}`]:null;
  const practiceMode = journey?.[0] || plan.modeOverrides?.[key] || modeForIndex(plan, index);
  const label = modeLabel(practiceMode);
  const title = journey?.[2] || (saved?.title || `${label} from your guide`);
  return {
    id: `plan-${key}`,
    date: key,
    time: plan.times && Object.prototype.hasOwnProperty.call(plan.times, date.getUTCDay()) ? plan.times[date.getUTCDay()] : (plan.time || ""),
    durationMin: plan.durationMin,
    title,
    practiceMode,
    style: plan.style,
    journeyDay: plan.style === "journey" ? index + 1 : null,
    curriculumId: journey?.[0] === "yoga" ? journey[1] : null,
    meditationSession: journey?.[0] === "meditation" ? journey[1] : null,
    lessonId: plan.style === "freeform" ? (saved?.id || null) : null,
    completed: (plan.completions || []).some(item => item.slotId === `plan-${key}`),
    timeZone: plan.timeZone || "",
  };
}

export function slotForDate(plan, key, savedLessons = []) {
  if (!plan || (plan.skippedDates || []).includes(key)) return null;
  if (plan.pausedFrom && plan.pausedUntil && key >= plan.pausedFrom && key <= plan.pausedUntil) return null;
  const moved = Object.entries(plan.rescheduled || {}).find(([,value]) => value?.date === key);
  if (moved) {
    const [source, change] = moved, original = baseSlotForDate(plan, source, savedLessons);
    return original ? { ...original, date:key, time:Object.prototype.hasOwnProperty.call(change,"time") ? change.time : original.time, movedFrom:source } : null;
  }
  if (plan.rescheduled?.[key]) return null;
  return baseSlotForDate(plan, key, savedLessons);
}

export function slotsForMonth(plan, year, monthIndex, savedLessons = []) {
  if (!plan) return [];
  const days = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const slots = [];
  for (let day = 1; day <= days; day++) {
    const slot = slotForDate(plan, `${year}-${pad(monthIndex + 1)}-${pad(day)}`, savedLessons);
    if (slot) slots.push(slot);
  }
  return slots;
}

export function completeSlot(plan, record) {
  if (!plan || !record?.slotId || !parseKey(record.date)) return plan;
  const completion = { slotId: String(record.slotId), date: record.date, completedAt: String(record.completedAt || `${record.date}T12:00:00Z`), ...(MODES.has(record.practiceMode) ? { practiceMode: record.practiceMode } : {}) };
  const completions = [...(plan.completions || []).filter(item => item.slotId !== completion.slotId), completion]
    .sort((a, b) => a.date.localeCompare(b.date));
  return { ...plan, completions };
}

export function uncompleteSlot(plan, slotId) {
  if (!plan) return plan;
  return { ...plan, completions: (plan.completions || []).filter(item => item.slotId !== slotId) };
}

export function skipSlot(plan, date) {
  if (!plan || !parseKey(date)) return plan;
  return { ...plan, skippedDates: [...new Set([...(plan.skippedDates || []), date])].sort() };
}

export function restoreSlot(plan, date) {
  if (!plan) return plan;
  return { ...plan, skippedDates: (plan.skippedDates || []).filter(item => item !== date) };
}

export function rescheduleSlot(plan, sourceDate, date, time) {
  if (!plan || !baseSlotForDate(plan, sourceDate) || !parseKey(date) || (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))) return plan;
  return { ...plan, rescheduled: { ...(plan.rescheduled || {}), [sourceDate]: {date,time:time || ""} } };
}

export function updateNotifications(plan, notifications) {
  if (!plan) return plan;
  return { ...plan, notifications: { calendar:notifications?.calendar===true, email:notifications?.email===true, emailAddress:notifications?.email===true?String(notifications.emailAddress||"").trim().toLowerCase():"" } };
}

export function pausePlan(plan, from, until) {
  if (!plan || !parseKey(from) || !parseKey(until) || until < from) return plan;
  return { ...plan, pausedFrom:from, pausedUntil:until };
}

export function resumePlan(plan) {
  if (!plan) return plan;
  const next = {...plan}; delete next.pausedFrom; delete next.pausedUntil; return next;
}

export function historySummary(plan, today) {
  const completions = [...(plan?.completions || [])].filter(item => parseKey(item.date) && item.date <= today);
  const completedIds = new Set(completions.map(item => item.slotId));
  const due = [];
  if (plan?.startDate && parseKey(today)) for (let cursor=parseKey(plan.startDate);cursor<=parseKey(today);cursor=new Date(cursor.getTime()+DAY_MS)){const slot=slotForDate(plan,keyFromDate(cursor));if(slot)due.push(slot)}
  let streak=0;for(let i=due.length-1;i>=0&&completedIds.has(due[i].id);i--)streak++;
  const journeyDay = plan?.style === "journey" ? completions.reduce((max,item)=>{const source=String(item.slotId||"").replace(/^plan-/,"");const index=matchingDayIndex(plan,source);return Math.max(max,index>=0?index+1:0)},0) : null;
  return { sessions: completions.length, streak, journeyDay };
}

const escapeIcs = value => String(value).replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\r?\n/g, "\\n");
const stamp = value => String(value).replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const localStart = (key, time) => `${key.replace(/-/g, "")}T${time.replace(":", "")}00`;
const eventLines = ({ uid, title, date, time, durationMin, rrule, timeZone, exdates=[] }, now) => {
  if (!time) {
    const nextDate = keyFromDate(new Date(parseKey(date).getTime() + DAY_MS));
    return ["BEGIN:VEVENT", `UID:${escapeIcs(uid)}`, `DTSTAMP:${stamp(now)}`, `DTSTART;VALUE=DATE:${date.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${nextDate.replace(/-/g, "")}`, `SUMMARY:${escapeIcs(title)}`, ...(rrule ? [`RRULE:${rrule}`] : []), ...(exdates.length?[`EXDATE;VALUE=DATE:${exdates.map(key=>key.replace(/-/g, "")).join(",")}`]:[]), "BEGIN:VALARM", "TRIGGER:PT9H", "ACTION:DISPLAY", `DESCRIPTION:${escapeIcs(`Time for ${title}`)}`, "END:VALARM", "END:VEVENT"];
  }
  const start = parseKey(date);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate(), +time.slice(0, 2), +time.slice(3)) + durationMin * 60000);
  const endLocal = `${keyFromDate(end).replace(/-/g, "")}T${pad(end.getUTCHours())}${pad(end.getUTCMinutes())}00`;
  const zone = timeZone ? `;TZID=${escapeIcs(timeZone)}` : "";
  return ["BEGIN:VEVENT", `UID:${escapeIcs(uid)}`, `DTSTAMP:${stamp(now)}`, `DTSTART${zone}:${localStart(date, time)}`, `DTEND${zone}:${endLocal}`, `SUMMARY:${escapeIcs(title)}`, ...(rrule ? [`RRULE:${rrule}`] : []), ...(exdates.length?[`EXDATE${zone}:${exdates.map(key=>localStart(key,time)).join(",")}`]:[]), "BEGIN:VALARM", "TRIGGER:-PT30M", "ACTION:DISPLAY", `DESCRIPTION:${escapeIcs(`Time for ${title}`)}`, "END:VALARM", "END:VEVENT"];
};

export function planToICS(plan, now = "2026-01-01T12:00:00Z") {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Moxie Studios//Practice Plan//EN", "CALSCALE:GREGORIAN"];
  if (plan.style === "journey") {
    let lastBase=parseKey(plan.startDate),matches=0;
    const seriesDays=Number.isFinite(+plan.seriesDays)&&+plan.seriesDays>=1&&+plan.seriesDays<=30?Math.round(+plan.seriesDays):30;
    while(matches<seriesDays){const key=keyFromDate(lastBase),paused=plan.pausedFrom&&plan.pausedUntil&&key>=plan.pausedFrom&&key<=plan.pausedUntil;if(!paused&&plan.days.includes(lastBase.getUTCDay()))matches++;if(matches<seriesDays)lastBase=new Date(lastBase.getTime()+DAY_MS)}
    const movedEnds=Object.values(plan.rescheduled||{}).map(value=>parseKey(value.date)).filter(Boolean);const end=movedEnds.reduce((max,date)=>date>max?date:max,lastBase);
    for(let cursor=parseKey(plan.startDate);cursor<=end;cursor=new Date(cursor.getTime()+DAY_MS)){const slot=slotForDate(plan,keyFromDate(cursor));if(slot)lines.push(...eventLines({uid:`${slot.id}@practice-village`,title:slot.title,date:slot.date,time:slot.time,durationMin:slot.durationMin,timeZone:plan.timeZone},now))}
    return lines.concat("END:VCALENDAR", "").join("\r\n");
  }
  for (const day of plan.days) {
    let date = parseKey(plan.startDate);
    while (date.getUTCDay() !== day) date = new Date(date.getTime() + DAY_MS);
    const pausedDates=[];
    if(plan.pausedFrom&&plan.pausedUntil){
      for(let paused=parseKey(plan.pausedFrom);paused&&paused<=parseKey(plan.pausedUntil);paused=new Date(paused.getTime()+DAY_MS)){
        if(paused.getUTCDay()===day)pausedDates.push(keyFromDate(paused));
      }
    }
    const exdates=[...(plan.skippedDates||[]),...Object.keys(plan.rescheduled||{}),...pausedDates].filter(key=>parseKey(key)?.getUTCDay()===day);
    const dayTime=plan.times&&Object.prototype.hasOwnProperty.call(plan.times,day)?plan.times[day]:(plan.time||"");
    lines.push(...eventLines({ uid: `moxie-plan-${day}@practice-village`, title:"Moxie practice", date: keyFromDate(date), time:dayTime, durationMin: plan.durationMin, rrule: `FREQ=WEEKLY;BYDAY=${DOW[day]}`, timeZone:plan.timeZone,exdates }, now));
  }
  for(const [source,change] of Object.entries(plan.rescheduled||{})){const slot=slotForDate(plan,change.date);if(slot)lines.push(...eventLines({uid:`plan-${source}-moved@practice-village`,title:slot.title,date:slot.date,time:slot.time,durationMin:slot.durationMin,timeZone:plan.timeZone},now))}
  return lines.concat("END:VCALENDAR", "").join("\r\n");
}

export function slotToICS(slot, now = "2026-01-01T12:00:00Z") {
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Moxie Studios//Practice Slot//EN", "CALSCALE:GREGORIAN", ...eventLines({ uid: `${slot.id}@practice-village`, title: slot.title, date: slot.date, time: slot.time, durationMin: slot.durationMin, timeZone:slot.timeZone }, now), "END:VCALENDAR", ""].join("\r\n");
}
