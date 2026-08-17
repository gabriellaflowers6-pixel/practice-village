// The wake phrase is enforced HERE, in the app, not by asking Gemini nicely in
// a system instruction. While the gate is shut, the learner's microphone audio
// is never sent, so an unaddressed request cannot be answered: the tutor never
// receives it. That is the difference between a rule and a request.
//
// A short pre-roll buffer is kept while the gate is shut so that opening it
// does not clip the words already spoken. Browser recognizers report a phrase
// partway through the sentence, so without the pre-roll the tutor would hear
// "...next pose?" with the wake phrase and the start of the request missing.

export const WAKE_HOLD_MS = 9000;
export const PREROLL_MS = 1500;

// How many resampled 16k samples cover the pre-roll window.
export function prerollSamples(sampleRate = 16000, ms = PREROLL_MS) {
  const rate = Number(sampleRate) > 0 ? Number(sampleRate) : 16000;
  const window = Number(ms) > 0 ? Number(ms) : 0;
  return Math.ceil((rate * window) / 1000);
}

export function createWakeGate({ holdMs = WAKE_HOLD_MS } = {}) {
  let openUntil = 0;
  return {
    open(now) { openUntil = now + holdMs; },
    // Keep an already-open gate alive while the exchange continues. This never
    // opens a shut gate, so it cannot be used to bypass the wake phrase.
    extend(now) { if (now < openUntil) openUntil = now + holdMs; },
    close() { openUntil = 0; },
    isOpen(now) { return now < openUntil; },
    // requireWake off is the learner deliberately choosing an open microphone.
    shouldSend(now, requireWake) { return requireWake ? now < openUntil : true; },
  };
}

// Fixed-capacity ring of recent audio. Oldest samples fall off the front, so
// memory stays bounded however long the learner goes without addressing Moxie.
export function createPreRoll(capacity) {
  const max = Math.max(0, Math.floor(Number(capacity) || 0));
  let chunks = [];
  let held = 0;
  return {
    push(samples) {
      if (!max || !samples?.length) return;
      chunks.push(samples);
      held += samples.length;
      while (held > max && chunks.length) {
        const dropped = chunks.shift();
        held -= dropped.length;
      }
    },
    size() { return held; },
    clear() { chunks = []; held = 0; },
    drain() {
      if (!held) return new Float32Array(0);
      const out = new Float32Array(held);
      let at = 0;
      for (const chunk of chunks) { out.set(chunk, at); at += chunk.length; }
      chunks = []; held = 0;
      return out;
    },
  };
}
