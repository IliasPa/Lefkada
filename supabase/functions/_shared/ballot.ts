// Anonymous ballots (v1.8) — the logic of the ballot-ticket and ballot-cast
// Edge Functions, kept free of Deno/Supabase globals so it can be exercised
// end-to-end outside Supabase (the two index.ts files only wire it up).
//
// Scheme: RSA Blind Signatures, RFC 9474, variant RSABSSA-SHA384-PSS-
// Deterministic (the ticket serial is 32 random bytes, so no extra message
// randomizer is needed). The blind-signature maths comes from Cloudflare's
// open-source implementation of the RFC (@cloudflare/blindrsa-ts) — nothing
// cryptographic is hand-rolled here.
//
// The protocol constants below are mirrored in web/lib/ballotCrypto.ts.

import { RSABSSA } from "npm:@cloudflare/blindrsa-ts@0.4.6";

const suite = RSABSSA.SHA384.PSS.Deterministic();
const RSA = { name: "RSA-PSS", hash: "SHA-384" } as const;
const MODULUS_BITS = 2048;
const MODULUS_BYTES = MODULUS_BITS / 8;
const SERIAL_BYTES = 32;
/** A sealed ballot (v1.9): ephemeral key 65 ‖ iv 12 ‖ ciphertext+tag 32. */
const CIPHERTEXT_BYTES = 109;

export interface DbError { code?: string; message: string }
export interface Deps {
  /** base64 of 32 random bytes — the TICKET_MASTER_KEY secret. */
  masterKey: string;
  /** The user behind a Supabase access token, or null. */
  getUser(jwt: string): Promise<{ id: string } | null>;
  /** Call a SECURITY DEFINER database function as the service role. */
  rpc(fn: string, args: Record<string, unknown>): Promise<{ data: unknown; error: DbError | null }>;
}

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const enc = new TextEncoder();
export const toB64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
export function fromB64(s: unknown, bytes?: number): Uint8Array | null {
  if (typeof s !== "string" || s.length > 4096) return null;
  try {
    const out = Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
    return bytes === undefined || out.length === bytes ? out : null;
  } catch {
    return null;
  }
}
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const sha256Hex = async (b: Uint8Array) => hex(await crypto.subtle.digest("SHA-256", b as BufferSource));

/** The exact bytes a ticket signs: the referendum, which of its two keys
 *  (Δημότης / other) and the serial. */
export const ticketMessage = (pollId: string, resident: boolean, serialB64: string) =>
  enc.encode(`lefkada-ballot-v1|${pollId}|${resident ? "R" : "O"}|${serialB64}`);

/** What is stored for a used ticket, and shown to the voter as the receipt. */
export const serialHash = (pollId: string, serialB64: string) =>
  sha256Hex(enc.encode(`lefkada-serial-v1|${pollId}|${serialB64}`));

// ── Private-key wrapping (AES-256-GCM under TICKET_MASTER_KEY) ───────────────
async function masterKey(deps: Deps): Promise<CryptoKey> {
  const raw = fromB64(deps.masterKey, 32);
  if (!raw) throw new Error("TICKET_MASTER_KEY must be base64 of exactly 32 bytes");
  return crypto.subtle.importKey("raw", raw as BufferSource, "AES-GCM", false, ["encrypt", "decrypt"]);
}
async function wrap(deps: Deps, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", key);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await masterKey(deps), pkcs8));
  const out = new Uint8Array(12 + ct.length);
  out.set(iv); out.set(ct, 12);
  return toB64(out);
}
async function unwrap(deps: Deps, wrapped: string): Promise<CryptoKey> {
  const raw = fromB64(wrapped);
  if (!raw) throw new Error("corrupt ticket key");
  const pkcs8 = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: raw.slice(0, 12) }, await masterKey(deps), raw.slice(12));
  // extractable: the library does the blind-signing arithmetic on the key's numbers
  return crypto.subtle.importKey("pkcs8", pkcs8, RSA, true, ["sign"]);
}

/** A database refusal → the HTTP answer the app understands. */
function refusal(error: DbError): Response {
  const code = error.code ?? "";
  if (code === "23505" || /^LF\d{3}$/.test(code)) return json({ error: code }, 409);
  if (code === "42501") return json({ error: "forbidden" }, 403);
  return json({ error: "server" }, 500);
}

async function body(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const b = await req.json();
    return b && typeof b === "object" ? (b as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

// ── ballot-ticket: signed-in citizens (and, for `init`, the mayor) ───────────
export async function handleTicket(req: Request, deps: Deps): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  try {
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const user = jwt ? await deps.getUser(jwt) : null;
    if (!user) return json({ error: "auth" }, 401);
    const b = await body(req);
    if (!b) return json({ error: "bad-request" }, 400);

    // Mayor: create this referendum's two key pairs (kept if they exist).
    if (b.action === "init") {
      if (typeof b.referendum_id !== "string") return json({ error: "bad-request" }, 400);
      const gen = () => suite.generateKey({ modulusLength: MODULUS_BITS, publicExponent: new Uint8Array([1, 0, 1]) });
      const [res, oth] = await Promise.all([gen(), gen()]);
      const spki = async (k: CryptoKey) => toB64(new Uint8Array(await crypto.subtle.exportKey("spki", k)));
      const { data, error } = await deps.rpc("ticket_init", {
        p_caller: user.id,
        p_referendum: b.referendum_id,
        p_resident_key: await wrap(deps, res.privateKey),
        p_other_key: await wrap(deps, oth.privateKey),
        p_public: { resident: await spki(res.publicKey), other: await spki(oth.publicKey) },
      });
      if (error) return refusal(error);
      return json({ keys: data });
    }

    // Citizen: sign a blinded ticket — at most one per account per referendum.
    if (b.action === "sign") {
      const blinded = fromB64(b.blinded, MODULUS_BYTES);
      if (typeof b.poll_id !== "string" || typeof b.resident !== "boolean" || !blinded) {
        return json({ error: "bad-request" }, 400);
      }
      const prep = await deps.rpc("ticket_prepare", { p_user: user.id, p_poll_id: b.poll_id });
      if (prep.error) return refusal(prep.error);
      const p = prep.data as { resident: boolean; resident_key: string; other_key: string };
      // The phone blinded for one of the two keys — it must be the right one.
      if (p.resident !== b.resident) return json({ error: "LF005", resident: p.resident }, 409);
      // Sign FIRST, record after: if anything fails here nothing was recorded,
      // and the signature only leaves once the one-per-account gate accepted.
      const key = await unwrap(deps, p.resident ? p.resident_key : p.other_key);
      const signature = await suite.blindSign(key, blinded);
      const issued = await deps.rpc("ticket_issue", {
        p_user: user.id, p_poll_id: b.poll_id, p_resident: p.resident, p_blind_hash: await sha256Hex(blinded),
      });
      if (issued.error) return refusal(issued.error);
      return json({ signature: toB64(signature) });
    }
    return json({ error: "bad-request" }, 400);
  } catch (e) {
    console.error("ballot-ticket", e instanceof Error ? e.message : e);
    return json({ error: "server" }, 500);
  }
}

// ── ballot-cast: NO account — the ticket is the only credential ──────────────
export async function handleCast(req: Request, deps: Deps): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  try {
    const b = await body(req);
    const signature = fromB64(b?.signature, MODULUS_BYTES);
    // v1.9: an encrypted referendum's ballot carries a ciphertext INSTEAD of
    // the option — exactly one of the two must be present (the database then
    // refuses whichever kind the referendum does not take).
    const sealed = typeof b?.ciphertext === "string";
    if (!b || typeof b.poll_id !== "string" || typeof b.resident !== "boolean"
        || (sealed ? b.option !== undefined || !fromB64(b.ciphertext, CIPHERTEXT_BYTES) : !Number.isInteger(b.option))
        || typeof b.serial !== "string" || !fromB64(b.serial, SERIAL_BYTES) || !signature) {
      return json({ error: "bad-request" }, 400);
    }
    const keys = await deps.rpc("ticket_public_keys", { p_poll_id: b.poll_id });
    if (keys.error) return refusal(keys.error);
    const spki = fromB64((keys.data as Record<string, string>)[b.resident ? "resident" : "other"]);
    if (!spki) return json({ error: "server" }, 500);
    const pub = await crypto.subtle.importKey("spki", spki as BufferSource, RSA, true, ["verify"]);
    let valid = false;
    try {
      valid = await suite.verify(pub, signature, ticketMessage(b.poll_id, b.resident, b.serial));
    } catch {
      valid = false;
    }
    if (!valid) return json({ error: "ticket" }, 403);
    const hash = await serialHash(b.poll_id, b.serial);
    const { error } = sealed
      ? await deps.rpc("ballot_record_encrypted", {
        p_poll_id: b.poll_id, p_resident: b.resident, p_serial_hash: hash, p_ciphertext: b.ciphertext,
      })
      : await deps.rpc("ballot_record", {
        p_poll_id: b.poll_id, p_option: b.option, p_resident: b.resident, p_serial_hash: hash,
      });
    if (error) return refusal(error);
    return json({ ok: true, receipt: hash });
  } catch (e) {
    console.error("ballot-cast", e instanceof Error ? e.message : e);
    return json({ error: "server" }, 500);
  }
}
