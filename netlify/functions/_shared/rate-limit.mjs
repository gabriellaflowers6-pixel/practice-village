// Per-day request caps for model-backed endpoints, on Netlify Blobs.
// Why: /concierge is reachable from the public homepage (the "porch"), so it
// can never be login-only. Without a cap anyone can script unbounded Gemini
// spend against it. Three fences, checked in order:
//   1. a per-IP daily cap for anonymous visitors
//   2. a global daily ceiling on anonymous traffic (spend circuit breaker)
//   3. a per-account daily cap for signed-in members
// Counters are day-bucketed keys; get+set is not atomic, so a burst can
// overshoot a cap by a few requests. That is fine: the point is bounding
// spend, not exact accounting.
import { getStore } from "@netlify/blobs";

export const LIMITS = {
  anonPerIpPerDay: Number(process.env.CONCIERGE_ANON_PER_IP_PER_DAY) || 20,
  anonGlobalPerDay: Number(process.env.CONCIERGE_ANON_GLOBAL_PER_DAY) || 400,
  memberPerDay: Number(process.env.CONCIERGE_MEMBER_PER_DAY) || 200,
};

function store() {
  return getStore({ name: "practice-village-ratelimit", consistency: "strong" });
}

function dayKey(now = new Date()) {
  return now.toISOString().slice(0, 10); // UTC day bucket
}

function secondsUntilUtcMidnight(now = new Date()) {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return Math.max(1, Math.ceil((next - now) / 1000));
}

export function clientIp(req, context) {
  const fromContext = context?.ip;
  const header = req?.headers?.get?.("x-nf-client-connection-ip") || req?.headers?.get?.("x-forwarded-for") || "";
  const ip = (fromContext || header.split(",")[0] || "").trim();
  return ip || "unknown";
}

async function bump(key, limit) {
  const s = store();
  const current = Number(await s.get(key)) || 0;
  if (current >= limit) return { allowed: false, count: current, limit };
  await s.set(key, String(current + 1));
  return { allowed: true, count: current + 1, limit };
}

// Returns { allowed, headers } — headers carry X-RateLimit-* and, when
// blocked, Retry-After. `subject` is { ip } for anonymous or { email } for members.
export async function checkDailyLimit(scope, subject) {
  const day = dayKey();
  const retry = secondsUntilUtcMidnight();
  let result;
  try {
    if (subject.email) {
      result = await bump(`${scope}/member/${day}/${subject.email.toLowerCase()}`, LIMITS.memberPerDay);
    } else {
      // Per-IP first so a single hammering IP cannot burn the shared ceiling
      // and lock every other porch visitor out.
      result = await bump(`${scope}/anon-ip/${day}/${subject.ip || "unknown"}`, LIMITS.anonPerIpPerDay);
      if (result.allowed) result = await bump(`${scope}/anon-global/${day}`, LIMITS.anonGlobalPerDay);
    }
  } catch {
    // If the store is unreachable, fail closed for anonymous traffic (spend
    // protection) and open for verified members (do not lock members out).
    result = { allowed: Boolean(subject.email), count: 0, limit: 0 };
  }
  const headers = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(Math.max(0, result.limit - result.count)),
    "X-RateLimit-Reset": String(retry),
  };
  if (!result.allowed) headers["Retry-After"] = String(retry);
  return { allowed: result.allowed, headers };
}
