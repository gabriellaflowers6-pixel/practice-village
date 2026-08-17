import { DEFAULT_LIVE_VOICE, cleanLiveVoice } from "./live-coach-lib.mjs";

const PREFIX = "moxieLiveTutor:";

export function tutorSettingsKey(email) {
  return PREFIX + (String(email || "").trim().toLowerCase() || "guest");
}

export function defaultTutorSettings() {
  return { voice: DEFAULT_LIVE_VOICE, voiceEnabled: true, listeningEnabled: true, wakeWordMode: true, correctionsEnabled: true };
}

export function normalizeTutorSettings(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    voice: cleanLiveVoice(source.voice) || DEFAULT_LIVE_VOICE,
    voiceEnabled: source.voiceEnabled !== false,
    listeningEnabled: source.listeningEnabled !== false,
    wakeWordMode: source.wakeWordMode !== false,
    correctionsEnabled: source.correctionsEnabled !== false,
  };
}

export function readTutorSettings(storage, email) {
  try { return normalizeTutorSettings(JSON.parse(storage.getItem(tutorSettingsKey(email)) || "null")); }
  catch { return defaultTutorSettings(); }
}

export function writeTutorSettings(storage, email, value) {
  const settings = normalizeTutorSettings(value);
  storage.setItem(tutorSettingsKey(email), JSON.stringify(settings));
  return settings;
}
