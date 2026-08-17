// Browser-only Gemini Live adapter. It is deliberately created only after the
// learner confirms consent. The long-lived key never enters this module.
import { LIVE_SAMPLE_RATE, MIC_CONSTRAINTS, acceptsLiveTool, float32ToPcm16, liveSetup, resampleTo16k, shouldSendFrame } from "./live-coach-lib.mjs";
import { createPreRoll, createWakeGate, prerollSamples } from "./wake-gate-lib.mjs";
import { studioPath } from "./studio-base.mjs";

const WS_BASE = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=";

function bytesToBase64(bytes) {
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
  return btoa(out);
}
function base64ToBytes(value) {
  const raw = atob(value); const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}
function pcmRate(mimeType) {
  const m = /rate=(\d+)/.exec(String(mimeType || ""));
  return m ? Number(m[1]) : 24000;
}

export class LiveCoach {
  // micStream is a microphone the page already opened, so the room does not ask
  // for the device a second time. listening is the learner's answer to "can she
  // hear me": false means the microphone is never opened at all, rather than
  // opened and ignored.
  constructor({ video, instruction, voice, requireWake = false, micStream = null, listening = true, onStatus, onTranscript, onTool, onState }) {
    this.video = video; this.instruction = instruction; this.voice = voice || "";
    this.micStream = micStream || null;
    // The wake phrase is enforced here, at the socket, not in the prompt.
    this.requireWake = Boolean(requireWake);
    this.gate = createWakeGate();
    this.preRoll = createPreRoll(0);
    this.onStatus = onStatus || (() => {});
    this.onState = onState || (() => {});
    this.onTranscript = onTranscript || (() => {}); this.onTool = onTool || (() => ({}));
    this.socket = null; this.stream = null; this.audioContext = null; this.processor = null;
    this.lastFrameAt = null; this.nextAudioAt = 0; this.closed = false; this.playing = new Set();
    this.setupResolve = null; this.setupReject = null;
    this.setupTimer = null;
    this.connectAbort = null;
    this.listeningEnabled = listening !== false; this.voiceEnabled = true;
  }
  send(message) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(message));
  }
  async connect({ capture = true } = {}) {
    // Create and resume audio directly from the learner's click. Creating it
    // only after token and WebSocket awaits leaves Safari playback suspended.
    this.closed = false;
    this.connectAbort = new AbortController();
    this.audioContext = new AudioContext();
    await this.audioContext.resume();
    this.onState("connecting");
    this.onStatus("Requesting a private Live Coach session…");
    const tokenResponse = await fetch(studioPath("live-token"), { cache: "no-store", signal: this.connectAbort.signal });
    const tokenData = await tokenResponse.json();
    if (this.closed) throw new DOMException("Live Coach start was cancelled.", "AbortError");
    if (!tokenResponse.ok || !tokenData.ok || !tokenData.token) throw new Error(tokenData.error || "Live Coach is unavailable right now.");
    await new Promise((resolve, reject) => {
      this.setupResolve = resolve; this.setupReject = reject;
      const socket = this.socket = new WebSocket(WS_BASE + encodeURIComponent(tokenData.token));
      this.setupTimer = window.setTimeout(() => reject(new Error("Live Coach connection timed out. Try again.")), 12000);
      socket.onopen = () => this.send(liveSetup(this.instruction, this.voice));
      socket.onerror = () => reject(new Error("Live Coach could not connect."));
      socket.onclose = () => { this.setupReject?.(new Error("Live Coach disconnected.")); if (!this.closed) { this.onState("disconnected"); this.onStatus("Live Coach disconnected."); } };
      socket.onmessage = (event) => this.receive(event);
    });
    if (capture) {
      // Only open the microphone for a learner who asked to be heard. It used to
      // open for everyone and be muted in software, which left the browser
      // recording indicator on for someone who had switched listening off.
      if (this.listeningEnabled) await this.startMic();
      this.frameTimer = window.setInterval(() => this.sendFrame(), 1000);
      this.onState(this.listeningEnabled ? "listening" : "muted");
      this.onStatus("Microphone live · Camera snapshot every 5 seconds");
    } else {
      this.listeningEnabled = false;
      this.onState("speaking");
      this.onStatus("Playing voice preview…");
    }
  }
  async startMic() {
    if (this.processor) return;
    // The room opened the microphone as the learner arrived, so use that one.
    // Asking again reopens the device and blinks the recording indicator.
    const stream = this.micStream || await navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS);
    this.micStream = null;
    if (this.closed) { stream.getTracks().forEach((track) => track.stop()); throw new DOMException("Live Coach start was cancelled.", "AbortError"); }
    this.stream = stream;
    if (!this.audioContext) this.audioContext = new AudioContext();
    await this.audioContext.resume();
    const source = this.audioContext.createMediaStreamSource(this.stream);
    this.processor = this.audioContext.createScriptProcessor(2048, 1, 1);
    this.preRoll = createPreRoll(prerollSamples(LIVE_SAMPLE_RATE));
    this.processor.onaudioprocess = (event) => {
      if (!this.listeningEnabled) return;
      const input = event.inputBuffer.getChannelData(0);
      const samples = resampleTo16k(input, this.audioContext.sampleRate, LIVE_SAMPLE_RATE);
      // Gate shut: the audio is held locally and never reaches Google. It is
      // kept only so opening the gate does not clip what was already said.
      if (!this.gate.shouldSend(Date.now(), this.requireWake)) { this.preRoll.push(samples); return; }
      const pending = this.preRoll.drain();
      if (pending.length) this.sendAudio(pending);
      this.sendAudio(samples);
    };
    source.connect(this.processor); this.processor.connect(this.audioContext.destination);
  }
  async sendFrame() {
    const now = Date.now();
    if (!this.video?.videoWidth || !shouldSendFrame(this.lastFrameAt, now)) return;
    const canvas = document.createElement("canvas");
    const width = Math.min(320, this.video.videoWidth); const height = Math.round(width * this.video.videoHeight / this.video.videoWidth);
    canvas.width = width; canvas.height = Math.max(1, height);
    canvas.getContext("2d").drawImage(this.video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", .55);
    const data = dataUrl.slice(dataUrl.indexOf(",") + 1);
    this.send({ realtimeInput: { video: { data, mimeType: "image/jpeg" } } });
    this.lastFrameAt = now;
  }
  async receive(event) {
    // Gemini currently delivers browser WebSocket messages as binary Blob
    // frames. Accept text too so both Chrome/Safari implementations work.
    let raw = event.data;
    if (raw instanceof Blob) raw = await raw.text();
    else if (raw instanceof ArrayBuffer) raw = new TextDecoder().decode(raw);
    let message; try { message = JSON.parse(raw); } catch { return; }
    if (message.setupComplete) { if (this.setupTimer) clearTimeout(this.setupTimer); this.setupTimer = null; this.setupResolve?.(); this.setupResolve = null; this.setupReject = null; }
    const content = message.serverContent;
    if (content?.inputTranscription?.text) this.onTranscript("You: " + content.inputTranscription.text);
    if (content?.outputTranscription?.text) this.onTranscript("Coach: " + content.outputTranscription.text);
    if (content?.interrupted) this.stopPlayback();
    // A reply keeps an already-open exchange alive so the learner can follow up
    // without re-addressing the tutor. It cannot reopen a gate that has shut.
    if (content?.modelTurn) this.gate.extend(Date.now());
    for (const part of content?.modelTurn?.parts || []) if (part.inlineData?.data) this.playPcm(part.inlineData.data, part.inlineData.mimeType);
    if (message.toolCall?.functionCalls) this.handleTools(message.toolCall.functionCalls);
  }
  prompt(text) {
    if (!String(text || "").trim()) return;
    this.send({ clientContent: { turns: [{ role: "user", parts: [{ text: String(text).trim() }] }], turnComplete: true } });
  }
  sendAudio(samples) {
    const pcm = float32ToPcm16(samples);
    this.send({ realtimeInput: { audio: { data: bytesToBase64(new Uint8Array(pcm.buffer)), mimeType: "audio/pcm;rate=16000" } } });
  }
  // Called by the page when its local recognizer hears the wake phrase. This is
  // the ONLY way microphone audio starts flowing while the phrase is required.
  openGate() { this.gate.open(Date.now()); }
  closeGate() { this.gate.close(); this.preRoll.clear(); }
  isGateOpen() { return this.gate.shouldSend(Date.now(), this.requireWake); }
  setRequireWake(required) {
    this.requireWake = Boolean(required);
    // Turning the requirement back on must take effect at once, including
    // mid-session, rather than waiting for an already-open window to lapse.
    if (this.requireWake) this.closeGate();
  }
  setListening(enabled) {
    this.listeningEnabled = Boolean(enabled);
    if (!this.listeningEnabled) this.closeGate();
    // Turned on mid-session, the microphone has never been opened, so open it
    // now. Without this she is deaf for the rest of the practice.
    else if (!this.processor && this.socket) this.startMic().catch(() => this.onStatus("Your microphone could not be opened."));
    this.onState(this.listeningEnabled && this.voiceEnabled ? "listening" : "muted");
  }
  setVoiceEnabled(enabled) {
    this.voiceEnabled = Boolean(enabled);
    if (!this.voiceEnabled) { this.stopPlayback(); this.onState("muted"); }
    else this.onState(this.listeningEnabled ? "listening" : "muted");
  }
  handleTools(calls) {
    const functionResponses = calls.map((call) => {
      let result;
      try { result = acceptsLiveTool(call.name) ? this.onTool(call.name, call.args || {}) : { ok: false, error: "That action is unavailable." }; }
      catch { result = { ok: false, error: "That action could not be completed." }; }
      return { id: call.id, name: call.name, response: { result } };
    });
    this.send({ toolResponse: { functionResponses } });
  }
  playPcm(base64, mimeType) {
    if (!this.audioContext || !this.voiceEnabled) return;
    this.onState("speaking");
    const bytes = base64ToBytes(base64); const pcm = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
    const buffer = this.audioContext.createBuffer(1, pcm.length, pcmRate(mimeType));
    const channel = buffer.getChannelData(0); for (let i = 0; i < pcm.length; i++) channel[i] = pcm[i] / 0x8000;
    const source = this.audioContext.createBufferSource(); source.buffer = buffer; source.connect(this.audioContext.destination);
    source.onended = () => { this.playing.delete(source); if (!this.playing.size) this.onState(this.listeningEnabled ? "listening" : "muted"); }; this.playing.add(source);
    const at = Math.max(this.audioContext.currentTime, this.nextAudioAt); source.start(at); this.nextAudioAt = at + buffer.duration;
  }
  stopPlayback() {
    for (const source of this.playing) { try { source.stop(); } catch {} }
    this.playing.clear(); this.nextAudioAt = this.audioContext?.currentTime || 0;
  }
  close() {
    this.closed = true; this.connectAbort?.abort(); this.connectAbort = null; if (this.frameTimer) clearInterval(this.frameTimer);
    this.frameTimer = null;
    if (this.setupTimer) clearTimeout(this.setupTimer); this.setupTimer = null; this.setupResolve = null; this.setupReject = null;
    if (this.processor) { this.processor.disconnect(); this.processor = null; }
    if (this.stream) { this.stream.getTracks().forEach((track) => track.stop()); this.stream = null; }
    // A microphone handed over but never consumed is still an open device.
    if (this.micStream) { this.micStream.getTracks().forEach((track) => track.stop()); this.micStream = null; }
    if (this.socket) { this.socket.close(); this.socket = null; }
    this.closeGate();
    this.stopPlayback();
    if (this.audioContext) { this.audioContext.close(); this.audioContext = null; }
  }
}
