// Village session adapter.
//
// Moxie Studios used to carry its own Supabase account: a magic link, its own
// profiles table, its own membership row. Inside Practice Village none of that
// applies. She signed in once at the front door and this room is part of what
// she already pays for, so asking her to sign in again would be asking her to
// prove something the Village already knows.
//
// This module keeps the shape the studio pages import (authClient, signOut,
// currentAccount, accountRoute, sendLink) and answers from the Village session.
// Practice data stays on her device. The no-op query builder exists so the
// pages that expect a database client fall back to local storage instead of
// throwing.

let sessionPromise;

async function villageSession() {
  if (!sessionPromise) {
    sessionPromise = fetch("/studio-session", { cache: "no-store", credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null);
  }
  return sessionPromise;
}

function noopQuery() {
  const result = Promise.resolve({ data: null, error: null });
  const builder = new Proxy(function () {}, {
    get(_target, prop) {
      if (prop === "then") return result.then.bind(result);
      if (prop === "catch") return result.catch.bind(result);
      if (prop === "finally") return result.finally.bind(result);
      return () => builder;
    },
    apply() {
      return builder;
    },
  });
  return builder;
}

// A Supabase-shaped stand-in. auth.getUser answers with the Villager; every
// table call resolves empty so local-first code paths take over.
export async function authClient() {
  const session = await villageSession();
  const user = session?.ok
    ? { id: session.id, email: session.email, user_metadata: { full_name: session.name || "" } }
    : null;
  return {
    auth: {
      getUser: async () => ({ data: { user }, error: null }),
      getSession: async () => ({ data: { session: user ? { user } : null }, error: null }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
    from: () => noopQuery(),
    rpc: () => noopQuery(),
    channel: () => ({ on: () => ({ subscribe: () => ({ unsubscribe() {} }) }), subscribe: () => ({ unsubscribe() {} }) }),
  };
}

export async function currentAccount() {
  const session = await villageSession();
  if (!session?.ok) return null;
  return {
    user: { id: session.id, email: session.email },
    profile: { full_name: session.name || "", role: "student", teacher_status: null },
    membership: { plan_key: "practice_village", status: "active" },
  };
}

// Sign-out belongs to the Village, not to a room inside it.
export async function signOut() {
  try {
    await fetch("/.netlify/identity/logout", { method: "POST", credentials: "same-origin" });
  } catch {
    // The redirect below still takes her somewhere honest.
  }
  document.cookie = "nf_jwt=; Max-Age=0; path=/";
  window.location.href = "/login";
}

// Nothing to send: there is no separate studio account to create.
export async function sendLink() {
  throw new Error("Practice Village signs you in. There is no separate studio account.");
}

export function accountRoute() {
  return "/account";
}
