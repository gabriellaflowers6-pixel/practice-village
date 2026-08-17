// One-use constrained token issuer for browser-direct Gemini Live sessions.
// This endpoint never returns GEMINI_API_KEY. Production should add user auth
// and rate limits before deployment; this repository deliberately does not deploy.
const json = (o) => new Response(JSON.stringify(o), { headers: { "content-type": "application/json" } });

export function requestBody(nowValue = Date.now(), modelValue = process.env.GEMINI_LIVE_MODEL || "gemini-3.1-flash-live-preview") {
  const now = new Date(nowValue).getTime();
  const model = modelValue.startsWith("models/") ? modelValue : `models/${modelValue}`;
  return {
    uses: 1,
    expireTime: new Date(now + 30 * 60 * 1000).toISOString(),
    newSessionExpireTime: new Date(now + 60 * 1000).toISOString(),
    bidiGenerateContentSetup: {
      model,
      generationConfig: { responseModalities: ["AUDIO"] },
      sessionResumption: {},
    },
  };
}

export default async (req) => {
  if (req.method !== "GET") return json({ ok: false, error: "bad request" });
  if (!process.env.GEMINI_API_KEY) return json({ ok: false, error: "Live Guide is not set up yet" });
  try {
    const result = await fetch("https://generativelanguage.googleapis.com/v1beta/auth_tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify(requestBody()),
    });
    const data = await result.json();
    if (!result.ok || typeof data.name !== "string" || !data.name) {
      console.error("Gemini Live token request failed", result.status, data?.error?.message || "unknown response");
      throw new Error("token failed");
    }
    return json({ ok: true, token: data.name });
  } catch {
    return json({ ok: false, error: "Live Guide is unavailable right now" });
  }
};

// Answers at the site root and inside the studio folder, so the same file
// serves moxiestudio.netlify.app and the studio living under Practice
// Village without claiming a route at the root of their site.
export const config = { path: ["/live-token", "/studio/live-token"] };
