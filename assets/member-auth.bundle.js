var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// node_modules/gotrue-js/lib/index.js
var HTTPError = class extends Error {
  constructor(response) {
    super(response.statusText);
    this.name = "HTTPError";
    this.status = response.status;
  }
};
var TextHTTPError = class extends HTTPError {
  constructor(response, data) {
    super(response);
    this.name = "TextHTTPError";
    this.data = data;
  }
};
var JSONHTTPError = class extends HTTPError {
  constructor(response, json) {
    super(response);
    this.name = "JSONHTTPError";
    this.json = json;
  }
};
var API = class _API {
  constructor(apiURL, options) {
    this.apiURL = apiURL || "";
    this._sameOrigin = /^\/(?!\/)/.test(this.apiURL);
    this.defaultHeaders = options?.defaultHeaders || {};
  }
  headers(headers = {}) {
    return {
      ...this.defaultHeaders,
      "Content-Type": "application/json",
      ...headers
    };
  }
  static async parseJsonResponse(response) {
    const json = await response.json();
    if (!response.ok) {
      throw new JSONHTTPError(response, json);
    }
    return json;
  }
  async request(path, options = {}) {
    const headers = this.headers(options.headers || {});
    if (!options.body) {
      delete headers["Content-Type"];
    }
    const fetchOptions = {
      ...options,
      headers
    };
    if (this._sameOrigin) {
      fetchOptions.credentials = options.credentials || "same-origin";
    }
    const response = await fetch(this.apiURL + path, fetchOptions);
    const contentType = response.headers.get("Content-Type");
    if (contentType?.includes("json")) {
      return _API.parseJsonResponse(response);
    }
    const data = await response.text();
    if (!response.ok) {
      throw new TextHTTPError(response, data);
    }
    return data;
  }
};
var Admin = class {
  constructor(user) {
    this.user = user;
  }
  listUsers(aud) {
    return this.user._request("/admin/users", {
      method: "GET",
      audience: aud
    });
  }
  getUser(user) {
    return this.user._request(`/admin/users/${user.id}`);
  }
  updateUser(user, attributes = {}) {
    return this.user._request(`/admin/users/${user.id}`, {
      method: "PUT",
      body: JSON.stringify(attributes)
    });
  }
  createUser(email, password, attributes = {}) {
    attributes.email = email;
    attributes.password = password;
    return this.user._request("/admin/users", {
      method: "POST",
      body: JSON.stringify(attributes)
    });
  }
  deleteUser(user) {
    return this.user._request(`/admin/users/${user.id}`, {
      method: "DELETE"
    });
  }
};
var ExpiryMargin = 60 * 1e3;
var storageKey = "gotrue.user";
var refreshPromises = {};
var currentUser = null;
var forbiddenUpdateAttributes = { api: 1, token: 1, audience: 1, url: 1 };
var forbiddenSaveAttributes = { api: 1 };
var isBrowser = () => typeof window !== "undefined";
var storageListenerActive = false;
function ensureStorageListener() {
  if (!storageListenerActive && isBrowser()) {
    storageListenerActive = true;
    window.addEventListener("storage", (event) => {
      if (event.key === storageKey) {
        currentUser = null;
      }
    });
  }
}
var User = class _User {
  constructor(api, tokenResponse, audience) {
    this.token = null;
    this.api = api;
    this.url = api.apiURL;
    this.audience = audience;
    this._processTokenResponse(tokenResponse);
    currentUser = this;
    ensureStorageListener();
  }
  static removeSavedSession() {
    isBrowser() && localStorage.removeItem(storageKey);
  }
  static recoverSession(apiInstance) {
    ensureStorageListener();
    if (currentUser) {
      return currentUser;
    }
    const json = isBrowser() && localStorage.getItem(storageKey);
    if (json) {
      try {
        const data = JSON.parse(json);
        const { url, token, audience } = data;
        if (!url || !token) {
          return null;
        }
        const api = apiInstance || new API(url, {});
        return new _User(api, token, audience)._saveUserData(data, true);
      } catch (error) {
        console.error(new Error(`Gotrue-js: Error recovering session: ${error}`));
        return null;
      }
    }
    return null;
  }
  get admin() {
    return new Admin(this);
  }
  async update(attributes) {
    const response = await this._request("/user", {
      method: "PUT",
      body: JSON.stringify(attributes)
    });
    return this._saveUserData(response)._refreshSavedSession();
  }
  jwt(forceRefresh) {
    const token = this.tokenDetails();
    if (token === null || token === void 0) {
      return Promise.reject(new Error(`Gotrue-js: failed getting jwt access token`));
    }
    const { expires_at, refresh_token, access_token } = token;
    if (forceRefresh || expires_at - ExpiryMargin < Date.now()) {
      return this._refreshToken(refresh_token);
    }
    return Promise.resolve(access_token);
  }
  logout() {
    return this._request("/logout", { method: "POST" }).then(this.clearSession.bind(this)).catch(this.clearSession.bind(this));
  }
  _refreshToken(refresh_token) {
    const existingPromise = refreshPromises[refresh_token];
    if (existingPromise) {
      return existingPromise;
    }
    const refreshRequest = this.api.request("/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=refresh_token&refresh_token=${refresh_token}`
    });
    const timeoutPromise = new Promise((_resolve, reject) => {
      setTimeout(() => reject(new Error("Token refresh timeout")), 3e4);
    });
    const promise = Promise.race([refreshRequest, timeoutPromise]).then((response) => {
      delete refreshPromises[refresh_token];
      this._processTokenResponse(response);
      this._refreshSavedSession();
      if (!this.token) {
        throw new Error("Gotrue-js: Token not set after refresh");
      }
      return this.token.access_token;
    }).catch((error) => {
      delete refreshPromises[refresh_token];
      this.clearSession();
      throw error;
    });
    refreshPromises[refresh_token] = promise;
    return promise;
  }
  async _request(path, options = {}) {
    options.headers = options.headers || {};
    const aud = options.audience || this.audience;
    if (aud) {
      options.headers["X-JWT-AUD"] = aud;
    }
    try {
      const token = await this.jwt();
      return await this.api.request(path, {
        headers: Object.assign(options.headers, {
          Authorization: `Bearer ${token}`
        }),
        ...options
      });
    } catch (error) {
      if (error instanceof JSONHTTPError && error.json) {
        if (error.json.msg) {
          error.message = error.json.msg;
        } else if (error.json.error) {
          error.message = `${error.json.error}: ${error.json.error_description}`;
        }
      }
      throw error;
    }
  }
  async getUserData() {
    const response = await this._request("/user");
    return this._saveUserData(response)._refreshSavedSession();
  }
  _saveUserData(attributes, fromStorage) {
    for (const key in attributes) {
      if (key in _User.prototype || key in forbiddenUpdateAttributes) {
        continue;
      }
      this[key] = attributes[key];
    }
    if (fromStorage) {
      this._fromStorage = true;
    }
    return this;
  }
  _processTokenResponse(tokenResponse) {
    this.token = tokenResponse;
    try {
      const claims = JSON.parse(urlBase64Decode(tokenResponse.access_token.split(".")[1]));
      this.token.expires_at = claims.exp * 1e3;
    } catch (error) {
      console.error(new Error(`Gotrue-js: Failed to parse tokenResponse claims: ${error}`));
    }
  }
  _refreshSavedSession() {
    if (isBrowser() && localStorage.getItem(storageKey)) {
      this._saveSession();
    }
    return this;
  }
  get _details() {
    const userCopy = {};
    for (const key in this) {
      if (key in _User.prototype || key in forbiddenSaveAttributes) {
        continue;
      }
      userCopy[key] = this[key];
    }
    return userCopy;
  }
  _saveSession() {
    isBrowser() && localStorage.setItem(storageKey, JSON.stringify(this._details));
    return this;
  }
  tokenDetails() {
    return this.token;
  }
  clearSession() {
    _User.removeSavedSession();
    this.token = null;
    currentUser = null;
  }
};
function base64Decode(base64) {
  if (typeof atob === "function") {
    return atob(base64);
  }
  return Buffer.from(base64, "base64").toString("binary");
}
function urlBase64Decode(str) {
  let output = str.replace(/-/g, "+").replace(/_/g, "/");
  switch (output.length % 4) {
    case 0:
      break;
    case 2:
      output += "==";
      break;
    case 3:
      output += "=";
      break;
    default:
      throw new Error("Illegal base64url string!");
  }
  const binaryString = base64Decode(output);
  try {
    const bytes = Uint8Array.from(binaryString, (char) => char.codePointAt(0) ?? 0);
    return new TextDecoder().decode(bytes);
  } catch {
    return binaryString;
  }
}
var HTTPRegexp = /^http:\/\//;
var defaultApiURL = `/.netlify/identity`;
var GoTrue = class {
  constructor({
    APIUrl = defaultApiURL,
    audience = "",
    setCookie = false,
    clientName = "gotrue-js"
  } = {}) {
    if (HTTPRegexp.test(APIUrl)) {
      console.warn(
        "Warning:\n\nDO NOT USE HTTP IN PRODUCTION FOR GOTRUE EVER!\nGoTrue REQUIRES HTTPS to work securely."
      );
    }
    if (audience) {
      this.audience = audience;
    }
    this.setCookie = setCookie;
    this.api = new API(APIUrl, { defaultHeaders: { "X-Nf-Client": clientName } });
  }
  async _request(path, options = {}) {
    options.headers = options.headers || {};
    const aud = options.audience || this.audience;
    if (aud) {
      options.headers["X-JWT-AUD"] = aud;
    }
    try {
      return await this.api.request(path, options);
    } catch (error) {
      if (error instanceof JSONHTTPError && error.json) {
        if (error.json.msg) {
          error.message = error.json.msg;
        } else if (error.json.error) {
          error.message = `${error.json.error}: ${error.json.error_description}`;
        }
      }
      throw error;
    }
  }
  settings() {
    return this._request("/settings");
  }
  signup(email, password, data) {
    return this._request("/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, data })
    });
  }
  login(email, password, remember) {
    this._setRememberHeaders(remember);
    return this._request("/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=password&username=${encodeURIComponent(
        email
      )}&password=${encodeURIComponent(password)}`
    }).then((response) => {
      User.removeSavedSession();
      return this.createUser(response, remember);
    });
  }
  loginExternalUrl(provider) {
    return `${this.api.apiURL}/authorize?provider=${provider}`;
  }
  confirm(token, remember) {
    this._setRememberHeaders(remember);
    return this.verify("signup", token, remember);
  }
  requestPasswordRecovery(email) {
    return this._request("/recover", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  }
  recover(token, remember) {
    this._setRememberHeaders(remember);
    return this.verify("recovery", token, remember);
  }
  acceptInvite(token, password, remember) {
    this._setRememberHeaders(remember);
    return this._request("/verify", {
      method: "POST",
      body: JSON.stringify({ token, password, type: "signup" })
    }).then((response) => this.createUser(response, remember));
  }
  acceptInviteExternalUrl(provider, token) {
    return `${this.api.apiURL}/authorize?provider=${provider}&invite_token=${token}`;
  }
  createUser(tokenResponse, remember = false) {
    this._setRememberHeaders(remember);
    const user = new User(this.api, tokenResponse, this.audience || "");
    return user.getUserData().then((userData) => {
      if (remember) {
        userData._saveSession();
      }
      return userData;
    });
  }
  currentUser() {
    const user = User.recoverSession(this.api);
    user && this._setRememberHeaders(user._fromStorage);
    return user;
  }
  async validateCurrentSession() {
    const user = this.currentUser();
    if (!user) {
      return null;
    }
    try {
      return await user.getUserData();
    } catch {
      user.clearSession();
      return null;
    }
  }
  verify(type, token, remember) {
    this._setRememberHeaders(remember);
    return this._request("/verify", {
      method: "POST",
      body: JSON.stringify({ token, type })
    }).then((response) => this.createUser(response, remember));
  }
  _setRememberHeaders(remember) {
    if (this.setCookie) {
      this.api.defaultHeaders = this.api.defaultHeaders || {};
      this.api.defaultHeaders["X-Use-Cookie"] = remember ? "1" : "session";
    }
  }
};
if (typeof window !== "undefined") {
  window.GoTrue = GoTrue;
}

// node_modules/@netlify/identity/dist/main.js
var __require2 = /* @__PURE__ */ ((x) => typeof __require !== "undefined" ? __require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof __require !== "undefined" ? __require : a)[b]
}) : x)(function(x) {
  if (typeof __require !== "undefined") return __require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var AUTH_PROVIDERS = ["google", "github", "gitlab", "bitbucket", "facebook", "email"];
var AuthError = class _AuthError extends Error {
  constructor(message, status, options) {
    super(message);
    this.name = "AuthError";
    this.status = status;
    if (options && "cause" in options) {
      this.cause = options.cause;
    }
  }
  static from(error) {
    if (error instanceof _AuthError) return error;
    const message = error instanceof Error ? error.message : String(error);
    return new _AuthError(message, void 0, { cause: error });
  }
};
var MissingIdentityError = class extends Error {
  constructor(message = "Netlify Identity is not available.") {
    super(message);
    this.name = "MissingIdentityError";
  }
};
var IDENTITY_PATH = "/.netlify/identity";
var goTrueClient = null;
var cachedApiUrl;
var warnedMissingUrl = false;
var isBrowser2 = () => typeof window !== "undefined" && typeof window.location !== "undefined";
var discoverApiUrl = () => {
  if (cachedApiUrl !== void 0) return cachedApiUrl;
  if (isBrowser2()) {
    cachedApiUrl = `${window.location.origin}${IDENTITY_PATH}`;
  } else {
    const identityContext = getIdentityContext();
    if (identityContext?.url) {
      cachedApiUrl = identityContext.url;
    } else if (globalThis.Netlify?.context?.url) {
      cachedApiUrl = new URL(IDENTITY_PATH, globalThis.Netlify.context.url).href;
    } else if (typeof process !== "undefined" && process.env?.URL) {
      cachedApiUrl = new URL(IDENTITY_PATH, process.env.URL).href;
    }
  }
  return cachedApiUrl ?? null;
};
var getGoTrueClient = () => {
  if (goTrueClient) return goTrueClient;
  const apiUrl = discoverApiUrl();
  if (!apiUrl) {
    if (!warnedMissingUrl) {
      console.warn(
        "@netlify/identity: Could not determine the Identity endpoint URL. Make sure your site has Netlify Identity enabled, or run your app with `netlify dev`."
      );
      warnedMissingUrl = true;
    }
    return null;
  }
  goTrueClient = new GoTrue({ APIUrl: apiUrl, setCookie: false });
  return goTrueClient;
};
var getClient = () => {
  const client = getGoTrueClient();
  if (!client) throw new MissingIdentityError();
  return client;
};
var getIdentityContext = () => {
  const identityContext = globalThis.netlifyIdentityContext;
  if (identityContext?.url) {
    return {
      url: identityContext.url,
      token: identityContext.token
    };
  }
  if (globalThis.Netlify?.context?.url) {
    return { url: new URL(IDENTITY_PATH, globalThis.Netlify.context.url).href };
  }
  const siteUrl = typeof process !== "undefined" ? process.env?.URL : void 0;
  if (siteUrl) {
    return { url: new URL(IDENTITY_PATH, siteUrl).href };
  }
  return null;
};
var NF_JWT_COOKIE = "nf_jwt";
var NF_REFRESH_COOKIE = "nf_refresh";
var getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const match = new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`).exec(document.cookie);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
};
var setAuthCookies = (cookies, accessToken, refreshToken) => {
  cookies.set({
    name: NF_JWT_COOKIE,
    value: accessToken,
    httpOnly: false,
    secure: true,
    path: "/",
    sameSite: "Lax"
  });
  if (refreshToken) {
    cookies.set({
      name: NF_REFRESH_COOKIE,
      value: refreshToken,
      httpOnly: false,
      secure: true,
      path: "/",
      sameSite: "Lax"
    });
  }
};
var deleteAuthCookies = (cookies) => {
  cookies.delete(NF_JWT_COOKIE);
  cookies.delete(NF_REFRESH_COOKIE);
};
var setBrowserAuthCookies = (accessToken, refreshToken) => {
  if (typeof document === "undefined") return;
  document.cookie = `${NF_JWT_COOKIE}=${encodeURIComponent(accessToken)}; path=/; secure; samesite=lax`;
  if (refreshToken) {
    document.cookie = `${NF_REFRESH_COOKIE}=${encodeURIComponent(refreshToken)}; path=/; secure; samesite=lax`;
  }
};
var deleteBrowserAuthCookies = () => {
  if (typeof document === "undefined") return;
  document.cookie = `${NF_JWT_COOKIE}=; path=/; secure; samesite=lax; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  document.cookie = `${NF_REFRESH_COOKIE}=; path=/; secure; samesite=lax; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};
var getServerCookie = (name) => {
  const cookies = globalThis.Netlify?.context?.cookies;
  if (!cookies || typeof cookies.get !== "function") return null;
  return cookies.get(name) ?? null;
};
var nextHeadersFn;
var triggerNextjsDynamic = () => {
  if (nextHeadersFn === null) return;
  if (nextHeadersFn === void 0) {
    try {
      if (typeof __require2 === "undefined") {
        nextHeadersFn = null;
        return;
      }
      const mod = __require2("next/headers");
      nextHeadersFn = mod.headers;
    } catch {
      nextHeadersFn = null;
      return;
    }
  }
  const fn = nextHeadersFn;
  if (!fn) return;
  try {
    fn();
  } catch (e) {
    if (e instanceof Error && ("digest" in e || /bail\s*out.*prerende/i.test(e.message))) {
      throw e;
    }
  }
};
var DEFAULT_TIMEOUT_MS = 5e3;
var fetchWithTimeout = async (url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      const pathname = new URL(url).pathname;
      throw new AuthError(`Identity request to ${pathname} timed out after ${String(timeoutMs)}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};
var AUTH_EVENTS = {
  LOGIN: "login",
  LOGOUT: "logout",
  TOKEN_REFRESH: "token_refresh",
  USER_UPDATED: "user_updated",
  RECOVERY: "recovery"
};
var listeners = /* @__PURE__ */ new Set();
var emitAuthEvent = (event, user) => {
  for (const listener of listeners) {
    try {
      listener(event, user);
    } catch {
    }
  }
};
var REFRESH_MARGIN_S = 60;
var refreshTimer = null;
var startTokenRefresh = () => {
  if (!isBrowser2()) return;
  stopTokenRefresh();
  const client = getGoTrueClient();
  const user = client?.currentUser();
  if (!user) return;
  const token = user.tokenDetails();
  if (!token?.expires_at) return;
  const nowS = Math.floor(Date.now() / 1e3);
  const expiresAtS = typeof token.expires_at === "number" && token.expires_at > 1e12 ? Math.floor(token.expires_at / 1e3) : token.expires_at;
  const delayMs = Math.max(0, expiresAtS - nowS - REFRESH_MARGIN_S) * 1e3;
  refreshTimer = setTimeout(() => {
    void (async () => {
      try {
        const freshJwt = await user.jwt(true);
        const freshDetails = user.tokenDetails();
        setBrowserAuthCookies(freshJwt, freshDetails?.refresh_token);
        emitAuthEvent(AUTH_EVENTS.TOKEN_REFRESH, toUser(user));
        startTokenRefresh();
      } catch {
        stopTokenRefresh();
      }
    })();
  }, delayMs);
};
var stopTokenRefresh = () => {
  if (refreshTimer !== null) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
};
var getCookies = () => {
  const cookies = globalThis.Netlify?.context?.cookies;
  if (!cookies) {
    throw new AuthError("Server-side auth requires Netlify Functions runtime");
  }
  return cookies;
};
var getServerIdentityUrl = () => {
  const ctx = getIdentityContext();
  if (!ctx?.url) {
    throw new AuthError("Could not determine the Identity endpoint URL on the server");
  }
  return ctx.url;
};
var persistSession = true;
var login = async (email, password) => {
  if (!isBrowser2()) {
    const identityUrl = getServerIdentityUrl();
    const cookies = getCookies();
    const body = new URLSearchParams({
      grant_type: "password",
      username: email,
      password
    });
    let res;
    try {
      res = await fetchWithTimeout(`${identityUrl}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString()
      });
    } catch (error) {
      throw AuthError.from(error);
    }
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new AuthError(
        errorBody.msg ?? errorBody.error_description ?? `Login failed (${String(res.status)})`,
        res.status
      );
    }
    const data = await res.json();
    const accessToken = data.access_token;
    let userRes;
    try {
      userRes = await fetchWithTimeout(`${identityUrl}/user`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    } catch (error) {
      throw AuthError.from(error);
    }
    if (!userRes.ok) {
      const errorBody = await userRes.json().catch(() => ({}));
      throw new AuthError(errorBody.msg ?? `Failed to fetch user data (${String(userRes.status)})`, userRes.status);
    }
    const userData = await userRes.json();
    const user = toUser(userData);
    setAuthCookies(cookies, accessToken, data.refresh_token);
    return user;
  }
  const client = getClient();
  try {
    const gotrueUser = await client.login(email, password, persistSession);
    const jwt = await gotrueUser.jwt();
    setBrowserAuthCookies(jwt, gotrueUser.tokenDetails()?.refresh_token);
    const user = toUser(gotrueUser);
    startTokenRefresh();
    emitAuthEvent(AUTH_EVENTS.LOGIN, user);
    return user;
  } catch (error) {
    throw AuthError.from(error);
  }
};
var logout = async () => {
  if (!isBrowser2()) {
    const identityUrl = getServerIdentityUrl();
    const cookies = getCookies();
    const jwt = cookies.get(NF_JWT_COOKIE);
    if (jwt) {
      try {
        await fetchWithTimeout(`${identityUrl}/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${jwt}` }
        });
      } catch {
      }
    }
    deleteAuthCookies(cookies);
    return;
  }
  const client = getClient();
  try {
    const currentUser2 = client.currentUser();
    if (currentUser2) {
      await currentUser2.logout();
    }
    deleteBrowserAuthCookies();
    stopTokenRefresh();
    emitAuthEvent(AUTH_EVENTS.LOGOUT, null);
  } catch (error) {
    throw AuthError.from(error);
  }
};
var handleAuthCallback = async () => {
  if (!isBrowser2()) return null;
  const hash = window.location.hash.substring(1);
  if (!hash) return null;
  const client = getClient();
  const params = new URLSearchParams(hash);
  try {
    const accessToken = params.get("access_token");
    if (accessToken) return await handleOAuthCallback(client, params, accessToken);
    const confirmationToken = params.get("confirmation_token");
    if (confirmationToken) return await handleConfirmationCallback(client, confirmationToken);
    const recoveryToken = params.get("recovery_token");
    if (recoveryToken) return await handleRecoveryCallback(client, recoveryToken);
    const inviteToken = params.get("invite_token");
    if (inviteToken) return handleInviteCallback(inviteToken);
    const emailChangeToken = params.get("email_change_token");
    if (emailChangeToken) return await handleEmailChangeCallback(client, emailChangeToken);
    return null;
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw AuthError.from(error);
  }
};
var handleOAuthCallback = async (client, params, accessToken) => {
  const refreshToken = params.get("refresh_token") ?? "";
  const expiresIn = parseInt(params.get("expires_in") ?? "", 10);
  const expiresAt = parseInt(params.get("expires_at") ?? "", 10);
  const gotrueUser = await client.createUser(
    {
      access_token: accessToken,
      token_type: params.get("token_type") ?? "bearer",
      expires_in: isFinite(expiresIn) ? expiresIn : 3600,
      expires_at: isFinite(expiresAt) ? expiresAt : Math.floor(Date.now() / 1e3) + 3600,
      refresh_token: refreshToken
    },
    persistSession
  );
  setBrowserAuthCookies(accessToken, refreshToken || void 0);
  const user = toUser(gotrueUser);
  startTokenRefresh();
  clearHash();
  emitAuthEvent(AUTH_EVENTS.LOGIN, user);
  return { type: "oauth", user };
};
var handleConfirmationCallback = async (client, token) => {
  const gotrueUser = await client.confirm(token, persistSession);
  const jwt = await gotrueUser.jwt();
  setBrowserAuthCookies(jwt, gotrueUser.tokenDetails()?.refresh_token);
  const user = toUser(gotrueUser);
  startTokenRefresh();
  clearHash();
  emitAuthEvent(AUTH_EVENTS.LOGIN, user);
  return { type: "confirmation", user };
};
var handleRecoveryCallback = async (client, token) => {
  const gotrueUser = await client.recover(token, persistSession);
  const jwt = await gotrueUser.jwt();
  setBrowserAuthCookies(jwt, gotrueUser.tokenDetails()?.refresh_token);
  const user = toUser(gotrueUser);
  startTokenRefresh();
  clearHash();
  emitAuthEvent(AUTH_EVENTS.RECOVERY, user);
  return { type: "recovery", user };
};
var handleInviteCallback = (token) => {
  clearHash();
  return { type: "invite", user: null, token };
};
var handleEmailChangeCallback = async (client, emailChangeToken) => {
  const currentUser2 = client.currentUser();
  if (!currentUser2) {
    throw new AuthError("Email change verification requires an active browser session");
  }
  const jwt = await currentUser2.jwt();
  const identityUrl = `${window.location.origin}${IDENTITY_PATH}`;
  const emailChangeRes = await fetch(`${identityUrl}/user`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`
    },
    body: JSON.stringify({ email_change_token: emailChangeToken })
  });
  if (!emailChangeRes.ok) {
    const errorBody = await emailChangeRes.json().catch(() => ({}));
    throw new AuthError(
      errorBody.msg ?? `Email change verification failed (${String(emailChangeRes.status)})`,
      emailChangeRes.status
    );
  }
  const emailChangeData = await emailChangeRes.json();
  const user = toUser(emailChangeData);
  clearHash();
  emitAuthEvent(AUTH_EVENTS.USER_UPDATED, user);
  return { type: "email_change", user };
};
var clearHash = () => {
  history.replaceState(null, "", window.location.pathname + window.location.search);
};
var hydrateSession = async () => {
  if (!isBrowser2()) return null;
  const client = getClient();
  const currentUser2 = client.currentUser();
  if (currentUser2) {
    startTokenRefresh();
    return toUser(currentUser2);
  }
  const accessToken = getCookie(NF_JWT_COOKIE);
  if (!accessToken) return null;
  const refreshToken = getCookie(NF_REFRESH_COOKIE) ?? "";
  const decoded = decodeJwtPayload(accessToken);
  const expiresAt = decoded?.exp ?? Math.floor(Date.now() / 1e3) + 3600;
  const expiresIn = Math.max(0, expiresAt - Math.floor(Date.now() / 1e3));
  let gotrueUser;
  try {
    gotrueUser = await client.createUser(
      {
        access_token: accessToken,
        token_type: "bearer",
        expires_in: expiresIn,
        expires_at: expiresAt,
        refresh_token: refreshToken
      },
      persistSession
    );
  } catch {
    deleteBrowserAuthCookies();
    return null;
  }
  const user = toUser(gotrueUser);
  startTokenRefresh();
  emitAuthEvent(AUTH_EVENTS.LOGIN, user);
  return user;
};
var toAuthProvider = (value) => typeof value === "string" && AUTH_PROVIDERS.includes(value) ? value : void 0;
var toOptionalString = (value) => typeof value === "string" && value !== "" ? value : void 0;
var toRoles = (appMeta) => {
  const roles = appMeta.roles;
  if (Array.isArray(roles) && roles.every((r) => typeof r === "string")) {
    return roles;
  }
  return void 0;
};
var toUser = (userData) => {
  const userMeta = userData.user_metadata ?? {};
  const appMeta = userData.app_metadata ?? {};
  const name = userMeta.full_name ?? userMeta.name;
  const pictureUrl = userMeta.avatar_url;
  return {
    id: userData.id,
    email: userData.email,
    confirmedAt: toOptionalString(userData.confirmed_at),
    createdAt: userData.created_at,
    updatedAt: userData.updated_at,
    role: toOptionalString(userData.role),
    provider: toAuthProvider(appMeta.provider),
    name: typeof name === "string" ? name : void 0,
    pictureUrl: typeof pictureUrl === "string" ? pictureUrl : void 0,
    roles: toRoles(appMeta),
    invitedAt: toOptionalString(userData.invited_at),
    confirmationSentAt: toOptionalString(userData.confirmation_sent_at),
    recoverySentAt: toOptionalString(userData.recovery_sent_at),
    pendingEmail: toOptionalString(userData.new_email),
    emailChangeSentAt: toOptionalString(userData.email_change_sent_at),
    lastSignInAt: toOptionalString(userData.last_sign_in_at),
    userMetadata: userMeta,
    appMetadata: appMeta
  };
};
var claimsToUser = (claims) => {
  const appMeta = claims.app_metadata ?? {};
  const userMeta = claims.user_metadata ?? {};
  const name = userMeta.full_name ?? userMeta.name;
  const pictureUrl = userMeta.avatar_url;
  return {
    id: claims.sub ?? "",
    email: claims.email,
    provider: toAuthProvider(appMeta.provider),
    name: typeof name === "string" ? name : void 0,
    pictureUrl: typeof pictureUrl === "string" ? pictureUrl : void 0,
    roles: toRoles(appMeta),
    userMetadata: userMeta,
    appMetadata: appMeta
  };
};
var decodeJwtPayload = (token) => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(payload);
  } catch {
    return null;
  }
};
var fetchFullUser = async (identityUrl, jwt) => {
  try {
    const res = await fetchWithTimeout(`${identityUrl}/user`, {
      headers: { Authorization: `Bearer ${jwt}` }
    });
    if (!res.ok) return null;
    const userData = await res.json();
    return toUser(userData);
  } catch {
    return null;
  }
};
var resolveIdentityUrl = () => {
  const identityContext = getIdentityContext();
  if (identityContext?.url) return identityContext.url;
  if (globalThis.Netlify?.context?.url) {
    return new URL(IDENTITY_PATH, globalThis.Netlify.context.url).href;
  }
  const siteUrl = typeof process !== "undefined" ? process.env?.URL : void 0;
  if (siteUrl) {
    return new URL(IDENTITY_PATH, siteUrl).href;
  }
  return null;
};
var getUser = async () => {
  if (isBrowser2()) {
    const client = getGoTrueClient();
    const currentUser2 = client?.currentUser() ?? null;
    if (currentUser2) {
      const jwt2 = getCookie(NF_JWT_COOKIE);
      if (!jwt2) {
        try {
          currentUser2.clearSession();
        } catch {
        }
        return null;
      }
      startTokenRefresh();
      return toUser(currentUser2);
    }
    const jwt = getCookie(NF_JWT_COOKIE);
    if (!jwt) return null;
    const claims2 = decodeJwtPayload(jwt);
    if (!claims2) return null;
    const hydrated = await hydrateSession();
    return hydrated ?? null;
  }
  triggerNextjsDynamic();
  const identityContext = globalThis.netlifyIdentityContext;
  const serverJwt = identityContext?.token ?? getServerCookie(NF_JWT_COOKIE);
  if (serverJwt) {
    const identityUrl = resolveIdentityUrl();
    if (identityUrl) {
      const fullUser = await fetchFullUser(identityUrl, serverJwt);
      if (fullUser) return fullUser;
    }
  }
  const claims = identityContext?.user ?? null;
  return claims ? claimsToUser(claims) : null;
};
var resolveCurrentUser = async () => {
  const client = getClient();
  let currentUser2 = client.currentUser();
  if (!currentUser2 && isBrowser2()) {
    try {
      await hydrateSession();
    } catch {
    }
    currentUser2 = client.currentUser();
  }
  if (!currentUser2) throw new AuthError("No user is currently logged in");
  return currentUser2;
};
var requestPasswordRecovery = async (email) => {
  const client = getClient();
  try {
    await client.requestPasswordRecovery(email);
  } catch (error) {
    throw AuthError.from(error);
  }
};
var acceptInvite = async (token, password) => {
  const client = getClient();
  try {
    const gotrueUser = await client.acceptInvite(token, password, persistSession);
    const user = toUser(gotrueUser);
    startTokenRefresh();
    emitAuthEvent(AUTH_EVENTS.LOGIN, user);
    return user;
  } catch (error) {
    throw AuthError.from(error);
  }
};
var updateUser = async (updates) => {
  const currentUser2 = await resolveCurrentUser();
  try {
    const updatedUser = await currentUser2.update(updates);
    const user = toUser(updatedUser);
    emitAuthEvent(AUTH_EVENTS.USER_UPDATED, user);
    return user;
  } catch (error) {
    throw AuthError.from(error);
  }
};

// member-auth.js
var page = document.body.dataset.authPage;
var memberRoles = ["member", "founding_villager", "admin", "test_member"];
function rolesFor(user) {
  const roles = user?.roles;
  return Array.isArray(roles) ? roles : [];
}
function hasMemberAccess(user) {
  return rolesFor(user).some((role) => memberRoles.includes(role));
}
function messageFor(error) {
  if (error instanceof AuthError && error.status === 401) return "That email and password do not match.";
  if (error instanceof AuthError) return error.message;
  return "Something went wrong. Try again or email info@aidedeq.org.";
}
function goToMemberLobby(user) {
  window.location.href = hasMemberAccess(user) ? "/member" : "/?membership=inactive#doors";
}
async function initLogin() {
  const card = document.getElementById("authCard");
  const status = document.getElementById("authStatus");
  const loginForm = document.getElementById("loginForm");
  const inviteForm = document.getElementById("inviteForm");
  const resetForm = document.getElementById("resetForm");
  const recoveryForm = document.getElementById("recoveryForm");
  const forgotButton = document.getElementById("forgotButton");
  const inviteSuccess = document.getElementById("inviteSuccess");
  let inviteToken = null;
  try {
    const callback = await handleAuthCallback();
    if (callback?.type === "invite") {
      inviteToken = callback.token;
      card.classList.add("auth-card--invite");
      loginForm.hidden = true;
      inviteForm.hidden = false;
      resetForm.hidden = true;
      recoveryForm.hidden = true;
      forgotButton.hidden = true;
      document.querySelector(".auth-card > .auth-help").hidden = true;
      document.querySelector(".auth-card > .eyebrow").textContent = "Your invitation";
      document.getElementById("authTitle").textContent = "Come on in.";
      document.getElementById("authIntro").textContent = "Create one password and your Practice Village account is ready.";
      document.title = "Accept your invitation \xB7 Practice Village";
      document.getElementById("invitePassword").focus();
    } else if (callback?.type === "recovery") {
      loginForm.hidden = true;
      resetForm.hidden = false;
      forgotButton.hidden = true;
      document.getElementById("authTitle").textContent = "Choose a new password.";
    } else if (callback?.user) {
      goToMemberLobby(callback.user);
      return;
    } else {
      const currentUser2 = await getUser();
      if (currentUser2) goToMemberLobby(currentUser2);
    }
  } catch (error) {
    status.textContent = messageFor(error);
  }
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "Signing in\u2026";
    try {
      const user = await login(document.getElementById("loginEmail").value.trim(), document.getElementById("loginPassword").value);
      goToMemberLobby(user);
    } catch (error) {
      status.textContent = messageFor(error);
    }
  });
  inviteForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!inviteToken) return;
    const button = inviteForm.querySelector("button");
    button.disabled = true;
    button.textContent = "Creating your account\u2026";
    status.textContent = "";
    try {
      const password = document.getElementById("invitePassword").value;
      const invitedUser = await acceptInvite(inviteToken, password);
      const user = await login(invitedUser.email, password);
      inviteForm.hidden = true;
      status.hidden = true;
      document.getElementById("authTitle").hidden = true;
      document.getElementById("authIntro").hidden = true;
      document.querySelector(".auth-card > .eyebrow").hidden = true;
      inviteSuccess.hidden = false;
      inviteSuccess.focus();
      window.setTimeout(() => {
        window.location.replace(hasMemberAccess(user) ? "/welcome" : "/?membership=inactive#doors");
      }, 900);
    } catch (error) {
      button.disabled = false;
      button.textContent = "Create my account";
      status.textContent = error instanceof AuthError && [401, 404, 422].includes(error.status) ? "That invitation link has already been used or has expired. Email us and we will send a fresh one." : messageFor(error);
    }
  });
  resetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "Saving your new password\u2026";
    try {
      const user = await updateUser({ password: document.getElementById("resetPassword").value });
      goToMemberLobby(user);
    } catch (error) {
      status.textContent = messageFor(error);
    }
  });
  forgotButton.addEventListener("click", () => {
    loginForm.hidden = true;
    recoveryForm.hidden = false;
    forgotButton.hidden = true;
    document.getElementById("authTitle").textContent = "Reset your password.";
    document.getElementById("authIntro").textContent = "We will email a private reset link to your member address.";
  });
  recoveryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "Sending your reset link\u2026";
    try {
      await requestPasswordRecovery(document.getElementById("recoveryEmail").value.trim());
      status.textContent = "Check your email for a password reset link.";
    } catch (error) {
      status.textContent = messageFor(error);
    }
  });
}
function initSavedCards() {
  const wrap = document.getElementById("savedCards");
  const state = document.getElementById("savedCardsState");
  if (!wrap || !state) return;
  const PREVIEW = 5;
  let cards = [];
  let showAll = false;
  const savedOn = (iso) => {
    if (!iso) return "";
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(void 0, { month: "short", day: "numeric", year: "numeric" });
  };
  const line = (text, className) => {
    const p = document.createElement("p");
    if (className) p.className = className;
    p.textContent = text;
    return p;
  };
  function unavailable() {
    wrap.replaceChildren(line("Your Record is temporarily unavailable. Nothing has been removed."));
    state.textContent = "Temporarily unavailable";
    document.getElementById("recordActions")?.replaceChildren();
  }
  function markdownFile() {
    const now = /* @__PURE__ */ new Date();
    const longDate = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const lines = [
      "# Your Record",
      "",
      "The Personal Intelligence Layer",
      "Practice Village \xB7 thepracticevillage.org",
      `Downloaded: ${longDate}`,
      "",
      "Entries in this record were chosen and kept by the member from conversations with the Practice Village Concierge. Verify details before acting on them.",
      "",
      "---",
      ""
    ];
    for (const card of cards) {
      lines.push(`## ${card.text}`, "");
      const date = savedOn(card.savedAt);
      if (date) lines.push(`Kept: ${date}`, "");
      const detail = card.detail;
      if (detail?.kind === "search") {
        lines.push("Run this search:", "", "```", detail.query, "```", "");
        if (detail.trustNote) lines.push(detail.trustNote, "");
        if (detail.steps?.length) {
          lines.push("Steps:");
          for (const step of detail.steps) lines.push(`- [ ] ${step}`);
          lines.push("");
        }
      } else if (detail?.kind === "resources") {
        lines.push("Places to look:");
        for (const item of detail.items || []) lines.push(`- [${item.name}](${item.href})${item.detail ? ` \xB7 ${item.detail}` : ""}`);
        lines.push("");
        if (detail.sourceNote) lines.push(detail.sourceNote, "");
      }
      if (card.note) lines.push("**What happened:** " + card.note, "");
      lines.push("---", "");
    }
    return { name: `your-record-${now.toISOString().slice(0, 10)}.md`, content: lines.join("\n") };
  }
  function downloadMarkdown() {
    const file = markdownFile();
    const url = URL.createObjectURL(new Blob([file.content], { type: "text/markdown" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 4e3);
  }
  function renderActions() {
    const actions = document.getElementById("recordActions");
    if (!actions) return;
    if (!cards.length) {
      actions.replaceChildren();
      return;
    }
    const markdown = document.createElement("button");
    markdown.type = "button";
    markdown.className = "secondary-button";
    markdown.textContent = "Download as Markdown";
    markdown.addEventListener("click", downloadMarkdown);
    const pdf = document.createElement("a");
    pdf.className = "secondary-button";
    pdf.href = "/record-export";
    pdf.textContent = "Download as PDF";
    actions.replaceChildren(markdown, pdf);
  }
  async function removeCard(card, item) {
    item.replaceChildren(line(card.text, "saved-card__text"), line("Removing\u2026", "saved-card__status"));
    const failed = () => {
      fillRow(card, item);
      item.append(line("That did not remove. It is still kept.", "saved-card__status"));
    };
    try {
      const response = await fetch("/member-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove_card", text: card.text })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) return failed();
      cards = Array.isArray(payload.savedCards) ? payload.savedCards : [];
      render();
    } catch {
      failed();
    }
  }
  function confirmRow(card, item) {
    const question = line("Remove this for good?", "saved-card__status");
    const actions = document.createElement("span");
    actions.className = "saved-card__actions";
    const yes = document.createElement("button");
    yes.type = "button";
    yes.className = "text-button";
    yes.textContent = "Remove";
    yes.addEventListener("click", () => removeCard(card, item));
    const no = document.createElement("button");
    no.type = "button";
    no.className = "text-button";
    no.textContent = "Keep it";
    no.addEventListener("click", render);
    actions.append(yes, no);
    item.replaceChildren(line(card.text, "saved-card__text"), question, actions);
    yes.focus();
  }
  function detailNode(detail) {
    const box = document.createElement("div");
    box.className = "saved-card__detail";
    if (detail.kind === "search") {
      const code = document.createElement("code");
      code.textContent = detail.query;
      const query = document.createElement("p");
      query.className = "saved-card__query";
      query.append(code);
      box.append(query);
      if (detail.trustNote) box.append(line(detail.trustNote, "saved-card__note"));
      if (detail.steps?.length) {
        const steps = document.createElement("ol");
        steps.className = "saved-card__steps";
        for (const step of detail.steps) {
          const li = document.createElement("li");
          li.textContent = step;
          steps.append(li);
        }
        box.append(steps);
      }
      return box;
    }
    const list = document.createElement("ul");
    list.className = "saved-card__places";
    for (const place of detail.items || []) {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.href = place.href;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = place.name;
      li.append(link);
      if (place.detail) li.append(document.createTextNode(` \xB7 ${place.detail}`));
      list.append(li);
    }
    box.append(list);
    if (detail.sourceNote) box.append(line(detail.sourceNote, "saved-card__note"));
    return box;
  }
  function comeBackRow(card, item) {
    const question = line("When do you want this back in front of you?", "saved-card__status");
    const actions = document.createElement("span");
    actions.className = "saved-card__actions";
    const status = line("", "saved-card__status");
    const send = async (when, date) => {
      status.textContent = "Adding\u2026";
      try {
        await practiceApi({ action: "add_item", item: { title: card.text.slice(0, 160), when, ...date ? { date } : {}, href: "/record", linkLabel: "Open your Record", source: "record" } });
        status.textContent = "Added to My Practice.";
        window.setTimeout(() => fillRow(card, item), 1200);
      } catch {
        status.textContent = "That did not add. It is still kept here.";
      }
    };
    const option = (label, handler) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "text-button";
      button.textContent = label;
      button.addEventListener("click", handler);
      return button;
    };
    const dayInput = document.createElement("input");
    dayInput.type = "date";
    dayInput.className = "saved-card__day";
    dayInput.hidden = true;
    dayInput.addEventListener("change", () => {
      if (dayInput.value) send("date", dayInput.value);
    });
    const tomorrow = () => {
      const date = /* @__PURE__ */ new Date();
      date.setDate(date.getDate() + 1);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    };
    actions.append(
      option("Tomorrow", () => send("date", tomorrow())),
      option("This week", () => send("this_week")),
      option("Choose a day", () => {
        dayInput.hidden = false;
        dayInput.focus();
      }),
      option("Back", () => fillRow(card, item))
    );
    item.replaceChildren(line(card.text, "saved-card__text"), question, actions, dayInput, status);
  }
  function noteEditor(card, item) {
    const wrapNote = document.createElement("div");
    wrapNote.className = "saved-card__noteedit";
    const label = document.createElement("label");
    label.className = "saved-card__notelabel";
    label.textContent = "What happened?";
    const field = document.createElement("textarea");
    field.maxLength = 600;
    field.rows = 3;
    field.value = card.note || "";
    field.placeholder = "Called Tuesday. Waitlist until September.";
    label.append(field);
    const guard = line("Anything you want kept off our servers belongs in Safety Hall. This note travels with your membership.", "saved-card__note");
    const actions = document.createElement("span");
    actions.className = "saved-card__actions";
    const status = line("", "saved-card__status");
    const send = async (value) => {
      status.textContent = "Saving\u2026";
      try {
        const response = await fetch("/member-onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "note_card", text: card.text, note: value })
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.ok) {
          status.textContent = "That did not save. Your note is still here.";
          return;
        }
        cards = Array.isArray(payload.savedCards) ? payload.savedCards : cards;
        render();
      } catch {
        status.textContent = "That did not save. Your note is still here.";
      }
    };
    const button = (text, handler, className = "text-button") => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = className;
      b.textContent = text;
      b.addEventListener("click", handler);
      return b;
    };
    actions.append(button("Save", () => send(field.value.trim())), button("Cancel", () => fillRow(card, item)));
    if (card.note) actions.append(button("Remove note", () => send("")));
    wrapNote.append(label, guard, actions, status);
    item.replaceChildren(line(card.text, "saved-card__text"), wrapNote);
    field.focus();
  }
  function fillRow(card, item) {
    const text = line(card.text, "saved-card__text");
    const meta = document.createElement("span");
    meta.className = "saved-card__meta";
    const date = savedOn(card.savedAt);
    if (date) meta.textContent = `Kept ${date}`;
    const comeBack = document.createElement("button");
    comeBack.type = "button";
    comeBack.className = "text-button saved-card__remove";
    comeBack.textContent = "Come back to this";
    comeBack.setAttribute("aria-label", `Come back to this: ${card.text}`);
    comeBack.addEventListener("click", () => comeBackRow(card, item));
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "text-button saved-card__remove";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove: ${card.text}`);
    remove.addEventListener("click", () => confirmRow(card, item));
    const noteButton = document.createElement("button");
    noteButton.type = "button";
    noteButton.className = "text-button saved-card__remove";
    noteButton.textContent = card.note ? "Edit what happened" : "Add what happened";
    noteButton.setAttribute("aria-label", `${card.note ? "Edit" : "Add"} what happened: ${card.text}`);
    noteButton.addEventListener("click", () => noteEditor(card, item));
    meta.append(noteButton, comeBack, remove);
    const parts = [text];
    if (card.detail) parts.push(detailNode(card.detail));
    if (card.note) {
      const noteBlock = document.createElement("div");
      noteBlock.className = "saved-card__note-shown";
      noteBlock.append(line("What happened", "saved-card__notehead"), line(card.note, "saved-card__notebody"));
      parts.push(noteBlock);
    }
    parts.push(meta);
    item.replaceChildren(...parts);
  }
  function render() {
    if (!cards.length) {
      wrap.replaceChildren(line("You have not kept anything yet. At the end of a conversation at the front desk, you choose what to keep. It lands here."));
      state.textContent = "Nothing kept yet";
      renderActions();
      return;
    }
    const list = document.createElement("ul");
    list.className = "saved-card-list";
    const visible = showAll ? cards : cards.slice(0, PREVIEW);
    for (const card of visible) {
      const item = document.createElement("li");
      item.className = "saved-card";
      fillRow(card, item);
      list.append(item);
    }
    wrap.replaceChildren(list);
    if (cards.length > PREVIEW) {
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "text-button";
      toggle.textContent = showAll ? "Show the most recent five" : `Show all ${cards.length}`;
      toggle.addEventListener("click", () => {
        showAll = !showAll;
        render();
      });
      wrap.append(toggle);
    }
    wrap.append(line("Removing something here clears it from your Record. It does not change what the Concierge remembers about you.", "room-note"));
    state.textContent = cards.length === 1 ? "1 kept" : `${cards.length} kept`;
    renderActions();
  }
  return (async () => {
    try {
      const response = await fetch("/member-onboarding", { headers: { Accept: "application/json" } });
      if (!response.ok) return unavailable();
      const payload = await response.json();
      if (!payload?.ok) return unavailable();
      cards = Array.isArray(payload.savedCards) ? payload.savedCards : [];
      render();
    } catch {
      unavailable();
    }
  })();
}
var memberPractice = null;
var practiceLocalDay = (date = /* @__PURE__ */ new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
var practiceAddDays = (day, count) => {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(y, m - 1, d + count);
  return practiceLocalDay(date);
};
async function practiceApi(body) {
  const options = body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : { headers: { Accept: "application/json" } };
  const response = await fetch("/member-practice", options);
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || "My Practice is temporarily unavailable.");
  return payload;
}
function practiceIcs(item) {
  const escapeText = (t) => String(t).replace(/\\/g, "\\\\").replace(/[,;]/g, (ch) => `\\${ch}`);
  const today = practiceLocalDay().replace(/-/g, "");
  const start = item.when === "date" ? item.date.replace(/-/g, "") : today;
  const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Practice Village//My Practice//EN",
    "BEGIN:VEVENT",
    `UID:${item.id}@thepracticevillage.org`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${start}`,
    ...item.when === "daily" ? ["RRULE:FREQ=DAILY"] : [],
    `SUMMARY:${escapeText(item.title)}`,
    ...item.href && /^https?:/i.test(item.href) ? [`URL:${item.href}`] : [],
    "END:VEVENT",
    "END:VCALENDAR"
  ];
  const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `my-practice-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "item"}.ics`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4e3);
}
var VILLAGE_DATES = [
  { id: "rebuild-arc-2026", title: "Rebuild Arc begins Oct 31", date: "2026-10-31", voucherLine: true, cta: { label: "Take a look", href: "#voucher" } },
  { id: "live-classes-2027", title: "Live classes with JoYi begin February 7, 2027", date: "2027-02-07" }
];
function initMyPractice() {
  const body = document.getElementById("practiceBody");
  const villageWrap = document.getElementById("villageDates");
  const listButton = document.getElementById("practiceViewList");
  const weekButton = document.getElementById("practiceViewWeek");
  if (!body || !listButton) return null;
  let view = "list";
  let items = [];
  let voucherCovers = false;
  let failed = false;
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };
  const whenLabel = (item, today) => {
    if (item.when !== "date") return null;
    if (item.date <= today) return "Today";
    if (item.date === practiceAddDays(today, 1)) return "Tomorrow";
    const [y, m, d] = item.date.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(void 0, { month: "short", day: "numeric" });
  };
  async function act(payload) {
    try {
      const result = await practiceApi(payload);
      items = result.items;
      view = result.view;
      render();
      return result;
    } catch (error) {
      const note = el("p", "practice-note", error.message);
      body.prepend(note);
      window.setTimeout(() => note.remove(), 4e3);
      return null;
    }
  }
  function itemRow(item, today, compact = false) {
    const row = el(compact ? "span" : "li", compact ? "practice-chip" : "practice-item");
    const check = el("button", "practice-check");
    check.type = "button";
    const doneToday = item.doneOn === today;
    check.setAttribute("aria-pressed", String(doneToday));
    check.setAttribute("aria-label", doneToday ? `${item.title}: done for today` : `Mark ${item.title} done for today`);
    check.textContent = doneToday ? "\u2713" : "";
    check.addEventListener("click", () => act({ action: "toggle_done", id: item.id, today }));
    row.append(check);
    const main = el(compact ? "span" : "div", "practice-item__main");
    main.append(el("span", "practice-title", item.title));
    if (!compact && item.href && item.linkLabel) {
      const link = el("a", "practice-link", item.linkLabel);
      link.href = item.href;
      if (/^https?:/i.test(item.href)) {
        link.target = "_blank";
        link.rel = "noopener";
      }
      main.append(link);
    }
    if (!compact) {
      const label = whenLabel(item, today);
      if (label) main.append(el("span", "practice-when", label));
      if (doneToday) main.append(el("span", "practice-done", "Done for today"));
      const tools = el("span", "practice-tools");
      const calendar = el("button", "text-button", "Add to my calendar");
      calendar.type = "button";
      calendar.addEventListener("click", () => practiceIcs(item));
      const remove = el("button", "text-button", "Remove");
      remove.type = "button";
      remove.addEventListener("click", () => act({ action: "remove_item", id: item.id }));
      tools.append(calendar, document.createTextNode(" \xB7 "), remove);
      main.append(tools);
    }
    row.append(main);
    return row;
  }
  function renderList(today) {
    const groups = [
      ["Today", items.filter((i) => i.when === "daily" || i.when === "date" && i.date <= today)],
      ["Later this week", items.filter((i) => i.when === "this_week" || i.when === "date" && i.date > today && i.date <= practiceAddDays(today, 6))],
      ["Later", items.filter((i) => i.when === "date" && i.date > practiceAddDays(today, 6))]
    ];
    for (const [name, groupItems] of groups) {
      if (!groupItems.length) continue;
      body.append(el("p", "practice-group", name));
      const list = el("ul", "practice-list");
      for (const item of groupItems) list.append(itemRow(item, today));
      body.append(list);
    }
  }
  function renderWeek(today) {
    const grid = el("div", "practice-week");
    for (let offset = 0; offset < 7; offset += 1) {
      const day = practiceAddDays(today, offset);
      const [y, m, d] = day.split("-").map(Number);
      const cell = el("div", "practice-day");
      cell.append(el("p", "practice-group", offset === 0 ? "Today" : new Date(y, m - 1, d).toLocaleDateString(void 0, { weekday: "short", day: "numeric" })));
      const dayItems = items.filter((i) => i.when === "daily" || i.when === "date" && (offset === 0 ? i.date <= today : i.date === day));
      for (const item of dayItems) cell.append(offset === 0 ? itemRow(item, today, false) : el("span", "practice-chip practice-chip--plain", item.title));
      grid.append(cell);
    }
    body.append(grid);
    const sometime = items.filter((i) => i.when === "this_week");
    if (sometime.length) {
      body.append(el("p", "practice-group", "Sometime this week"));
      const list = el("ul", "practice-list");
      for (const item of sometime) list.append(itemRow(item, today));
      body.append(list);
    }
    const further = items.filter((i) => i.when === "date" && i.date > practiceAddDays(today, 6));
    if (further.length) {
      body.append(el("p", "practice-group", "Further out"));
      const list = el("ul", "practice-list");
      for (const item of further) list.append(itemRow(item, today));
      body.append(list);
    }
  }
  function render() {
    const today = practiceLocalDay();
    listButton.setAttribute("aria-pressed", String(view === "list"));
    weekButton.setAttribute("aria-pressed", String(view === "week"));
    body.replaceChildren();
    if (failed) {
      body.append(el("p", "practice-note", "My Practice is temporarily unavailable. Nothing has changed."));
      return;
    }
    if (!items.length) {
      body.append(el("p", "practice-note", "Nothing here yet."));
      body.append(el("p", "practice-note", "When there's something you want to return to, you can add it from a room, your Record, or the Concierge."));
      return;
    }
    if (view === "week") renderWeek(today);
    else renderList(today);
  }
  function renderVillage() {
    if (!villageWrap) return;
    villageWrap.replaceChildren();
    for (const event of VILLAGE_DATES) {
      const row = el("div", "village-date");
      row.append(el("b", null, event.title));
      if (event.voucherLine && voucherCovers) row.append(el("span", "room-note", "Your voucher covers this."));
      const actions = el("span", "village-date__actions");
      if (event.cta) {
        const cta = el("a", "text-button", event.cta.label);
        cta.href = event.cta.href;
        actions.append(cta);
      }
      const already = items.some((item) => item.source === "village" && item.title === event.title);
      if (already) {
        actions.append(el("span", "room-note", "Added to My Practice."));
      } else {
        const add = el("button", "text-button", "Add to My Practice");
        add.type = "button";
        add.addEventListener("click", async () => {
          const result = await act({ action: "add_item", item: { title: event.title, when: "date", date: event.date, source: "village" } });
          if (result) renderVillage();
        });
        actions.append(add);
      }
      row.append(actions);
      villageWrap.append(row);
    }
  }
  listButton.addEventListener("click", () => {
    if (view !== "list") {
      view = "list";
      render();
      act({ action: "set_view", view: "list" });
    }
  });
  weekButton.addEventListener("click", () => {
    if (view !== "week") {
      view = "week";
      render();
      act({ action: "set_view", view: "week" });
    }
  });
  (async () => {
    try {
      const result = await practiceApi();
      items = result.items;
      view = result.view;
    } catch {
      failed = true;
    }
    render();
    renderVillage();
  })();
  return {
    refresh: async () => {
      try {
        const r = await practiceApi();
        items = r.items;
        view = r.view;
        failed = false;
      } catch {
        failed = true;
      }
      render();
      renderVillage();
    },
    setVoucher: (covers) => {
      voucherCovers = Boolean(covers);
      renderVillage();
    }
  };
}
async function initMemberLobby() {
  const user = await getUser();
  if (!user || !hasMemberAccess(user)) {
    window.location.replace("/login");
    return;
  }
  const name = user.name?.trim();
  document.getElementById("memberName").textContent = name ? `, ${name.split(/\s+/)[0]}` : "";
  const roles = rolesFor(user);
  document.getElementById("memberPlan").textContent = roles.includes("founding_villager") ? "Founding Villager" : "Village Member";
  initDesk(user, { embedded: true, container: document.getElementById("deskEmbed") });
  const practice = initMyPractice();
  memberPractice = practice;
  try {
    const response = await fetch("/member-status", { headers: { Accept: "application/json" } });
    if (response.ok) {
      const payload = await response.json();
      const membership = payload.membership;
      if (membership.onboardingStatus === "not_started") {
        const offer = document.getElementById("orientationOffer");
        if (offer) {
          offer.innerHTML = `<div class="desk-invite" id="deskInvite"><p>New to the Village? There is a short, optional welcome conversation: three questions, talk or type, skip anything.</p><div class="welcome-actions"><a class="secondary-button" href="/welcome?onboarding=start">Start the welcome conversation</a><button type="button" class="text-button" id="dismissInvite">Not now</button></div></div>`;
          document.getElementById("dismissInvite").addEventListener("click", async () => {
            offer.replaceChildren();
            try {
              await fetch("/member-onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "skip" }) });
            } catch {
            }
          });
        }
      }
      if (membership.testAccount) {
        document.getElementById("voucherSummary").textContent = "Test access does not create or use workshop vouchers.";
        document.getElementById("voucherYear").textContent = "Test account";
      } else {
        const count = membership.workshopVoucherAllowance;
        practice?.setVoucher(count >= 1);
        document.getElementById("voucherSummary").textContent = count === 2 ? "You have two workshop vouchers in this membership year, including the Founding Villager exception." : "You have one workshop voucher in this membership year.";
        const start = new Date(membership.membershipYearStart).toLocaleDateString(void 0, { month: "short", day: "numeric", year: "numeric" });
        const end = new Date(membership.membershipYearEnd).toLocaleDateString(void 0, { month: "short", day: "numeric", year: "numeric" });
        document.getElementById("voucherYear").textContent = `${start} to ${end}`;
      }
    }
  } catch (error) {
    document.getElementById("voucherSummary").textContent = "Voucher details are temporarily unavailable. Your membership has not changed.";
  }
  const signOut = async () => {
    await logout();
    window.location.replace("/");
  };
  document.getElementById("logoutButton").addEventListener("click", signOut);
  document.getElementById("logoutButtonBottom").addEventListener("click", signOut);
}
function initDesk(user, opts = {}) {
  const embedded = Boolean(opts.embedded);
  const main = embedded ? opts.container : document.querySelector(".welcome-main");
  if (!main) return;
  const firstName = (user.name || "").trim().split(/\s+/)[0];
  const deskCore = `
      <div class="desk-thread" id="deskThread" aria-live="polite"></div>
      <form class="desk-ask" id="deskAsk">
        <input type="text" id="deskInput" maxlength="1000" placeholder="Say it in your own words\u2026" aria-label="Tell the Concierge what you are facing" />
        <button type="submit" class="primary-button">Ask</button>
      </form>
      ${embedded ? `<p class="onboarding-privacy">Talk or type. Keep only what you choose.</p>` : ""}
      <p class="onboarding-privacy">Live AI, powered by Gemini. The Concierge reflects, routes, and looks things up from official sources. It does not give legal or medical advice.</p>`;
  if (embedded) {
    main.innerHTML = deskCore;
  } else {
    main.innerHTML = `
    <section class="welcome-intro">
      <p class="eyebrow">The front desk</p>
      <h1>${firstName ? "Hello, " + firstName + "." : "The Concierge is in."}</h1>
      <p>Talk about what you are facing. Lookups, walkthroughs, and next steps happen here, and nothing is kept unless you choose it.</p>
    </section>
    <section class="onboarding-card desk-card" aria-label="Your Concierge">${deskCore}
      <div class="welcome-exits"><a href="/member">Back to your lobby</a><a href="/welcome?onboarding=review">Review onboarding choices</a></div>
    </section>`;
  }
  const thread = document.getElementById("deskThread");
  const form = document.getElementById("deskAsk");
  const input = document.getElementById("deskInput");
  const CHOICE_LABELS = { understand: "Help me understand what's happening", one_action: "One small action today", trusted_resource: "A trusted resource", keep_private: "Keep this private" };
  const CHOICE_SENDS = { understand: "Help me understand what is happening first.", one_action: "Give me one small action I can take today.", trusted_resource: "Point me to a trusted resource for this." };
  const SEEDS = [["Money", "I need help with money."], ["Housing", "I need help with housing."], ["Work", "I need help with work."], ["Family", "I need help with a family situation."], ["I feel stuck", "I don't know what to do."], ["My body", "Something doesn't feel right with my body."]];
  let msgs = [];
  let pending = [];
  let last = null;
  let busy = false;
  let lastRoute = null;
  let lastAdded = [];
  let lastKeptPrivate = false;
  let wrapOffered = false;
  let keptThings = [];
  const esc = (t) => {
    const d = document.createElement("div");
    d.textContent = t == null ? "" : t;
    return d.innerHTML;
  };
  const bubbles = () => msgs.map((m) => `<p class="desk-msg desk-msg--${m.role === "user" ? "me" : "c"}">${esc(m.text)}</p>`).join("");
  function renderIdle() {
    thread.innerHTML = `<p class="desk-q">What do you need help with this week?</p><div class="desk-chips">${SEEDS.map(([label, seed]) => `<button type="button" data-seed="${esc(seed)}">${esc(label)}</button>`).join("")}</div>`;
    wire();
  }
  const detailSummary = (detail) => detail.kind === "search" ? detail.steps?.length ? `the search and ${detail.steps.length} ${detail.steps.length === 1 ? "step" : "steps"}` : "the search" : `${detail.items?.length || 0} ${detail.items?.length === 1 ? "place" : "places"} to look`;
  function collectCandidates(d) {
    lastAdded = [];
    lastKeptPrivate = false;
    const add = (entry) => {
      if (!entry.text || pending.some((p) => p.text === entry.text)) return;
      pending.push(entry);
      lastAdded.push(entry.text);
    };
    if (d.card) add({ text: d.card });
    if (d.nextStep) add({ text: d.nextStep });
    if (d.searchHelp) add({ text: `Search: ${d.searchHelp.query}`, detail: { kind: "search", query: d.searchHelp.query, trustNote: d.searchHelp.trustNote, steps: d.searchHelp.steps || [] } });
    if (d.results?.items?.length) add({ text: d.results.title, detail: { kind: "resources", items: d.results.items.map((it) => ({ name: it.name, href: it.href, detail: it.detail })), sourceNote: d.results.sourceNote } });
    if (d.route) lastRoute = d.route;
  }
  function render(d) {
    let html = bubbles();
    if (d) {
      if (d.nextStep) html += `<div class="desk-block"><span class="desk-label">your clear next step</span><p class="desk-act">${esc(d.nextStep)}</p></div>`;
      if (d.results && d.results.items) {
        html += `<div class="desk-block"><span class="desk-label">${esc(d.results.title)}</span><ul class="desk-found">${d.results.items.map((it) => `<li><a href="${esc(it.href)}" target="_blank" rel="noopener">${esc(it.name)}</a> \xB7 ${esc(it.detail)}</li>`).join("")}</ul><p class="desk-note">${esc(d.results.sourceNote)}</p></div>`;
      }
      if (d.searchHelp) {
        html += `<div class="desk-block"><span class="desk-label">search this, together</span><p class="desk-query"><code>${esc(d.searchHelp.query)}</code></p><p class="desk-note">${esc(d.searchHelp.trustNote)}</p>${d.searchHelp.steps?.length ? `<ol class="desk-steps">${d.searchHelp.steps.map((st) => `<li>${esc(st)}</li>`).join("")}</ol>` : ""}</div>`;
      }
      if (d.route) html += `<p class="desk-route">when you want it: <b><a href="${esc(d.route.href)}"${String(d.route.href).startsWith("#") || String(d.route.href).startsWith("/") ? "" : ' target="_blank" rel="noopener"'}>${esc(d.route.label)}</a></b></p>`;
      if (d.quickReplies?.length) html += `<div class="desk-chips desk-chips--quick">${d.quickReplies.map((q) => `<button type="button" data-seed="${esc(q)}">${esc(q)}</button>`).join("")}</div>`;
      const menu = (d.choices || []).filter((c) => c !== "save_this");
      if (menu.length) html += `<div class="desk-chips">${menu.map((c) => `<button type="button" data-choice="${c}"${c === "keep_private" && lastKeptPrivate ? " disabled" : ""}>${c === "keep_private" && lastKeptPrivate ? "\u2713 kept private" : esc(CHOICE_LABELS[c] || c)}</button>`).join("")}</div>`;
    }
    if (pending.length) html += `<p class="desk-pending">${pending.length} ${pending.length === 1 ? "thing" : "things"} set aside for your Record \xB7 <button type="button" class="text-button" data-wrap>wrap up and review</button></p>`;
    html += `<button type="button" class="text-button desk-reset" data-reset>\u21BA start over</button>`;
    thread.innerHTML = html;
    wire();
    thread.scrollTop = thread.scrollHeight;
  }
  function renderWrap(leaving = false) {
    thread.innerHTML = `<p class="desk-q">${leaving ? "Before you go: keep any of this in your Record?" : "Keep any of this in your Record?"}</p><div class="desk-wraplist">${pending.map((c, i) => `<label class="desk-wrapitem"><input type="checkbox" checked data-i="${i}"> ${esc(c.text)}${c.detail ? `<span class="desk-wrapnote">${esc(detailSummary(c.detail))}</span>` : ""}</label>`).join("")}</div><div class="welcome-actions"><button type="button" class="primary-button" data-keep>Keep the checked ones</button><button type="button" class="secondary-button" data-discard>${leaving ? "Keep nothing and go to your lobby" : "Keep nothing"}</button></div><p class="welcome-exits"><button type="button" class="text-button" data-back>${leaving ? "Stay at the desk" : "Back to the conversation"}</button></p><p class="onboarding-privacy" id="wrapStatus" role="status"></p>`;
    thread.querySelector("[data-keep]").addEventListener("click", async () => {
      const chosen = [...thread.querySelectorAll("input[data-i]:checked")].map((cb) => pending[Number(cb.dataset.i)]);
      const wrapStatus = document.getElementById("wrapStatus");
      if (chosen.length) {
        wrapStatus.textContent = "Saving to your Record\u2026";
        try {
          const r = await fetch("/member-onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "save_cards", cards: chosen }) });
          if (!r.ok) {
            wrapStatus.textContent = "Saving did not go through. Your things are still here.";
            return;
          }
        } catch {
          wrapStatus.textContent = "Saving did not go through. Your things are still here.";
          return;
        }
      }
      keptThings = chosen;
      pending = [];
      renderEnd(chosen.length);
    });
    thread.querySelector("[data-discard]").addEventListener("click", () => {
      keptThings = [];
      pending = [];
      if (leaving) {
        window.location.assign("/member");
        return;
      }
      renderEnd(0);
    });
    thread.querySelector("[data-back]").addEventListener("click", () => render(last));
    thread.scrollTop = 0;
  }
  function renderEnd(keptCount) {
    const kept = keptCount ? `<p class="desk-q">${keptCount === 1 ? "One thing" : `${keptCount} things`} kept in your Record.${embedded ? "" : " It is in your lobby whenever you want it."}</p>` : `<p class="desk-q">Nothing kept. This conversation stays private.</p>`;
    const routeBtn = lastRoute ? `<a class="secondary-button" href="${esc(lastRoute.href)}"${String(lastRoute.href).startsWith("#") || String(lastRoute.href).startsWith("/") ? "" : ' target="_blank" rel="noopener"'}>Open ${esc(lastRoute.label)}</a>` : "";
    const lobbyBtn = embedded ? "" : `<a class="primary-button" href="/member">Back to your lobby</a>`;
    const comeBack = keptThings.length ? `<div class="desk-comeback"><p class="desk-q">Anything here you want to come back to?</p><ul class="desk-comeback__list">${keptThings.map((thing, index) => `<li><span>${esc(thing.text)}</span><button type="button" class="text-button" data-practice="${index}">Add to My Practice</button></li>`).join("")}</ul></div>` : "";
    thread.innerHTML = `<div class="desk-end">${kept}${comeBack}<div class="welcome-actions">${lobbyBtn}${routeBtn}</div><p class="welcome-exits"><button type="button" class="text-button" data-again>Start another conversation</button></p></div>`;
    thread.querySelectorAll("[data-practice]").forEach((button) => button.addEventListener("click", async () => {
      const thing = keptThings[Number(button.dataset.practice)];
      button.disabled = true;
      try {
        await practiceApi({ action: "add_item", item: { title: thing.text.slice(0, 160), when: "this_week", href: "/record", linkLabel: "Open your Record", source: "desk" } });
        button.textContent = "Added to My Practice.";
        await memberPractice?.refresh();
      } catch {
        button.disabled = false;
        button.textContent = "That did not add. Try again.";
      }
    }));
    thread.querySelector("[data-again]").addEventListener("click", () => {
      msgs = [];
      last = null;
      lastRoute = null;
      lastAdded = [];
      keptThings = [];
      wrapOffered = false;
      renderIdle();
    });
    thread.scrollTop = 0;
  }
  function wire() {
    thread.querySelectorAll("[data-seed]").forEach((b) => b.addEventListener("click", () => ask(b.dataset.seed)));
    thread.querySelectorAll("[data-choice]").forEach((b) => b.addEventListener("click", () => {
      const c = b.dataset.choice;
      if (c === "keep_private") {
        pending = pending.filter((p) => !lastAdded.includes(p.text));
        lastAdded = [];
        lastKeptPrivate = true;
        render(last);
        return;
      }
      if (CHOICE_SENDS[c]) ask(CHOICE_SENDS[c]);
    }));
    thread.querySelector("[data-wrap]")?.addEventListener("click", () => renderWrap(false));
    thread.querySelector("[data-reset]")?.addEventListener("click", () => {
      msgs = [];
      last = null;
      renderIdle();
    });
  }
  async function ask(text) {
    if (busy || !text) return;
    busy = true;
    msgs.push({ role: "user", text });
    thread.innerHTML = bubbles() + `<p class="desk-note">the Concierge is thinking\u2026</p>`;
    thread.scrollTop = thread.scrollHeight;
    try {
      const r = await fetch("/concierge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "member_desk", messages: msgs }) });
      const d = await r.json();
      busy = false;
      if (!d.ok) {
        msgs.pop();
        render(last);
        thread.insertAdjacentHTML("beforeend", `<p class="desk-msg desk-msg--c">${esc(d.error || "The Concierge is away from the desk. Try again in a moment.")}</p>`);
        return;
      }
      msgs.push({ role: "model", text: d.reply });
      collectCandidates(d);
      last = d;
      render(d);
    } catch {
      busy = false;
      msgs.pop();
      render(last);
      thread.insertAdjacentHTML("beforeend", `<p class="desk-msg desk-msg--c">The Concierge is away from the desk. Try again in a moment.</p>`);
    }
  }
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const t = input.value.trim();
    if (!t) return;
    input.value = "";
    ask(t);
  });
  if (!embedded) {
    main.querySelectorAll('a[href="/member"]').forEach((a) => a.addEventListener("click", (e) => {
      if (!pending.length || wrapOffered) return;
      e.preventDefault();
      wrapOffered = true;
      renderWrap(true);
    }));
    document.getElementById("logoutButton")?.addEventListener("click", async () => {
      await logout();
      window.location.replace("/");
    });
  }
  renderIdle();
}
async function initWelcome() {
  const user = await getUser();
  if (!user || !hasMemberAccess(user)) {
    window.location.replace("/login");
    return;
  }
  const onboardingParam = new URLSearchParams(window.location.search).get("onboarding");
  if (onboardingParam !== "review" && onboardingParam !== "start") {
    window.location.replace("/member");
    return;
  }
  const title = document.getElementById("welcomeTitle");
  const progress = document.getElementById("onboardingProgress");
  const question = document.getElementById("onboardingQuestion");
  const help = document.getElementById("onboardingHelp");
  const choices = document.getElementById("onboardingChoices");
  const input = document.getElementById("welcomeInput");
  const sendButton = document.getElementById("sendWelcome");
  const talkButton = document.getElementById("talkButton");
  const voiceStatus = document.getElementById("voiceStatus");
  const responseBox = document.getElementById("welcomeResponse");
  const panel = document.getElementById("onboardingPanel");
  const skipButton = document.getElementById("skipWelcome");
  const status = document.getElementById("onboardingStatus");
  const preferredName = user.name?.trim() || "";
  const state = {
    step: preferredName ? 0 : -1,
    currentNeed: null,
    destination: null,
    memories: [],
    pendingMemoryPrefix: null,
    foundingEligible: rolesFor(user).includes("founding_villager"),
    founderListing: null
  };
  let busy = false;
  let activeUser = user;
  const questions = [
    {
      text: "What would be useful today?",
      options: ["Give me an orientation", "Yoga or meditation", "A little quiet", "Food support", "Sort something out", "Safety or patterns", "Work with my photos", "Something else"]
    },
    {
      text: "Is there anything that would make the Village easier for you to use?",
      options: ["Keep answers brief", "I prefer voice", "I prefer typing", "Let me explain", "Nothing right now"]
    },
    {
      text: "Is there anything you'd like the Village to remember for next time?",
      options: ["Something I'm working through", "A practice that helps me", "Something I don't want to explain again", "Let me tell you", "Nothing right now"]
    }
  ];
  const destinations = {
    "Give me an orientation": {
      heading: "Here is how to use the Village.",
      copy: "Start with the Concierge when you want help choosing. Open a room when you already know what you need. Save something only when you want the Village to remember it.",
      items: ["The Front Desk helps you sort out where to begin.", "Each room holds its own apps, resources, and live offerings.", "Explore the Village whenever you want to choose for yourself."]
    },
    "Yoga or meditation": {
      heading: "Start in Moxie Studios.",
      copy: "Bott Om can help you begin privately with beginner yoga or meditation and practice at your own pace.",
      pending: "The member Studio link is being connected."
    },
    "A little quiet": {
      heading: "Start in HUSH.",
      copy: "HUSH offers a sixty-second practice now, with additional mindfulness apps and resources opening for members.",
      pending: "The complete member HUSH room is being connected."
    },
    "Food support": {
      heading: "Start in the Kitchen.",
      copy: "PlantLuck can help you add practical plant nourishment to a week that is already full.",
      pending: "The Kitchen's member entrance is being reviewed for desktop use."
    },
    "Safety or patterns": {
      heading: "Start in Safety Hall.",
      copy: "Safety Hall helps you record what happened, look for patterns, sort responsibility, and prepare to seek support.",
      pending: "Safety Hall is being connected to the live Village."
    },
    "Work with my photos": {
      heading: "Start with Cur.AI.ted.",
      copy: "Cur.AI.ted helps you find the story in photos you already have.",
      pending: "The included starter access is being connected."
    }
  };
  title.textContent = preferredName ? `Welcome, ${preferredName.split(/\s+/)[0]}.` : "Welcome.";
  function setBusy(next) {
    busy = next;
    sendButton.disabled = next;
    talkButton.disabled = next;
    sendButton.textContent = next ? "Sending\u2026" : "Send";
  }
  function resetScreen() {
    status.textContent = "";
    panel.hidden = true;
    panel.innerHTML = "";
    choices.innerHTML = "";
    responseBox.hidden = false;
    skipButton.hidden = false;
    input.value = "";
    input.rows = 3;
    input.placeholder = "Type your answer";
    state.pendingMemoryPrefix = null;
  }
  function button(label, handler, className = "choice-button") {
    const element = document.createElement("button");
    element.type = "button";
    element.className = className;
    element.textContent = label;
    element.addEventListener("click", handler);
    return element;
  }
  function renderQuestion() {
    resetScreen();
    if (state.step === -1) {
      progress.textContent = "Optional account setup";
      question.textContent = "What should we call you?";
      help.textContent = "You can skip this and add a name later.";
      input.rows = 1;
      input.placeholder = "Preferred name";
      return;
    }
    const current = questions[state.step];
    progress.textContent = `Question ${state.step + 1} of up to 3`;
    question.textContent = current.text;
    help.textContent = state.step === 0 ? "Choose an answer or tell the Concierge in your own words." : state.step === 1 ? "Choose an answer or explain what would help." : "Choose an answer or tell the Village what would be useful to remember.";
    current.options.forEach((label) => choices.appendChild(button(label, () => handleChoice(label))));
  }
  function showPanel(headingText, copyText, items = []) {
    panel.innerHTML = "";
    panel.hidden = false;
    const heading = document.createElement("h3");
    heading.textContent = headingText;
    const copy = document.createElement("p");
    copy.textContent = copyText;
    panel.append(heading, copy);
    if (items.length) {
      const list = document.createElement("ul");
      items.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        list.appendChild(li);
      });
      panel.appendChild(list);
    }
    return panel;
  }
  function addPanelActions(...elements) {
    const actions = document.createElement("div");
    actions.className = "onboarding-panel__actions";
    elements.forEach((element) => actions.appendChild(element));
    panel.appendChild(actions);
  }
  function link(label, href, primary = false) {
    const element = document.createElement("a");
    element.href = href;
    element.className = primary ? "primary-button" : "secondary-button";
    element.textContent = label;
    return element;
  }
  function showCurrentDestination(allowContinue = true) {
    resetScreen();
    responseBox.hidden = true;
    skipButton.hidden = true;
    progress.textContent = "A place to begin";
    question.textContent = "You can start now.";
    help.textContent = "You do not have to finish onboarding first.";
    const destination = state.destination;
    const destinationPanel = showPanel(
      destination?.heading || "Start with the Concierge.",
      destination?.copy || "Tell the Concierge what you want to sort out, and it will help you choose a next step.",
      destination?.items || []
    );
    if (destination?.pending) {
      const pending = document.createElement("p");
      pending.textContent = destination.pending;
      destinationPanel.appendChild(pending);
    }
    const actions = [];
    if (destination?.href) actions.push(link(destination.action || "Open this room", destination.href, true));
    actions.push(link("Explore the Village", "/member", !destination?.href));
    if (allowContinue) actions.push(button("Continue optional onboarding", () => {
      state.step = 1;
      renderQuestion();
    }, "secondary-button"));
    addPanelActions(...actions);
  }
  function addMemory(value) {
    const clean = String(value || "").trim().slice(0, 180);
    if (clean && !state.memories.includes(clean)) state.memories.push(clean);
  }
  function handleChoice(label) {
    if (busy) return;
    if (state.step === 0) {
      state.currentNeed = label;
      if (label === "Sort something out" || label === "Something else") {
        choices.innerHTML = "";
        help.textContent = label === "Sort something out" ? "Tell the Concierge what you want to sort out." : "Tell the Concierge what would be useful today.";
        input.focus();
        return;
      }
      state.destination = destinations[label] || null;
      showCurrentDestination(true);
      return;
    }
    if (state.step === 1) {
      if (label === "Let me explain") {
        choices.innerHTML = "";
        help.textContent = "Tell the Village what would make it easier to use.";
        input.focus();
        return;
      }
      if (label !== "Nothing right now") addMemory(label === "I prefer voice" ? "Prefers voice" : label === "I prefer typing" ? "Prefers typing" : label);
      state.step = 2;
      renderQuestion();
      return;
    }
    if (label === "Nothing right now") {
      showMemoryReview();
      return;
    }
    const prefixes = {
      "Something I'm working through": "Working through",
      "A practice that helps me": "Practice that helps",
      "Something I don't want to explain again": "Does not want to explain again",
      "Let me tell you": "Remember"
    };
    state.pendingMemoryPrefix = prefixes[label] || "Remember";
    choices.innerHTML = "";
    help.textContent = "Tell the Village only what you want it to remember.";
    input.focus();
  }
  async function savePreferredName(name) {
    const clean = String(name || "").trim().slice(0, 80);
    if (!clean) {
      state.step = 0;
      renderQuestion();
      return;
    }
    setBusy(true);
    try {
      activeUser = await updateUser({ data: { full_name: clean } });
      title.textContent = `Welcome, ${clean.split(/\s+/)[0]}.`;
      state.step = 0;
      renderQuestion();
    } catch {
      status.textContent = "That name did not save. You can try again or skip it.";
    } finally {
      setBusy(false);
    }
  }
  async function askConciergeNow(text) {
    setBusy(true);
    try {
      const response = await fetch("/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "member_help", messages: [{ role: "user", text }] })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error("Concierge unavailable");
      state.destination = payload.route ? {
        heading: payload.route.label,
        copy: payload.reply,
        pending: "The correct member room link will be added after it is confirmed."
      } : { heading: "Stay with the Concierge.", copy: [payload.reply, payload.nextStep].filter(Boolean).join(" ") };
      showCurrentDestination(true);
    } catch {
      state.destination = { heading: "The Concierge is away from the desk.", copy: "Your membership is open. Explore the Village now or return here later." };
      showCurrentDestination(true);
    } finally {
      setBusy(false);
    }
  }
  async function submitAnswer() {
    const clean = input.value.trim();
    if (busy) return;
    if (state.step === -1) {
      await savePreferredName(clean);
      return;
    }
    if (!clean) {
      status.textContent = "Type an answer, use Talk, or skip this question.";
      return;
    }
    if (state.step === 0) {
      state.currentNeed = clean;
      input.value = "";
      await askConciergeNow(clean);
      return;
    }
    if (state.step === 1) {
      addMemory(`Makes the Village easier: ${clean}`);
      state.step = 2;
      renderQuestion();
      return;
    }
    addMemory(`${state.pendingMemoryPrefix || "Remember"}: ${clean}`);
    showMemoryReview();
  }
  function showMemoryReview() {
    resetScreen();
    responseBox.hidden = true;
    skipButton.hidden = true;
    progress.textContent = "Memory choice";
    question.textContent = "Would you like the Village to remember these for next time?";
    help.textContent = "A need for today is not saved as a lasting preference.";
    const review = showPanel(
      state.memories.length ? "Proposed for memory" : "Nothing is proposed for memory",
      state.memories.length ? "Review each item before you decide." : "You can continue without saving anything."
    );
    if (state.memories.length) {
      const list = document.createElement("ul");
      list.className = "memory-list";
      state.memories.forEach((memory) => {
        const item = document.createElement("li");
        item.textContent = memory;
        list.appendChild(item);
      });
      review.appendChild(list);
    }
    const remember = button("Remember these", () => completeOnboarding("remember"), "primary-button");
    if (!state.memories.length) remember.hidden = true;
    addPanelActions(remember, button("Not now", () => completeOnboarding("not_now"), "secondary-button"));
  }
  async function completeOnboarding(decision) {
    setBusy(true);
    status.textContent = decision === "remember" ? "Saving your choices\u2026" : "Finishing\u2026";
    try {
      const response = await fetch("/member-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", decision, memories: decision === "remember" ? state.memories : [] })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error("save failed");
      state.foundingEligible = payload.foundingEligible;
      state.founderListing = payload.founderListing;
      setBusy(false);
      if (state.foundingEligible && !state.founderListing?.decision) showFounderConsent();
      else showFinalDestination();
    } catch {
      status.textContent = "That choice did not save. Try again or explore the Village. Your membership is not affected.";
      setBusy(false);
    }
  }
  function showFounderConsent() {
    resetScreen();
    responseBox.hidden = true;
    skipButton.hidden = true;
    progress.textContent = "Founding Villager choice";
    question.textContent = "Would you like your name included with the 108 Founding Villagers on the public Practice Village landing page?";
    help.textContent = "Your name will not be public unless you confirm it.";
    choices.append(
      button("Yes", showFounderNameEntry),
      button("No", () => saveFounderListing("no"))
    );
  }
  function showFounderNameEntry() {
    choices.innerHTML = "";
    responseBox.hidden = false;
    question.textContent = "What name would you like us to display?";
    help.textContent = "You will confirm the exact public name before it is saved.";
    input.value = activeUser.name?.trim() || "";
    input.placeholder = "Public display name";
    input.focus();
    state.step = 3;
  }
  function showFounderNameConfirmation(displayName) {
    resetScreen();
    responseBox.hidden = true;
    skipButton.hidden = true;
    progress.textContent = "Confirm public name";
    question.textContent = "Your name will appear publicly as:";
    help.textContent = "You can ask us to remove your name later.";
    const confirmation = showPanel("Public display name", "");
    const name = document.createElement("p");
    name.className = "display-name";
    name.textContent = displayName;
    confirmation.appendChild(name);
    addPanelActions(
      button("Yes, use this name", () => saveFounderListing("yes", displayName), "primary-button"),
      button("Change it", showFounderNameEntry, "secondary-button"),
      button("Don't list my name", () => saveFounderListing("no"), "secondary-button")
    );
  }
  async function saveFounderListing(decision, displayName = null) {
    setBusy(true);
    status.textContent = "Saving your choice\u2026";
    try {
      const response = await fetch("/member-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "founder_listing", decision, displayName })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error("save failed");
      state.founderListing = payload.founderListing;
      setBusy(false);
      showFinalDestination();
    } catch {
      status.textContent = "That public-name choice did not save. Try again or explore the Village. Nothing was published.";
      setBusy(false);
    }
  }
  function showFinalDestination() {
    showCurrentDestination(false);
    progress.textContent = "Onboarding complete";
    question.textContent = "Choose where to go next.";
  }
  sendButton.addEventListener("click", async () => {
    if (state.step === 3) {
      const displayName = input.value.trim().slice(0, 80);
      if (!displayName) {
        status.textContent = "Enter the name you want displayed or choose not to be listed.";
        return;
      }
      showFounderNameConfirmation(displayName);
      return;
    }
    await submitAnswer();
  });
  input.addEventListener("keydown", async (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendButton.click();
    }
  });
  skipButton.addEventListener("click", () => {
    if (state.step === -1) state.step = 0;
    else if (state.step < 2) state.step += 1;
    else showMemoryReview();
    if (state.step <= 2) renderQuestion();
  });
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    talkButton.hidden = true;
    voiceStatus.textContent = "Voice entry is not available in this browser. Typing works here.";
  } else {
    let finishListening = function(message) {
      listening = false;
      talkButton.textContent = "Talk";
      clearInterval(timer);
      clearTimeout(limit);
      timer = null;
      limit = null;
      voiceStatus.textContent = message;
    };
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = document.documentElement.lang || "en-US";
    let listening = false;
    let baseText = "";
    let segments = [];
    let timer = null;
    let limit = null;
    let recognitionError = null;
    talkButton.addEventListener("click", () => {
      if (listening) {
        recognition.stop();
        return;
      }
      baseText = input.value.trim();
      segments = [];
      recognitionError = null;
      try {
        recognition.start();
      } catch {
        voiceStatus.textContent = "Voice is already starting. Wait a moment or type instead.";
      }
    });
    recognition.addEventListener("start", () => {
      listening = true;
      talkButton.textContent = "Stop";
      const started = Date.now();
      voiceStatus.textContent = "Listening: 0:00 of 1:00";
      timer = setInterval(() => {
        const elapsed = Math.min(60, Math.floor((Date.now() - started) / 1e3));
        voiceStatus.textContent = `Listening: 0:${String(elapsed).padStart(2, "0")} of 1:00${elapsed >= 50 ? ". Ten seconds left." : ""}`;
      }, 1e3);
      limit = setTimeout(() => recognition.stop(), 6e4);
    });
    recognition.addEventListener("result", (event) => {
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        segments[index] = event.results[index][0].transcript.trim();
      }
      input.value = [baseText, segments.filter(Boolean).join(" ")].filter(Boolean).join(" ");
    });
    recognition.addEventListener("end", () => {
      if (recognitionError) {
        finishListening(recognitionError);
        recognitionError = null;
        return;
      }
      finishListening(input.value.trim() ? "Listening stopped. Your words are below. Review them, add more if you want, then press Send." : "Listening stopped without a transcript. Try again or type instead.");
    });
    recognition.addEventListener("error", (event) => {
      recognitionError = event.error === "not-allowed" ? "Microphone access was not allowed. You can type instead." : "Listening stopped. Keep any words below, try again, or type instead.";
    });
  }
  document.getElementById("logoutButton").addEventListener("click", async () => {
    await logout();
    window.location.replace("/");
  });
  try {
    const response = await fetch("/member-onboarding", { headers: { Accept: "application/json" } });
    if (response.ok) {
      const payload = await response.json();
      state.foundingEligible = payload.foundingEligible;
      state.founderListing = payload.founderListing;
    }
  } catch {
    status.textContent = "Your saved onboarding choices are temporarily unavailable. You can still continue without saving.";
  }
  renderQuestion();
}
async function initRecordPage() {
  const user = await getUser();
  if (!user || !hasMemberAccess(user)) {
    window.location.replace("/login");
    return;
  }
  document.getElementById("logoutButton")?.addEventListener("click", async () => {
    await logout();
    window.location.replace("/");
  });
  initSavedCards();
}
async function initAccountPage() {
  const user = await getUser();
  if (!user || !hasMemberAccess(user)) {
    window.location.replace("/login");
    return;
  }
  const signOut = async () => {
    await logout();
    window.location.replace("/");
  };
  document.getElementById("logoutButton")?.addEventListener("click", signOut);
  document.getElementById("logoutButtonBottom")?.addEventListener("click", signOut);
  const roles = rolesFor(user);
  document.getElementById("memberPlan").textContent = roles.includes("founding_villager") ? "Founding Villager" : "Village Member";
  const longDate = (iso) => {
    if (!iso) return null;
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString(void 0, { month: "long", day: "numeric", year: "numeric" });
  };
  try {
    const response = await fetch("/member-status", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("status");
    const { membership } = await response.json();
    document.getElementById("accountPlan").textContent = membership.planLabel || "Your membership";
    const period = document.getElementById("accountPeriod");
    if (membership.testAccount) {
      period.textContent = "Test access. No payment is attached to this account.";
    } else {
      const ends = longDate(membership.currentPeriodEnd);
      period.textContent = ends ? `Your current period runs through ${ends}.` : "Your membership is active.";
      if (membership.cancelAtPeriodEnd && ends) {
        const note = document.getElementById("accountCancelNote");
        note.textContent = `Your membership is set to end. Your access continues through ${ends}.`;
        note.hidden = false;
      }
    }
  } catch {
    document.getElementById("accountPlan").textContent = "Your membership";
    document.getElementById("accountPeriod").textContent = "Membership details are temporarily unavailable. Nothing has changed.";
  }
  const billing = document.getElementById("openBilling");
  billing?.addEventListener("click", async () => {
    billing.disabled = true;
    const original = billing.textContent;
    billing.textContent = "Opening Stripe\u2026";
    try {
      const response = await fetch("/account", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ action: "billing_portal" })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Billing is temporarily unavailable.");
      window.location.assign(payload.url);
    } catch (error) {
      billing.disabled = false;
      billing.textContent = original;
      const note = document.createElement("p");
      note.className = "room-note account-error";
      note.textContent = error.message;
      billing.parentElement.after(note);
    }
  });
  function dangerFlow({ boxId, startId, word, prompt, endpoint, payloadFor, onDone }) {
    const box = document.getElementById(boxId);
    const start = document.getElementById(startId);
    start?.addEventListener("click", () => {
      const form = document.createElement("div");
      form.className = "account-danger-form";
      const label = document.createElement("label");
      label.className = "saved-card__notelabel";
      label.textContent = prompt;
      const input = document.createElement("input");
      input.type = "text";
      input.autocomplete = "off";
      input.setAttribute("aria-label", prompt);
      label.append(input);
      const status = document.createElement("p");
      status.className = "saved-card__status";
      const actions = document.createElement("div");
      actions.className = "account-actions";
      const confirm = document.createElement("button");
      confirm.type = "button";
      confirm.className = "text-button account-danger";
      confirm.textContent = start.textContent;
      confirm.disabled = true;
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "text-button";
      cancel.textContent = "Keep everything";
      cancel.addEventListener("click", () => {
        box.replaceChildren(start);
      });
      input.addEventListener("input", () => {
        confirm.disabled = input.value.trim().toUpperCase() !== word;
      });
      confirm.addEventListener("click", async () => {
        confirm.disabled = true;
        status.textContent = "Working\u2026";
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(payloadFor(input.value.trim()))
          });
          const payload = await response.json().catch(() => null);
          if (!response.ok || !payload?.ok) throw new Error(payload?.error || "That did not go through. Nothing has changed.");
          onDone(box);
        } catch (error) {
          confirm.disabled = false;
          status.textContent = error.message;
        }
      });
      actions.append(confirm, cancel);
      form.append(label, actions, status);
      box.replaceChildren(form);
      input.focus();
    });
  }
  dangerFlow({
    boxId: "eraseRecordBox",
    startId: "eraseRecordStart",
    word: "ERASE",
    prompt: "Type ERASE to confirm.",
    endpoint: "/member-onboarding",
    payloadFor: (confirm) => ({ action: "erase_record", confirm }),
    onDone: (box) => {
      const done = document.createElement("p");
      done.className = "saved-card__status";
      done.textContent = "Your Record is erased. Your membership is unchanged.";
      box.replaceChildren(done);
    }
  });
  dangerFlow({
    boxId: "closeAccountBox",
    startId: "closeAccountStart",
    word: "CLOSE",
    prompt: "Type CLOSE to confirm.",
    endpoint: "/account",
    payloadFor: (confirm) => ({ action: "close_account", confirm }),
    onDone: async (box) => {
      const done = document.createElement("p");
      done.className = "saved-card__status";
      done.textContent = "Your membership is closed and your Record is erased. Signing you out.";
      box.replaceChildren(done);
      await logout().catch(() => {
      });
      window.setTimeout(() => window.location.replace("/"), 1800);
    }
  });
}
async function initRoomShell() {
  const user = await getUser();
  if (!user || !hasMemberAccess(user)) {
    window.location.replace("/login");
    return;
  }
  document.getElementById("logoutButton")?.addEventListener("click", async () => {
    await logout();
    window.location.replace("/");
  });
  const roomAdd = (buttonId, statusId, item) => {
    const button = document.getElementById(buttonId);
    button?.addEventListener("click", async () => {
      button.disabled = true;
      try {
        await practiceApi({ action: "add_item", item });
        document.getElementById(statusId).hidden = false;
        button.hidden = true;
      } catch {
        button.disabled = false;
        const status = document.getElementById(statusId);
        status.textContent = "That did not add. Try again in a moment.";
        status.hidden = false;
      }
    });
  };
  roomAdd("addPlantluckDailyRoom", "plantluckRoomStatus", { title: "PlantLuck", when: "daily", href: "https://plantluck.org/", linkLabel: "Open PlantLuck", source: "kitchen" });
  const hushAdd = document.getElementById("addHushDaily");
  hushAdd?.addEventListener("click", async () => {
    hushAdd.disabled = true;
    try {
      await practiceApi({ action: "add_item", item: { title: "HUSH \xB7 60 seconds", when: "daily", href: "https://hush-aidedeq.netlify.app/", linkLabel: "Open HUSH", source: "hush" } });
      document.getElementById("hushAddStatus").hidden = false;
      hushAdd.hidden = true;
    } catch {
      hushAdd.disabled = false;
      const status = document.getElementById("hushAddStatus");
      status.textContent = "That did not add. Try again in a moment.";
      status.hidden = false;
    }
  });
}
function initReveal() {
  const targets = document.querySelectorAll(".member-welcome, .member-grid > *, .member-section, .room-grid > *, .shelf > *");
  if (!targets.length) return;
  const revealAll = () => targets.forEach((el) => el.classList.add("in"));
  try {
    for (const el of targets) {
      el.classList.add("pv-reveal");
      const position = [...el.parentElement?.children || []].indexOf(el);
      el.style.setProperty("--d", `${Math.min(position, 5) * 0.07}s`);
    }
    if (!("IntersectionObserver" in window)) {
      revealAll();
      return;
    }
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    targets.forEach((el) => io.observe(el));
    window.setTimeout(revealAll, 2e3);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) revealAll();
    }, { once: true });
  } catch {
    revealAll();
  }
}
if (["member", "record", "account", "room", "welcome"].includes(page)) initReveal();
if (page === "login") initLogin();
if (page === "member") initMemberLobby();
if (page === "record") initRecordPage();
if (page === "account") initAccountPage();
if (page === "room") initRoomShell();
if (page === "welcome") initWelcome();
