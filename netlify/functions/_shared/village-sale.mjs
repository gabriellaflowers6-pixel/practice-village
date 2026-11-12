// Is this Stripe sale a Practice Village membership?
//
// The Village shares one Stripe account with Cur.AI.ted and other products, and
// this webhook hears every sale on it. Only a Village sale may create, change,
// cancel or refund a Village membership. Everything else is ignored untouched.
//
// A sale is a Village sale when:
//   1. it came through one of the Village payment links, or
//   2. it carries a price that sits on one of those payment links, or
//   3. it carries a price listed in VILLAGE_STRIPE_PRICE_IDS (comma separated),
//      for Village prices sold some other way.
//
// Anything else answers null. When Stripe cannot be asked, this throws, so the
// webhook fails and Stripe sends the event again. It never guesses.

import { PLAN_BY_PAYMENT_LINK, stripeId } from "./membership.mjs";

const YEARLY_PLAN = { plan: "founding_villager", role: "founding_villager", label: "Founding Villager" };
const MONTHLY_PLAN = { plan: "membership", role: "member", label: "Membership" };

let cachedLinkPrices = null;

export function resetVillagePriceCache() {
  cachedLinkPrices = null;
}

export function extraVillagePriceIds(raw = process.env.VILLAGE_STRIPE_PRICE_IDS) {
  return String(raw || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

// price id -> plan, read from the Village payment links themselves so the
// payment link table stays the one place a Village product is named.
export async function villagePricesFromLinks(stripe, planByLink = PLAN_BY_PAYMENT_LINK) {
  if (planByLink === PLAN_BY_PAYMENT_LINK && cachedLinkPrices) return cachedLinkPrices;
  const prices = new Map();
  for (const [linkId, plan] of Object.entries(planByLink)) {
    const items = await stripe.paymentLinks.listLineItems(linkId, { limit: 100 });
    for (const item of items.data || []) {
      const priceId = stripeId(item.price);
      if (priceId) prices.set(priceId, plan);
    }
  }
  if (planByLink === PLAN_BY_PAYMENT_LINK) cachedLinkPrices = prices;
  return prices;
}

function planByInterval(interval) {
  return interval === "year" ? YEARLY_PLAN : MONTHLY_PLAN;
}

function priceEntries(items) {
  return (items || [])
    .map((item) => ({ id: stripeId(item.price), interval: item.price?.recurring?.interval || null }))
    .filter((entry) => entry.id);
}

async function matchPrices(stripe, entries, options) {
  if (!entries.length) return null;
  const extras = extraVillagePriceIds(options.extraPriceIds);
  const extraHit = entries.find((entry) => extras.includes(entry.id));
  if (extraHit) return { ...planByInterval(extraHit.interval), resolvedBy: "price_env" };
  const linkPrices = await villagePricesFromLinks(stripe, options.planByLink);
  const linkHit = entries.find((entry) => linkPrices.has(entry.id));
  if (linkHit) return { ...linkPrices.get(linkHit.id), resolvedBy: "price" };
  return null;
}

// Returns the Village plan for a subscription, or null when it is not ours.
export async function villagePlanForSubscription(stripe, subscription, options = {}) {
  if (!subscription) return null;
  return matchPrices(stripe, priceEntries(subscription.items?.data), options);
}

// Returns the Village plan for a completed checkout, or null when it is not ours.
export async function villagePlanForCheckout(stripe, session, subscription, options = {}) {
  const planByLink = options.planByLink || PLAN_BY_PAYMENT_LINK;
  const known = planByLink[stripeId(session.payment_link)];
  if (known) return { ...known, resolvedBy: "payment_link" };
  if (subscription) return villagePlanForSubscription(stripe, subscription, options);
  // No payment link we know and no subscription: look at what was bought.
  const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
  return matchPrices(stripe, priceEntries(items.data), options);
}

export function notVillageSale(priceIds = []) {
  return {
    ignored: true,
    reason: "not a Practice Village sale",
    prices: priceIds,
  };
}

export function subscriptionPriceIds(subscription) {
  return priceEntries(subscription?.items?.data).map((entry) => entry.id);
}
