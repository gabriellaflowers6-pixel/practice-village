import { compatibleLessonIds, lessonDemands, profileConcerns } from "./coach-lib.mjs";

const DEMAND_LABELS={wrist_pressure:"wrist pressure",knee_pressure:"kneeling",deep_knee_bend:"deep knee bending",foot_pressure:"standing foot pressure",single_foot_pressure:"one-foot balance",foot_top_pressure:"pressure on the top of the foot",inversion:"an inversion",backbend:"backbending",forward_fold:"forward folding",shoulder_load:"shoulder weight-bearing",shoulder_overhead:"arms overhead",long_hold:"longer holds",standing:"standing"};
const BLENDED_IDS=new Set(["morning-stretch","easy-standing-flow","rest-and-restore","sun-salutation-lite","moxie-sequence"]);

const lessonSections=(approved,id)=>{const spec=approved.lessons[id],base=spec?.base?approved.lessons[spec.base]:null;return spec?.sections||base?.sections||{}};
const lessonPoses=(approved,id)=>Object.values(lessonSections(approved,id)).flat();
const minutesFor=(approved,id)=>Math.max(5,Math.min(30,Math.round(lessonPoses(approved,id).reduce((sum,pose)=>sum+(approved.poses[pose]?.holdBreaths||4)*.35+1,2))));

export function buildLessonLibrary(approved,meditations={}){
  const yoga=Object.entries(approved.lessons).map(([curriculumId,spec])=>{const poses=lessonPoses(approved,curriculumId),demands=[...lessonDemands(approved,curriculumId)];return {id:`yoga:${curriculumId}`,mode:"yoga",curriculumId,title:spec.title,intro:spec.intro||"",durationMin:minutesFor(approved,curriculumId),poses,poseNames:poses.map(pose=>approved.poses[pose]?.pretty).filter(Boolean),poseDetails:poses.map(pose=>({pose,name:approved.poses[pose]?.pretty||pose,description:approved.poses[pose]?.cue||""})),demands};});
  const meditation=Object.entries(meditations).map(([sessionId,spec])=>({id:`meditation:${sessionId}`,mode:"meditation",sessionId,title:spec.title,intro:spec.intro||"",durationMin:5,poses:[],poseNames:[],demands:[]}));
  const blended=yoga.filter(item=>BLENDED_IDS.has(item.curriculumId)).map(item=>({...item,id:`blended:${item.curriculumId}`,mode:"blended",title:`${item.title} + meditation`,durationMin:item.durationMin+5}));
  return [...yoga,...meditation,...blended];
}

export function filterLessonLibrary(items,filters={},approved,profile={}){
  const query=String(filters.query||"").trim().toLowerCase(),mode=filters.mode||"all",max=Number(filters.maxDuration)||Infinity,extra=new Set(filters.avoidDemands||[]);
  const compatible=new Set(compatibleLessonIds(approved,profileConcerns(profile)));
  return items.filter(item=>{
    if(mode!=="all"&&item.mode!==mode)return false;
    if(item.durationMin>max)return false;
    if(query&&!`${item.title} ${item.intro} ${item.poseNames.join(" ")} ${item.demands.join(" ")}`.toLowerCase().includes(query))return false;
    if(item.demands.some(demand=>extra.has(demand)))return false;
    if(filters.compatibleOnly!==false&&item.mode!=="meditation"&&!compatible.has(item.curriculumId))return false;
    return true;
  });
}

export function incompatibilityReasons(item,approved,profile={}){
  if(item.mode==="meditation")return [];
  const allowed=new Set(compatibleLessonIds(approved,profileConcerns(profile)));if(allowed.has(item.curriculumId))return [];
  const concerns=new Set(profileConcerns(profile)),demands=new Set(item.demands),reasons=[];
  const pairs=[["wrist_sensitive",["wrist_pressure"]],["knee_sensitive",["knee_pressure","deep_knee_bend"]],["hip_sensitive",["hip_flexion","hip_extension","hip_load"]],["shoulder_sensitive",["shoulder_load","shoulder_overhead"]],["lower_back_sensitive",["backbend","forward_fold","spinal_rotation","spinal_flexion_extension"]],["neck_sensitive",["backbend","shoulder_overhead"]],["avoid_inversions",["inversion"]],["shorter_holds",["long_hold"]],["prefer_seated",["standing","wrist_pressure","knee_pressure","prone"]]];
  for(const [concern,blocked] of pairs)if(concerns.has(concern)){const found=blocked.find(value=>demands.has(value));if(found)reasons.push(DEMAND_LABELS[found]||found.replaceAll("_"," "));}
  return [...new Set(reasons)];
}

const esc=value=>String(value).replace(/\\/g,"\\\\").replace(/,/g,"\\,").replace(/;/g,"\\;").replace(/\r?\n/g,"\\n");
export function lessonToICS(item,date,time="09:00",now="2026-01-01T12:00:00Z"){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw new Error("valid date and time required");
  const [year,month,day]=date.split("-").map(Number),[hour,minute]=time.split(":").map(Number);
  const floating=value=>`${value.getUTCFullYear()}${String(value.getUTCMonth()+1).padStart(2,"0")}${String(value.getUTCDate()).padStart(2,"0")}T${String(value.getUTCHours()).padStart(2,"0")}${String(value.getUTCMinutes()).padStart(2,"0")}00`;
  const start=new Date(Date.UTC(year,month-1,day,hour,minute)),end=new Date(start.getTime()+item.durationMin*60000),utcStamp=value=>value.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
  return ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Moxie Studios//Lesson Library//EN","BEGIN:VEVENT",`UID:${esc(item.id)}-${date}@moxie-studios`,`DTSTAMP:${utcStamp(new Date(now))}`,`DTSTART:${floating(start)}`,`DTEND:${floating(end)}`,`SUMMARY:${esc(item.title)}`,`DESCRIPTION:${esc(`Moxie ${item.mode} practice. Open Moxie Studios to begin.`)}`,"BEGIN:VALARM","TRIGGER:-PT30M","ACTION:DISPLAY",`DESCRIPTION:${esc(`Time for ${item.title}`)}`,"END:VALARM","END:VEVENT","END:VCALENDAR",""] .join("\r\n");
}
