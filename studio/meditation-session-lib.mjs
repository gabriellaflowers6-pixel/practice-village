export const MEDITATION_SESSIONS = Object.freeze({
  arrival: { title: "Return to yourself", intro: "Nothing to solve. Let this be a small arrival.", cues: ["Feel where the chair or floor is holding you.", "Let your gaze rest or close your eyes if that feels comfortable.", "Notice one sound without needing to name it.", "Let your hands be easy.", "Take in the room again, slowly."] },
  release: { title: "Release the day", intro: "Set down only what you are ready to set down.", cues: ["Notice the weight you brought into this moment.", "Soften one place that does not need to work right now.", "Let each exhale have its own length.", "You do not have to make the mind empty.", "Return with a little more room around the day."] },
  sleep: { title: "Before sleep", intro: "A low-light body scan for a gentler landing.", cues: ["Let the muscles around your eyes be quiet.", "Feel your jaw become less busy.", "Let your shoulders spread into their support.", "Notice your legs becoming heavy.", "Nothing else is required of you right now."] },
  reset: { title: "Between meetings", intro: "A short reset without leaving your chair.", cues: ["Let both feet meet the floor.", "Look away from the nearest screen.", "Unclench your hands.", "Choose one thing to carry into the next moment."] },
  attention: { title: "Open your attention", intro: "Practice returning without scolding yourself for leaving.", cues: ["Choose one sound, sensation, or point in the room.", "When attention wanders, notice that too.", "Return gently to the point you chose.", "Let the field of attention widen.", "Keep the steadiness, not the strain."] },
  afterflow: { title: "After your flow", intro: "Let the body absorb what it just practiced.", cues: ["Feel the movement still echoing in the body.", "Notice warmth without needing to hold onto it.", "Let effort drain toward the floor.", "Make room for stillness beside sensation.", "Carry the quiet forward when you rise."] },
});

export function meditationSession(id) { return MEDITATION_SESSIONS[id] || MEDITATION_SESSIONS.arrival; }
export function meditationCue(session, elapsed, duration) {
  const cues = session?.cues?.length ? session.cues : MEDITATION_SESSIONS.arrival.cues;
  const ratio = duration > 0 ? Math.min(0.999, Math.max(0, elapsed / duration)) : 0;
  return cues[Math.min(cues.length - 1, Math.floor(ratio * cues.length))];
}
