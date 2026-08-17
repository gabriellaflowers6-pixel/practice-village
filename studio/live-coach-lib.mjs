// Pure Gemini Live helpers. Browser media and WebSocket lifecycle live in
// live-coach.mjs so this protocol boundary can be unit tested in Node.
export const LIVE_MODEL = "gemini-3.1-flash-live-preview";
export const LIVE_SAMPLE_RATE = 16000;
export const LIVE_FRAME_INTERVAL_MS = 5000;
export const DEFAULT_LIVE_VOICE = "Zephyr";

// One description of the microphone, shared by the page that opens it early and
// the coach that consumes it. Two different constraint objects make the browser
// treat them as two requests and open the device twice.
export const MIC_CONSTRAINTS = Object.freeze({
  audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
  video: false,
});

export const LIVE_FUNCTIONS = [
  { name: "repeat_cue", description: "Repeat the current visible pose cue." },
  { name: "extend_hold", description: "Add two calm breaths to the active hold." },
  { name: "restart_pose", description: "Restart the current pose from its demonstration." },
  { name: "next_pose", description: "Advance to the next pose." },
  { name: "offer_modification", description: "Offer a gentle, non-medical modification in words only." },
];

// The coach's spoken voice. Names are Gemini Live prebuilt voices; the feel
// words are for the picker label only. Order = picker order, first is default.
export const LIVE_VOICES = [
  { name: "Zephyr", feel: "bright" },
  { name: "Sulafat", feel: "warm" },
  { name: "Despina", feel: "smooth" },
  { name: "Achernar", feel: "soft" },
  { name: "Callirrhoe", feel: "easy-going" },
  { name: "Vindemiatrix", feel: "gentle" },
  { name: "Aoede", feel: "breezy" },
  { name: "Kore", feel: "steady" },
];

export function cleanLiveVoice(value) {
  const hit = LIVE_VOICES.find((v) => v.name.toLowerCase() === String(value || "").trim().toLowerCase());
  return hit ? hit.name : "";
}

export function constrainedTokenRequest(now = new Date()) {
  const at = new Date(now).getTime();
  // Schema verified against the live endpoint 2026-08-07: Google renamed
  // liveConnectConstraints -> bidiGenerateContentSetup (models/ prefix required,
  // responseModalities under generationConfig, sessionResumption a sibling).
  // serve.py live_token_request() is the python twin; keep them identical.
  return {
    uses: 1,
    expireTime: new Date(at + 30 * 60 * 1000).toISOString(),
    newSessionExpireTime: new Date(at + 60 * 1000).toISOString(),
    bidiGenerateContentSetup: {
      model: `models/${LIVE_MODEL}`,
      generationConfig: { responseModalities: ["AUDIO"] },
      sessionResumption: {},
    },
  };
}

export function liveSetup(instruction, voice = DEFAULT_LIVE_VOICE) {
  // Same 2026-08 rename as the token: responseModalities (and speechConfig)
  // live under generationConfig now. Top-level responseModalities closes the
  // socket with 1007 "Cannot find field". Verified against the live WS.
  const generationConfig = { responseModalities: ["AUDIO"] };
  const voiceName = cleanLiveVoice(voice) || DEFAULT_LIVE_VOICE;
  generationConfig.speechConfig = { voiceConfig: { prebuiltVoiceConfig: { voiceName } } };
  return { setup: {
    model: `models/${LIVE_MODEL}`,
    generationConfig,
    inputAudioTranscription: {},
    outputAudioTranscription: {},
    tools: [{ functionDeclarations: LIVE_FUNCTIONS }],
    systemInstruction: { parts: [{ text: instruction }] },
  } };
}

export function resampleTo16k(samples, sourceRate, targetRate = LIVE_SAMPLE_RATE) {
  if (!(samples instanceof Float32Array) || !Number.isFinite(sourceRate) || sourceRate <= 0) return new Float32Array();
  if (sourceRate === targetRate) return samples.slice();
  const length = Math.max(1, Math.round(samples.length * targetRate / sourceRate));
  const out = new Float32Array(length);
  const ratio = sourceRate / targetRate;
  for (let i = 0; i < length; i++) {
    const p = i * ratio, left = Math.floor(p), right = Math.min(left + 1, samples.length - 1), mix = p - left;
    out[i] = samples[left] * (1 - mix) + samples[right] * mix;
  }
  return out;
}

export function float32ToPcm16(samples) {
  const out = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const x = Math.max(-1, Math.min(1, Number(samples[i]) || 0));
    out[i] = x < 0 ? Math.round(x * 0x8000) : Math.round(x * 0x7fff);
  }
  return out;
}

export function acceptsLiveTool(name) {
  return LIVE_FUNCTIONS.some((fn) => fn.name === name);
}

export function shouldSendFrame(lastAt, now, interval = LIVE_FRAME_INTERVAL_MS) {
  return !Number.isFinite(lastAt) || now - lastAt >= interval;
}
