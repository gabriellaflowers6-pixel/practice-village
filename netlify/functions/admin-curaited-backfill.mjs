import { getUser } from "@netlify/identity";
import { membershipStore, isActiveStripeStatus } from "./_shared/membership.mjs";
import { notifyCuraited } from "./_shared/curaited-notify.mjs";

// Why this exists: notifyCuraited is fire-and-forget with no retry, so every
// membership event sent while curaited.org lacked the endpoint was lost. This
// replays membership.activated for every active member, once, on demand.
// Cur.AI.ted deduplicates by eventId, so running it twice is safe.

export default async function handler(request) {
  const user = await getUser();
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  if (!user?.email || !roles.includes("admin")) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (request.method !== "POST") {
    return Response.json({ ok: false, error: "Method not allowed" }, { status: 405 });
  }

  let body;
  try { body = await request.json(); } catch { body = {}; }
  const dryRun = body.dryRun !== false; // default to reporting, never sending by accident

  const store = membershipStore();
  const { blobs } = await store.list({ prefix: "member/" });

  const summary = { scanned: 0, active: 0, skipped: 0, sent: 0, failed: 0, dryRun };
  const detail = [];

  for (const blob of blobs) {
    summary.scanned += 1;
    const record = await store.get(blob.key, { type: "json" });
    if (!record?.email || !record.stripeSubscriptionId) {
      summary.skipped += 1;
      continue;
    }
    if (!isActiveStripeStatus(record.status)) {
      summary.skipped += 1;
      continue;
    }
    summary.active += 1;
    if (dryRun) {
      detail.push({ plan: record.plan, status: record.status });
      continue;
    }
    // Stable per member so a repeat run is deduplicated on the Cur.AI.ted side
    const result = await notifyCuraited({
      stripeEventId: `backfill_${record.stripeSubscriptionId}`,
      eventType: "membership.activated",
      email: record.email,
      memberId: record.stripeSubscriptionId,
      membershipStatus: record.status,
      accessEndsAt: record.currentPeriodEnd,
    });
    if (result?.ok) summary.sent += 1;
    else summary.failed += 1;
  }

  return Response.json({ ok: true, summary, ...(dryRun ? { wouldSend: detail } : {}) });
}

export const config = { path: "/admin-curaited-backfill" };
