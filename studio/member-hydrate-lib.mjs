import { planKey, savePlan } from "./practice-plan-lib.mjs";
import { settingsKey, writeSettings } from "./settings-lib.mjs";
import { poseProgressKey, writePoseProgress } from "./pose-progress-lib.mjs";
import { writeMeditationFavorites } from "./meditation-sync-lib.mjs";

const fail=(label,error)=>{if(error)throw new Error(`Could not restore ${label}: ${error.message||"unknown error"}`)};

export async function hydrateMemberData({storage,email,userId,supabase}){
  if(!supabase?.from||!userId)throw new Error("A signed-in member is required to restore data.");
  const [profile,lessons,curriculums,joins,plan,sessions,poses,favorites]=await Promise.all([
    supabase.from("practice_profiles").select("*").eq("user_id",userId).maybeSingle(),
    supabase.from("saved_lessons").select("*").eq("user_id",userId).is("archived_at",null).order("saved_at",{ascending:false}),
    supabase.from("curriculums").select("*").eq("user_id",userId).order("saved_at",{ascending:false}),
    supabase.from("curriculum_lessons").select("curriculum_id,lesson_id,position").order("position",{ascending:true}),
    supabase.from("practice_plans").select("*").eq("user_id",userId).maybeSingle(),
    supabase.from("practice_sessions").select("slot_id,scheduled_date,completed_at").eq("user_id",userId).eq("source","plan").neq("slot_id",""),
    supabase.from("pose_progress").select("pose_id,status,practice_count,variation,first_learned_at,last_practiced_at").eq("user_id",userId),
    supabase.from("meditation_favorites").select("meditation_slug").eq("user_id",userId),
  ]);
  [["practice profile",profile],["saved practices",lessons],["curricula",curriculums],["curriculum order",joins],["practice plan",plan],["practice history",sessions],["pose progress",poses],["meditation favorites",favorites]].forEach(([label,result])=>fail(label,result.error));
  const restored={settings:false,plan:false,poses:false,favorites:false};
  if(storage.getItem(settingsKey(email))===null){
    const p=profile.data||{};
    const localLessons=(lessons.data||[]).map(row=>({id:row.id,title:row.title,lesson:row.lesson,durationMin:row.duration_min,savedAt:row.saved_at}));
    const localCurriculums=(curriculums.data||[]).map(row=>({id:row.id,title:row.title,description:row.description,icon:row.icon,savedAt:row.saved_at,lessonIds:(joins.data||[]).filter(join=>join.curriculum_id===row.id).sort((a,b)=>a.position-b.position).map(join=>join.lesson_id)}));
    writeSettings(storage,email,{lessons:localLessons,curriculums:localCurriculums,notifyAll:false,practiceProfile:{enabled:p.enabled===true,intentions:p.intentions||[],areas:p.areas||[],equipment:p.equipment||[],movementOptions:p.movement_options||[],rangeLevel:p.range_level||"",note:p.note||""}});restored.settings=true;
  }
  if(storage.getItem(planKey(email))===null&&plan.data){const p=plan.data;savePlan(storage,email,{version:1,style:p.style,startDate:p.start_date,days:p.days||[],daysPerWeek:(p.days||[]).length,time:p.default_time||"",times:p.times||{},durationMin:p.duration_min,timeZone:p.time_zone||"",notifications:{calendar:p.notify_calendar===true,email:p.notify_email===true,emailAddress:p.notify_email_address||""},pausedFrom:p.paused_from||undefined,pausedUntil:p.paused_until||undefined,skippedDates:p.skipped_dates||[],rescheduled:p.rescheduled||{},completions:(sessions.data||[]).map(row=>({slotId:row.slot_id,date:row.scheduled_date,completedAt:row.completed_at}))});restored.plan=true}
  if(storage.getItem(poseProgressKey(email))===null&&(poses.data||[]).length){writePoseProgress(storage,email,poses.data);restored.poses=true}
  if(storage.getItem("moxieMeditations")===null&&(favorites.data||[]).length){writeMeditationFavorites(storage,new Set(favorites.data.map(row=>row.meditation_slug)));restored.favorites=true}
  return restored;
}
