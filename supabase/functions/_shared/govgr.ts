// TAXISnet verification (v2.0) — the logic of the govgr-auth Edge Function,
// free of Deno/Supabase globals so it can be exercised outside Supabase.
//
// A standard OAuth 2.0 authorization-code flow against the gov.gr sign-in
// (ΓΓΠΣΨΔ «Υπηρεσία Αυθεντικοποίησης Χρηστών oAuth2.0», provided through the
// Κέντρο Διαλειτουργικότητας to the MUNICIPALITY once its request is approved):
//
//   1. POST { action: "start" } with the citizen's session
//        → { url }  — the app sends the browser there.
//   2. The citizen types their TAXISnet codes ON gov.gr. This app never sees
//      them.
//   3. gov.gr redirects back to this function (GET ?code=…&state=…). It swaps
//      the code for a token, asks gov.gr who the person is, and links their
//      ΑΦΜ to the account through taxis_link(): one ΑΦΜ ↔ one account.
//   4. The browser is sent back to the app with ?govgr=ok|taken|mismatch|error.
//
// NOT TESTED AGAINST THE REAL SERVICE: it needs credentials only the
// municipality can obtain. The three addresses and the client credentials are
// configuration (see SETUP_BACKEND.md §13) — nothing about gov.gr is assumed
// here beyond "OAuth 2.0 authorization code" and "the user-info answer carries
// the tax number", and parseUserinfo() accepts the shapes such an answer can
// take (XML attributes, XML elements or JSON).

export interface GovgrConfig {
  authorizeUrl: string;
  tokenUrl: string;
  userinfoUrl: string;
  clientId: string;
  clientSecret: string;
  /** This function's own public URL — registered with gov.gr as the redirect URI. */
  redirectUri: string;
  /** Where the citizen lands afterwards (the app). */
  appUrl: string;
  /** Random secret that signs the `state` (binds the round-trip to the account). */
  stateSecret: string;
  scope?: string;
  /** How the client credentials are sent to the token endpoint. */
  clientAuth?: "body" | "basic";
}
export interface GovgrDeps {
  config: GovgrConfig;
  getUser(jwt: string): Promise<{ id: string } | null>;
  rpc(fn: string, args: Record<string, unknown>): Promise<{ data: unknown; error: { code?: string; message: string } | null }>;
  /** Injected so the flow can be run against a stand-in server. */
  fetch: typeof fetch;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const enc = new TextEncoder();
const b64url = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(data))));
}

const STATE_TTL_MS = 10 * 60 * 1000;

/** `state` = payload.signature — says which account started the sign-in. */
export async function makeState(secret: string, userId: string, now = Date.now()): Promise<string> {
  const nonce = b64url(crypto.getRandomValues(new Uint8Array(12)));
  const payload = b64url(enc.encode(JSON.stringify({ u: userId, e: now + STATE_TTL_MS, n: nonce })));
  return `${payload}.${await hmac(secret, payload)}`;
}
/** The account a `state` was issued for, or null (forged / expired / garbled). */
export async function readState(secret: string, state: string, now = Date.now()): Promise<string | null> {
  const [payload, sig, ...rest] = state.split(".");
  if (!payload || !sig || rest.length) return null;
  const expected = await hmac(secret, payload);
  if (expected.length !== sig.length) return null;
  let diff = 0; // constant-time compare
  for (let i = 0; i < sig.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  if (diff !== 0) return null;
  try {
    const p = JSON.parse(new TextDecoder().decode(unb64url(payload))) as { u?: string; e?: number };
    return typeof p.u === "string" && typeof p.e === "number" && p.e > now ? p.u : null;
  } catch {
    return null;
  }
}

/** Pull the tax number (and a display name) out of gov.gr's user-info answer,
 *  whichever of the usual shapes it comes in. Returns null when there is no
 *  valid 9-digit ΑΦΜ in it. */
export function parseUserinfo(text: string): { taxNumber: string; name: string } | null {
  const fields: Record<string, string> = {};
  const put = (k: string, v: unknown) => {
    if (typeof v === "string" || typeof v === "number") fields[k.toLowerCase()] ??= String(v).trim();
  };
  try {
    const walk = (o: unknown) => {
      if (!o || typeof o !== "object") return;
      for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
        if (v && typeof v === "object") walk(v); else put(k, v);
      }
    };
    walk(JSON.parse(text));
  } catch {
    for (const m of text.matchAll(/([A-Za-z_][\w.-]*)\s*=\s*"([^"]*)"/g)) put(m[1], m[2]);        // XML attributes
    for (const m of text.matchAll(/<([A-Za-z_][\w.-]*)(?:\s[^>]*)?>([^<]*)<\/\1>/g)) put(m[1], m[2]); // XML elements
  }
  const taxNumber = (fields.taxid ?? fields.afm ?? fields.tin ?? fields.tax_id ?? "").replace(/\s+/g, "");
  if (!/^[0-9]{9}$/.test(taxNumber)) return null;
  const name = [fields.firstname ?? fields.first_name ?? "", fields.lastname ?? fields.last_name ?? ""]
    .filter(Boolean).join(" ").trim();
  return { taxNumber, name };
}

export async function handleGovgr(req: Request, deps: GovgrDeps): Promise<Response> {
  const c = deps.config;
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const back = (result: string) => {
    const url = new URL(c.appUrl);
    url.searchParams.set("govgr", result);
    return new Response(null, { status: 302, headers: { Location: url.toString() } });
  };
  try {
    const missing = (["authorizeUrl", "tokenUrl", "userinfoUrl", "clientId", "clientSecret", "redirectUri", "appUrl", "stateSecret"] as const)
      .filter((k) => !c[k]);
    if (missing.length) return json({ error: "not-configured", missing }, 503);

    // 1 ── the app asks where to send the citizen
    if (req.method === "POST") {
      const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
      const user = jwt ? await deps.getUser(jwt) : null;
      if (!user) return json({ error: "auth" }, 401);
      const url = new URL(c.authorizeUrl);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("client_id", c.clientId);
      url.searchParams.set("redirect_uri", c.redirectUri);
      url.searchParams.set("scope", c.scope || "read");
      url.searchParams.set("state", await makeState(c.stateSecret, user.id));
      return json({ url: url.toString() });
    }

    // 3 ── gov.gr sends the citizen back
    if (req.method !== "GET") return json({ error: "method" }, 405);
    const q = new URL(req.url).searchParams;
    const userId = await readState(c.stateSecret, q.get("state") ?? "");
    const code = q.get("code");
    if (!userId || !code || q.get("error")) return back("error");

    const form = new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: c.redirectUri });
    const headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" };
    if (c.clientAuth === "basic") headers.Authorization = "Basic " + btoa(`${c.clientId}:${c.clientSecret}`);
    else { form.set("client_id", c.clientId); form.set("client_secret", c.clientSecret); }
    const tokenRes = await deps.fetch(c.tokenUrl, { method: "POST", headers, body: form.toString() });
    if (!tokenRes.ok) return back("error");
    const token = ((await tokenRes.json().catch(() => ({}))) as { access_token?: string }).access_token;
    if (!token) return back("error");

    const infoRes = await deps.fetch(c.userinfoUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!infoRes.ok) return back("error");
    const who = parseUserinfo(await infoRes.text());
    if (!who) return back("error");

    const { data, error } = await deps.rpc("taxis_link", { p_user: userId, p_tax: who.taxNumber, p_name: who.name });
    if (error) return back("error");
    return back(data === "linked" ? "ok" : data === "taken" ? "taken" : data === "mismatch" ? "mismatch" : "error");
  } catch (e) {
    console.error("govgr-auth", e instanceof Error ? e.message : e);
    return req.method === "GET" ? back("error") : json({ error: "server" }, 500);
  }
}
