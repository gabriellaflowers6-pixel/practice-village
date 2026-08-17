const PREFIX="moxiePoseProgress:";
const key=email=>PREFIX+(String(email||"").trim().toLowerCase()||"guest");
export const poseProgressKey=key;

export function readPoseProgress(storage,email){try{const rows=JSON.parse(storage.getItem(key(email))||"[]");return Array.isArray(rows)?rows:[]}catch{return[]}}
export function writePoseProgress(storage,email,rows){storage.setItem(key(email),JSON.stringify(rows));return rows}

export function practicePose(storage,email,poseId,at=new Date().toISOString()){
  const pose=String(poseId||"").trim().slice(0,64);if(!pose)return null;
  const rows=readPoseProgress(storage,email),prior=rows.find(row=>row.pose_id===pose),count=(prior?.practice_count||0)+1;
  const row={pose_id:pose,status:count>=10?"confident":count>=3?"familiar":"learning",practice_count:count,variation:prior?.variation||"",first_learned_at:prior?.first_learned_at||at,last_practiced_at:at};
  storage.setItem(key(email),JSON.stringify([row,...rows.filter(item=>item.pose_id!==pose)]));return row;
}

export async function syncPoseProgress({supabase,userId,row}){
  return supabase.from("pose_progress").upsert({...row,user_id:userId},{onConflict:"user_id,pose_id"});
}
