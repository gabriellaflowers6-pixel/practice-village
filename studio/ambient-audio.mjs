export const AMBIENT_PRESETS = Object.freeze([
  { id: "quiet", label: "Quiet", detail: "No background sound" },
  { id: "ember", label: "Warm ember", detail: "A low, steady tonal bed" },
  { id: "rain", label: "Soft rain", detail: "A filtered, even hush" },
  { id: "bowl", label: "Distant bowl", detail: "A spacious, gentle tone" },
]);

export function cleanAmbientPreset(value) {
  return AMBIENT_PRESETS.some((item) => item.id === value) ? value : "quiet";
}

export function ambientLabel(value) {
  return AMBIENT_PRESETS.find((item) => item.id === cleanAmbientPreset(value))?.label || "Quiet";
}

export function createAmbientPlayer(AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext) {
  let context = null, gain = null, sources = [], volume = 0.35, preset = "quiet";
  const clear = () => {
    for (const source of sources) { try { source.stop(); } catch {} try { source.disconnect(); } catch {} }
    sources = [];
    if (gain) { try { gain.disconnect(); } catch {} gain = null; }
  };
  const makeTone = (frequency, level, type = "sine") => {
    const oscillator = context.createOscillator();
    const toneGain = context.createGain();
    oscillator.type = type; oscillator.frequency.value = frequency; toneGain.gain.value = level;
    oscillator.connect(toneGain).connect(gain); oscillator.start(); sources.push(oscillator);
  };
  const makeRain = () => {
    const length = context.sampleRate * 2, buffer = context.createBuffer(1, length, context.sampleRate), data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const noise = context.createBufferSource(), filter = context.createBiquadFilter();
    noise.buffer = buffer; noise.loop = true; filter.type = "lowpass"; filter.frequency.value = 1450;
    noise.connect(filter).connect(gain); noise.start(); sources.push(noise);
  };
  return {
    get preset() { return preset; },
    get playing() { return Boolean(context && sources.length); },
    setVolume(value) { volume = Math.min(1, Math.max(0, Number(value) || 0)); if (gain) gain.gain.setTargetAtTime(volume, context.currentTime, 0.08); },
    async play(value) {
      preset = cleanAmbientPreset(value); clear();
      if (preset === "quiet" || !AudioContextClass) return false;
      context ||= new AudioContextClass(); await context.resume(); gain = context.createGain(); gain.gain.value = volume; gain.connect(context.destination);
      if (preset === "rain") makeRain();
      else if (preset === "bowl") { makeTone(196, 0.13); makeTone(293.66, 0.035); }
      else { makeTone(110, 0.08); makeTone(164.81, 0.025); }
      return true;
    },
    stop() { clear(); },
  };
}
