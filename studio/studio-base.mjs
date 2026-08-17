// Where the studio's own endpoints live, worked out from where the page itself
// was served. The studio runs at the root of moxiestudio.netlify.app and under
// a folder inside Practice Village, so a hardcoded "/coach" is wrong in one of
// those places, and claiming a route at the root of a site somebody else owns
// is how you break their app. Same files, both homes, no squatting.
export function apiBase(pathname) {
  const path = typeof pathname === "string" ? pathname : "";
  return path.replace(/\/[^/]*$/, "");
}

export function apiPath(name, pathname) {
  const endpoint = String(name || "").replace(/^\/+/, "");
  return `${apiBase(pathname)}/${endpoint}`;
}

// The browser call sites read the live location; tests pass one in.
export const studioPath = (name) => apiPath(name, typeof location === "undefined" ? "" : location.pathname);
