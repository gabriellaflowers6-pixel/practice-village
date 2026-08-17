const json = (body, status=200) => new Response(JSON.stringify(body), {status,headers:{"content-type":"application/json","cache-control":"no-store"}});

export default async req => {
  if (req.method !== "GET") return json({ok:false,error:"bad request"},405);
  const url=process.env.SUPABASE_URL,anon_key=process.env.SUPABASE_ANON_KEY;
  if (!url || !anon_key) return json({ok:false,error:"Account sign-in is not configured yet."},503);
  return json({ok:true,url,anon_key});
};

// Answers at the site root and inside the studio folder, so the same file
// serves moxiestudio.netlify.app and the studio living under Practice
// Village without claiming a route at the root of their site.
export const config = { path: ["/auth-config", "/studio/auth-config"] };
