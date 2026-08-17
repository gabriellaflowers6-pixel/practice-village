// Thin adapter over LiveKit. Pages import THIS, never LivekitClient directly,
// so the engine's home (local dev / cloud / own server) is serve.py env only.
// Requires <script src="vendor/livekit-client.umd.min.js"> before import.

export const TOKEN_ENDPOINT = "/lk-token";

// Lightweight teacher-passphrase check: ask for a token on a throwaway room
// and report whether the passphrase was accepted, WITHOUT connecting. Lets
// the sign-in screen reject a wrong passphrase up front instead of dragging
// the teacher through the whole preview and bouncing at "Start teaching".
export async function verifyTeacherPass(pass) {
  const qs = new URLSearchParams({ room: "ZEN-CHK", identity: "check",
                                   name: "check", role: "teacher", pass });
  try {
    const r = await (await fetch(TOKEN_ENDPOINT + "?" + qs)).json();
    return { ok: !!r.ok, error: r.error || "" };
  } catch (e) {
    return { ok: false, error: "could not reach the server" };
  }
}

export async function joinClass({ room, name, role, pass, devices }) {
  const identity = name.replace(/[^\w -]/g, "").slice(0, 24) + "-" +
    Math.random().toString(36).slice(2, 6);
  const qs = new URLSearchParams({ room, identity, name, role });
  if (pass) qs.set("pass", pass);
  const r = await (await fetch(TOKEN_ENDPOINT + "?" + qs)).json();
  if (!r.ok) throw new Error(r.error);
  const lk = window.LivekitClient;
  const rm = new lk.Room({ adaptiveStream: true, autoSubscribe: role === "teacher" });
  await rm.connect(r.url, r.token);
  // Apply persisted device choices from the pre-join preview, if any. Not
  // fatal if a saved device disappeared or the browser refuses the switch.
  if (devices) {
    for (const kind of ["videoinput", "audioinput", "audiooutput"]) {
      const deviceId = devices[kind];
      if (!deviceId) continue;
      try { await rm.switchActiveDevice(kind, deviceId); }
      catch (e) { /* keep the room's default device */ }
    }
  }
  if (role !== "teacher") {
    // Students must never receive another student's video: with autoSubscribe
    // off, subscribe only to publications from the participant whose
    // metadata marks them the teacher (set in the token by lk-token).
    const subscribeIfTeacher = (pub, part) => { if (part.metadata === "teacher") pub.setSubscribed(true); };
    rm.on(lk.RoomEvent.TrackPublished, subscribeIfTeacher);
    // Publications that existed BEFORE this page joined fired their
    // TrackPublished event during connect(), before any page code could
    // listen. Replay them, or a student joining a class in progress never
    // subscribes to the teacher (same lesson as the onTrack replay below).
    for (const p of rm.remoteParticipants.values())
      for (const pub of p.trackPublications.values())
        subscribeIfTeacher(pub, p);
  }
  const enc = new TextEncoder(), dec = new TextDecoder();
  return {
    identity: rm.localParticipant.identity,
    async publishCameraMic() {
      await rm.localParticipant.setCameraEnabled(true);
      await rm.localParticipant.setMicrophoneEnabled(true);
    },
    publishVideoTrack(mediaStreamTrack) {
      return rm.localParticipant.publishTrack(mediaStreamTrack, { source: lk.Track.Source.Camera });
    },
    setMic(on) { return rm.localParticipant.setMicrophoneEnabled(on); },
    setCamera(on) { return rm.localParticipant.setCameraEnabled(on); },
    unpublishVideo() {
      const pub = rm.localParticipant.getTrackPublication(lk.Track.Source.Camera);
      if (pub && pub.track) return rm.localParticipant.unpublishTrack(pub.track);
    },
    setDevice(kind, deviceId) { return rm.switchActiveDevice(kind, deviceId); },
    attachLocalVideo(el) {
      const pub = [...rm.localParticipant.videoTrackPublications.values()][0];
      if (pub && pub.track) pub.track.attach(el);
    },
    onTrack(fn) {
      rm.on(lk.RoomEvent.TrackSubscribed, (track, pub, part) =>
        fn(track, track.kind, part.identity, part.name));
      // Tracks published BEFORE this page joined were subscribed during
      // connect(), so their TrackSubscribed events fired before any page
      // code could listen. Replay them, or a student joining a class in
      // progress never sees the teacher (found live 2026-07-14).
      for (const p of rm.remoteParticipants.values())
        for (const pub of p.trackPublications.values())
          if (pub.track) fn(pub.track, pub.track.kind, p.identity, p.name);
    },
    onTrackGone(fn) {
      rm.on(lk.RoomEvent.TrackUnsubscribed, (track, pub, part) =>
        fn(part.identity, track.kind));
    },
    // reliable=false suits the pulse (lossy, resent every 2s); chat passes
    // true so a message is never silently dropped.
    sendData(obj, reliable = false) {
      rm.localParticipant.publishData(enc.encode(JSON.stringify(obj)),
        { reliable: !!reliable });
    },
    onData(fn) {
      rm.on(lk.RoomEvent.DataReceived, (payload, part) => {
        try { fn(JSON.parse(dec.decode(payload)),
                 part && part.identity, part && part.name,
                 part && part.metadata); } catch (e) {}
      });
    },
    onJoin(fn) { rm.on(lk.RoomEvent.ParticipantConnected, p => fn(p.identity, p.name, p.metadata)); },
    onLeave(fn) { rm.on(lk.RoomEvent.ParticipantDisconnected, p => fn(p.identity)); },
    // Current remote participants; the student waiting room uses metadata to
    // spot a camera-off teacher who publishes no tracks.
    peers() { return [...rm.remoteParticipants.values()].map(p => ({ identity: p.identity, name: p.name, metadata: p.metadata })); },
    onReconnect(down, up) {
      rm.on(lk.RoomEvent.Reconnecting, down);
      rm.on(lk.RoomEvent.Reconnected, up);
    },
    onEnd(fn) { rm.on(lk.RoomEvent.Disconnected, fn); },
    disconnect() { return rm.disconnect(); },
  };
}
