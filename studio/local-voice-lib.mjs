// Choosing the browser voice that speaks Moxie's own lines.
//
// This is NOT the Gemini Live voice (Zephyr, Sulafat, and the rest of
// LIVE_VOICES in live-coach-lib.mjs). Those only exist once a live tutor
// session is connected. Lines the app speaks before or outside a session go
// through the browser's speechSynthesis, and if nothing picks a voice the
// browser uses the machine's default. On macOS that default is often Daniel,
// an old gravelly en-GB system voice, which is what made the begin screen
// sound like a heavy smoker.
//
// So we choose deliberately, best first, and degrade down a chain rather than
// ever falling through to the machine default.

// Ranked by how they actually sound reading a calm line aloud.
// "Google *" are Chrome's own network voices and are clearly the best here.
// Samantha is the decent modern macOS voice. The rest are ordinary fallbacks.
const PREFERRED = [
  "Google US English",
  "Google UK English Female",
  "Samantha",
  "Karen",
  "Moira",
];

// macOS ships a pile of novelty voices (Bells, Boing, Jester, Bubbles, Bad
// News, Organ...) that are legal en-US SpeechSynthesisVoices and would be a
// disaster to read a yoga cue in. Never auto-select one.
const NOVELTY = new Set([
  "Albert", "Bad News", "Bahh", "Bells", "Boing", "Bubbles", "Cellos",
  "Good News", "Jester", "Organ", "Trinoids", "Whisper", "Wobble", "Zarvox",
  "Grandma", "Grandpa", "Junior", "Ralph", "Fred", "Kathy", "Eddy", "Flo",
  "Reed", "Rocko", "Sandy", "Shelley", "Superstar",
]);

// A macOS voice can be listed as "Grandma (English (United States))", so match
// on the leading name rather than the whole decorated string.
function baseName(voice) {
  return String(voice?.name || "").split("(")[0].trim();
}

function isNovelty(voice) {
  return NOVELTY.has(baseName(voice));
}

function isEnglish(voice) {
  return String(voice?.lang || "").toLowerCase().startsWith("en");
}

/**
 * Pick the nicest available voice for a spoken app line.
 *
 * Returns null when there is nothing worth choosing, which the caller should
 * treat as "say it with whatever the browser does by default" rather than as
 * an error. Speaking in a plain voice beats not speaking at all.
 *
 * @param {Array} voices result of speechSynthesis.getVoices()
 * @returns {object|null}
 */
export function pickSpokenVoice(voices) {
  const list = Array.isArray(voices) ? voices.filter(Boolean) : [];
  if (!list.length) return null;

  for (const wanted of PREFERRED) {
    const hit = list.find((voice) => baseName(voice) === wanted);
    if (hit) return hit;
  }

  const english = list.filter((voice) => isEnglish(voice) && !isNovelty(voice));
  if (!english.length) return null;

  // Prefer en-US over other English variants, then anything English.
  return english.find((voice) => /^en-US$/i.test(voice.lang || "")) || english[0];
}

// A cue read at normal speed sounds hurried and clinical. The meditation
// session already used these numbers; every spoken line now matches it.
export const SPOKEN_RATE = 0.88;
export const SPOKEN_PITCH = 0.92;

/**
 * Build an utterance that is already voiced and paced.
 * Kept here so no page has to remember the rate, the pitch, and the pick.
 *
 * @param {string} text
 * @param {object} deps { synth, Utterance } injected so this is testable
 * @returns {object|null} the utterance, or null if speech is unavailable
 */
export function buildUtterance(text, { synth, Utterance } = {}) {
  if (!synth || !Utterance) return null;
  const utterance = new Utterance(text);
  utterance.rate = SPOKEN_RATE;
  utterance.pitch = SPOKEN_PITCH;
  const voice = pickSpokenVoice(synth.getVoices ? synth.getVoices() : []);
  if (voice) {
    utterance.voice = voice;
    // Safari reads lang off the utterance rather than the voice.
    if (voice.lang) utterance.lang = voice.lang;
  }
  return utterance;
}
