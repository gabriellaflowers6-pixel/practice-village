const DESTINATIONS=Object.freeze({dashboard:"zenbottom-schedule.html",settings:"zenbottom-settings.html",saved_practices:"zenbottom-settings.html?section=lessons",saved_curriculums:"zenbottom-settings.html?section=curriculums",library:"zenbottom-library.html",meditation:"zenbottom-meditations.html",profile:"zenbottom-student-profile.html"});
const MODES=new Set(["yoga","meditation"]);

export function cleanCoachAction(value){
  if(!value||typeof value!=="object")return null;
  if(value.type==="navigate"&&DESTINATIONS[value.destination])return {type:"navigate",destination:value.destination};
  if(value.type==="create_challenge"){
    const days=Math.round(Number(value.days));
    if(!MODES.has(value.practiceMode)||!Number.isFinite(days)||days<1||days>30)return null;
    return {type:"create_challenge",practiceMode:value.practiceMode,days,calendar:value.calendar!==false,email:value.email===true};
  }
  if(value.type==="open_calendar")return {type:"open_calendar"};
  if(value.type==="set_reminders")return {type:"set_reminders",calendar:value.calendar===true,email:value.email===true};
  return null;
}

export function cleanCoachActions(values){return (Array.isArray(values)?values:[]).map(cleanCoachAction).filter(Boolean).slice(0,3)}
export function destinationHref(destination,mode="demo"){const base=DESTINATIONS[destination];if(!base)return null;const url=new URL(base,"https://moxie.local/");url.searchParams.set(mode==="preview"?"preview":"demo","1");return url.pathname.split("/").pop()+url.search}
export function actionNeedsConfirmation(action){return action?.type==="create_challenge"||action?.type==="set_reminders"}
export function actionLabel(action){
  if(action?.type==="navigate")return `Open ${action.destination.replaceAll("_"," ")}`;
  if(action?.type==="open_calendar")return "Open calendar";
  if(action?.type==="set_reminders")return "Update reminders";
  if(action?.type==="create_challenge")return `Create ${action.days}-day beginner ${action.practiceMode} challenge`;
  return "";
}
