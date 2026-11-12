// Run with: npm test
//
// Nothing here talks to Stripe, Netlify or email. Stripe and the member store
// are stand-ins that record every call, so the tests can prove what the webhook
// did not do.

import test from "node:test";
import assert from "node:assert/strict";

delete process.env.RESEND_API_KEY;
delete process.env.VILLAGE_STRIPE_PRICE_IDS;
globalThis.Netlify = { env: { get: () => undefined } };

const { handleCheckoutCompleted, handleSubscriptionCreated } = await import(
  "../functions/stripe-membership-webhook.mjs"
);
const { memberKeyForEmail, PLAN_BY_PAYMENT_LINK } = await import("../functions/_shared/membership.mjs");
const { villagePlanForCheckout, villagePlanForSubscription, resetVillagePriceCache } = await import(
  "../functions/_shared/village-sale.mjs"
);

const [FOUNDING_LINK, MONTHLY_LINK] = Object.keys(PLAN_BY_PAYMENT_LINK);
const VILLAGE_YEARLY_PRICE = "price_village_yearly";
const VILLAGE_MONTHLY_PRICE = "price_village_monthly";
const CURAITED_PRICE = "price_curaited_full";
const MEMBER_EMAIL = "member@example.test";

function fakeStripe({ subscriptions = {}, customers = {}, sessionItems = {}, charges = [], failLinks = false } = {}) {
  const calls = [];
  const note = (name, value) => {
    calls.push(name);
    return value;
  };
  return {
    calls,
    paymentLinks: {
      listLineItems: async (linkId) => {
        note("paymentLinks.listLineItems");
        if (failLinks) throw new Error("Stripe is unreachable");
        const price = linkId === FOUNDING_LINK ? VILLAGE_YEARLY_PRICE : VILLAGE_MONTHLY_PRICE;
        return { data: [{ price: { id: price } }] };
      },
    },
    checkout: {
      sessions: {
        listLineItems: async (sessionId) => note("checkout.sessions.listLineItems", { data: sessionItems[sessionId] || [] }),
      },
    },
    subscriptions: {
      retrieve: async (id) => note("subscriptions.retrieve", subscriptions[id]),
      cancel: async () => note("subscriptions.cancel", {}),
      list: async () => note("subscriptions.list", { data: [] }),
    },
    customers: { retrieve: async (id) => note("customers.retrieve", customers[id]) },
    charges: { list: async () => note("charges.list", { data: charges }) },
    refunds: { create: async () => note("refunds.create", { amount: 1500 }) },
    paymentMethods: {
      list: async () => note("paymentMethods.list", { data: [] }),
      detach: async () => note("paymentMethods.detach", {}),
    },
  };
}

function fakeStore(initial = {}) {
  const data = new Map(Object.entries(initial));
  const writes = [];
  return {
    data,
    writes,
    get: async (key) => (data.has(key) ? structuredClone(data.get(key)) : null),
    getMetadata: async (key) => (data.has(key) ? {} : null),
    set: async (key, value) => {
      writes.push(key);
      data.set(key, value);
    },
    setJSON: async (key, value) => {
      writes.push(key);
      data.set(key, structuredClone(value));
    },
    list: async ({ prefix }) => ({ blobs: [...data.keys()].filter((key) => key.startsWith(prefix)).map((key) => ({ key })) }),
  };
}

function subscription(id, priceId, interval = "month", extra = {}) {
  return {
    id,
    status: "active",
    customer: "cus_test",
    created: 1_800_000_000,
    cancel_at_period_end: false,
    items: { data: [{ price: { id: priceId, recurring: { interval } }, current_period_end: 1_802_600_000 }] },
    ...extra,
  };
}

async function storeWithLiveMember() {
  const key = await memberKeyForEmail(MEMBER_EMAIL);
  const record = {
    email: MEMBER_EMAIL,
    plan: "membership",
    role: "member",
    planLabel: "Membership",
    status: "active",
    stripeCustomerId: "cus_test",
    stripeSubscriptionId: "sub_village_existing",
  };
  return { key, record, store: fakeStore({ [key]: record, "subscription/sub_village_existing": key }) };
}

const event = { id: "evt_test", created: 1_800_000_000, type: "checkout.session.completed" };

test.beforeEach(() => resetVillagePriceCache());

// --- Case 1: only a Village sale grants a Village membership ---------------

test("a Cur.AI.ted checkout does not create a Village membership", async () => {
  const stripe = fakeStripe({ subscriptions: { sub_cur: subscription("sub_cur", CURAITED_PRICE) } });
  const store = fakeStore();
  const session = {
    id: "cs_cur",
    payment_link: null,
    subscription: "sub_cur",
    customer: "cus_new",
    customer_details: { email: "buyer@example.test" },
    created: 1_800_000_000,
  };
  const result = await handleCheckoutCompleted(stripe, store, session, event);
  assert.equal(result.ignored, true);
  assert.equal(result.reason, "not a Practice Village sale");
  assert.deepEqual(store.writes, [], "nothing may be written to the member store");
});

test("a subscription on another product's price does not create a Village membership", async () => {
  const stripe = fakeStripe({ customers: { cus_new: { email: "buyer@example.test" } } });
  const store = fakeStore();
  const result = await handleSubscriptionCreated(stripe, store, subscription("sub_cur", CURAITED_PRICE, "year"), event);
  assert.equal(result.ignored, true);
  assert.deepEqual(store.writes, []);
  assert.ok(!stripe.calls.includes("customers.retrieve"), "the buyer is not even looked up");
});

test("a one-time sale of another product does not create a Village membership", async () => {
  const stripe = fakeStripe({ sessionItems: { cs_once: [{ price: { id: "price_workshop_ticket" } }] } });
  const store = fakeStore();
  const session = {
    id: "cs_once",
    payment_link: "plink_some_other_product",
    subscription: null,
    amount_subtotal: 14900,
    customer_details: { email: "buyer@example.test" },
    created: 1_800_000_000,
  };
  const result = await handleCheckoutCompleted(stripe, store, session, event);
  assert.equal(result.ignored, true);
  assert.deepEqual(store.writes, []);
});

test("a checkout through a Village payment link is a Village sale", async () => {
  const stripe = fakeStripe();
  const yearly = await villagePlanForCheckout(stripe, { id: "cs_1", payment_link: FOUNDING_LINK }, null);
  assert.equal(yearly.plan, "founding_villager");
  assert.equal(yearly.resolvedBy, "payment_link");
  const monthly = await villagePlanForCheckout(stripe, { id: "cs_2", payment_link: MONTHLY_LINK }, null);
  assert.equal(monthly.plan, "membership");
});

test("a subscription on a Village price is a Village sale, on any other price it is not", async () => {
  const stripe = fakeStripe();
  const yearly = await villagePlanForSubscription(stripe, subscription("sub_y", VILLAGE_YEARLY_PRICE, "year"));
  assert.equal(yearly.plan, "founding_villager");
  assert.equal(yearly.resolvedBy, "price");
  const monthly = await villagePlanForSubscription(stripe, subscription("sub_m", VILLAGE_MONTHLY_PRICE));
  assert.equal(monthly.plan, "membership");
  assert.equal(await villagePlanForSubscription(stripe, subscription("sub_c", CURAITED_PRICE)), null);
});

test("a price named in VILLAGE_STRIPE_PRICE_IDS is a Village sale", async () => {
  const stripe = fakeStripe();
  const plan = await villagePlanForSubscription(stripe, subscription("sub_x", "price_village_new", "year"), {
    extraPriceIds: "price_other, price_village_new",
  });
  assert.equal(plan.plan, "founding_villager");
  assert.equal(plan.resolvedBy, "price_env");
});

test("when Stripe cannot be asked, the webhook fails instead of guessing", async () => {
  const stripe = fakeStripe({ failLinks: true });
  await assert.rejects(() => villagePlanForSubscription(stripe, subscription("sub_c", CURAITED_PRICE)));
});

// --- Case 2: another product's purchase never touches a Village membership --

test("a Village member buying Cur.AI.ted Full is not cancelled or refunded (checkout event)", async () => {
  const { key, record, store } = await storeWithLiveMember();
  const stripe = fakeStripe({
    subscriptions: { sub_cur: subscription("sub_cur", CURAITED_PRICE) },
    charges: [{ id: "ch_cur", paid: true, refunded: false, created: 1_800_000_000 }],
  });
  const session = {
    id: "cs_cur",
    payment_link: null,
    subscription: "sub_cur",
    customer: "cus_test",
    customer_details: { email: MEMBER_EMAIL },
    created: 1_800_000_000,
  };
  const result = await handleCheckoutCompleted(stripe, store, session, event);
  assert.equal(result.ignored, true);
  assert.equal(result.reason, "not a Practice Village sale");
  assert.ok(!stripe.calls.includes("subscriptions.cancel"), "no subscription may be cancelled");
  assert.ok(!stripe.calls.includes("refunds.create"), "no charge may be refunded");
  assert.deepEqual(store.writes, []);
  assert.deepEqual(store.data.get(key), record, "her Village membership is unchanged");
});

test("a Village member buying Cur.AI.ted Full is not cancelled or refunded (subscription event)", async () => {
  const { key, record, store } = await storeWithLiveMember();
  const stripe = fakeStripe({
    customers: { cus_test: { email: MEMBER_EMAIL } },
    charges: [{ id: "ch_cur", paid: true, refunded: false, created: 1_800_000_000 }],
  });
  const result = await handleSubscriptionCreated(stripe, store, subscription("sub_cur", CURAITED_PRICE), event);
  assert.equal(result.ignored, true);
  assert.ok(!stripe.calls.includes("subscriptions.cancel"));
  assert.ok(!stripe.calls.includes("refunds.create"));
  assert.deepEqual(store.writes, []);
  assert.deepEqual(store.data.get(key), record);
});

test("a second Village checkout on a live membership is still undone", async () => {
  const { key, record, store } = await storeWithLiveMember();
  const stripe = fakeStripe({
    subscriptions: { sub_village_second: subscription("sub_village_second", VILLAGE_MONTHLY_PRICE) },
    charges: [{ id: "ch_dup", paid: true, refunded: false, created: 1_800_000_000 }],
  });
  const session = {
    id: "cs_dup",
    payment_link: MONTHLY_LINK,
    subscription: "sub_village_second",
    customer: "cus_test",
    customer_details: { email: MEMBER_EMAIL },
    created: 1_800_000_000,
  };
  const result = await handleCheckoutCompleted(stripe, store, session, event);
  assert.equal(result.reason, "duplicate membership for this email");
  assert.ok(stripe.calls.includes("subscriptions.cancel"), "the duplicate Village subscription is cancelled");
  assert.ok(stripe.calls.includes("refunds.create"), "and its charge is refunded");
  assert.deepEqual(store.data.get(key), record, "the first membership is kept as it was");
});
