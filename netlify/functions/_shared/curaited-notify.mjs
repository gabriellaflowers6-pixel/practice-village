// Drop-in for the Practice Village repo: netlify/functions/_shared/curaited-notify.mjs
//
// Tells Cur.AI.ted about a membership change so the member's included
// Cur.AI.ted access follows their Village membership automatically.
//
// Fire-and-forget by design: a Cur.AI.ted hiccup must never break a Village
// membership grant. Failures are logged and the membership flow continues.
//
// Env needed on the Practice Village site:
//   CURAITED_WEBHOOK_SECRET  same value as Cur.AI.ted's PRACTICE_VILLAGE_WEBHOOK_SECRET
//   CURAITED_WEBHOOK_URL     optional, defaults to the production endpoint

const defaultEndpoint = "https://curaited.org/api/webhooks/practice-village";

async function signatureHeader(secret, rawBody, timestamp = Math.floor(Date.now() / 1000)) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${rawBody}`),
  );
  const hex = Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `t=${timestamp},v1=${hex}`;
}

/**
 * @param {object} input
 * @param {string} input.stripeEventId  the Stripe event id being processed; reused so
 *                                      Cur.AI.ted inherits this webhook's idempotency
 * @param {"membership.activated"|"membership.updated"|"membership.cancelled"|"membership.expired"} input.eventType
 * @param {string} input.email          the member's email
 * @param {string} input.memberId       a stable member identifier (the Stripe subscription id works)
 * @param {string} [input.membershipStatus]  Stripe subscription status, e.g. "active"
 * @param {string|null} [input.accessEndsAt] ISO timestamp access runs to (currentPeriodEnd)
 */
export async function notifyCuraited(input) {
  const secret = Netlify.env.get("CURAITED_WEBHOOK_SECRET");
  if (!secret) {
    console.warn("curaited-notify: CURAITED_WEBHOOK_SECRET is not set, skipping");
    return { skipped: true };
  }

  const body = JSON.stringify({
    eventId: `pv_${input.stripeEventId}`,
    eventType: input.eventType,
    memberId: input.memberId,
    email: input.email,
    membershipStatus: input.membershipStatus,
    occurredAt: new Date().toISOString(),
    ...(input.accessEndsAt ? { accessEndsAt: input.accessEndsAt } : {}),
  });

  try {
    const response = await fetch(Netlify.env.get("CURAITED_WEBHOOK_URL") || defaultEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Curaited-Signature": await signatureHeader(secret, body),
      },
      body,
    });
    if (!response.ok) {
      console.error("curaited-notify: rejected", { status: response.status, eventType: input.eventType });
      return { ok: false, status: response.status };
    }
    return { ok: true };
  } catch (error) {
    console.error("curaited-notify: unreachable", {
      reason: error instanceof Error ? error.message : "unknown",
      eventType: input.eventType,
    });
    return { ok: false };
  }
}
