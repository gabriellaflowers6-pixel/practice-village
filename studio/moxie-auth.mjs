// Browser-side account helper. The Supabase anon key is intentionally public;
// privileged service keys remain server-only in .env.schedule.
import { studioPath } from "./studio-base.mjs";
const CONFIG_ENDPOINT = studioPath("auth-config");
let clientPromise;

async function config() {
  const response = await fetch(CONFIG_ENDPOINT, { cache: "no-store" });
  const value = await response.json();
  if (!response.ok || !value.ok) throw new Error(value.error || "Account sign-in is not configured yet.");
  return value;
}

export async function authClient() {
  if (!clientPromise) clientPromise = (async () => {
    const settings = await config();
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.49.1");
    return createClient(settings.url, settings.anon_key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  })();
  return clientPromise;
}

// Passwordless: one emailed link both signs in and, on first use, creates the
// account (students only for now; the teacher flow is parked).
export async function sendLink(email) {
  const supabase = await authClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: location.origin + "/mockups/zenbottom-schedule.html",
      shouldCreateUser: true,
      data: { full_name: "", role: "student" },
    },
  });
  if (error) throw error;
}

export async function signOut() {
  const supabase = await authClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function currentAccount() {
  const supabase = await authClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("id,full_name,username,bio,avatar_path,role,teacher_status").eq("id", user.id).maybeSingle();
  return { user, profile: profile || { full_name: user.user_metadata?.full_name || "", role: user.user_metadata?.role || "student" } };
}

export function accountRoute(role) {
  return role === "teacher" ? "zenbottom-teacher-onboarding.html" : "zenbottom-schedule.html";
}
