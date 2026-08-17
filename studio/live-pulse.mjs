// Pure logic for the live-class pulse. No DOM, no LiveKit: node-testable.

// Short speakable class code; alphabet drops lookalikes (I/L/O/0/1).
export function makeClassCode(rand = Math.random) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 3; i++) s += chars[Math.floor(rand() * chars.length)];
  return "ZEN-" + s;
}

// reports: Map(identity -> {name, pose, flag, conf, watching, hand, at}).
// A report older than staleMs is "away": stays on the roster, drops out of
// the counts. Watching-only students are present but never vote on the pose;
// they CAN raise a hand, and hands counts every non-stale raised hand.
export function aggregate(reports, now, staleMs = 8000) {
  const roster = [], poseVotes = {}, flagVotes = {};
  let present = 0, hands = 0;
  for (const [id, r] of reports) {
    const stale = now - r.at > staleMs;
    roster.push({ id, name: r.name, stale, watching: !!r.watching,
                  pose: r.pose || null, flag: r.flag || null, hand: !!r.hand });
    if (stale) continue;
    present++;
    if (r.hand) hands++;
    if (r.watching) continue;
    if (r.pose) poseVotes[r.pose] = (poseVotes[r.pose] || 0) + 1;
    if (r.flag) flagVotes[r.flag] = (flagVotes[r.flag] || 0) + 1;
  }
  const top = o => Object.entries(o).sort((a, b) => b[1] - a[1])[0] || null;
  const cp = top(poseVotes), tf = top(flagVotes);
  roster.sort((a, b) => a.name.localeCompare(b.name));
  return { count: present, hands,
           classPose: cp ? cp[0] : null, inPose: cp ? cp[1] : 0,
           topFlag: tf ? tf[0] : null, flagCount: tf ? tf[1] : 0, roster };
}
