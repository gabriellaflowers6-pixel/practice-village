import { cleanLiveVoice, DEFAULT_LIVE_VOICE } from "./live-coach-lib.mjs";

export const SESSION_TYPES = ["yoga", "meditation", "blended"];
export const SESSION_DURATIONS = [3, 5, 7, 10, 12, 20, 30, 45];
export const SESSION_MUSIC = ["quiet", "ember", "rain", "bowl"];

export const DEFAULT_SESSION_SETUP = Object.freeze({
  type: "yoga",
  duration: 20,
  voice: DEFAULT_LIVE_VOICE,
  music: "quiet",
  camera: true,
  liveGuide: false,
});

export function cleanSessionSetup(value = {}) {
  const type = SESSION_TYPES.includes(value.type) ? value.type : DEFAULT_SESSION_SETUP.type;
  const requestedDuration = Math.round(Number(value.duration));
  const duration = SESSION_DURATIONS.includes(requestedDuration)
    ? requestedDuration
    : (type === "meditation" ? 5 : DEFAULT_SESSION_SETUP.duration);
  const music = SESSION_MUSIC.includes(value.music) ? value.music : DEFAULT_SESSION_SETUP.music;
  const camera = value.camera !== false;
  return {
    type,
    duration,
    voice: cleanLiveVoice(value.voice) || DEFAULT_SESSION_SETUP.voice,
    music,
    camera,
    liveGuide: camera && value.liveGuide === true,
  };
}

export function sessionDestination(value, context = {}) {
  const setup = cleanSessionSetup(value);
  const params = new URLSearchParams();
  params.set("mode", setup.type);
  params.set("duration", String(setup.duration));
  params.set("music", setup.music);
  params.set("voice", setup.voice);
  params.set("camera", setup.camera ? "on" : "off");
  if (setup.liveGuide) params.set("live", "on");
  for (const key of ["slot", "date", "session"]) {
    if (context[key]) params.set(key, String(context[key]));
  }
  if (context.demo) params.set("demo", "1");
  if (setup.type === "meditation") return `zenbottom-meditation-session.html?${params}`;
  if (setup.type === "blended") params.set("next", "meditation");
  return `zenbottom-practice.html?${params}`;
}
