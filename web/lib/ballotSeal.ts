/**
 * Encrypted ballots (v1.9) — sealing a choice to a referendum's public key,
 * and opening sealed ballots again once their one-time keys are published.
 *
 * Standard building blocks only, all from the browser's WebCrypto:
 *   ECDH on P-256 (a fresh key pair per ballot) → HKDF-SHA256 → AES-256-GCM.
 * P-256 on purpose: it is what a hardware security key can do in its
 * "key management" slot without ever releasing the private key.
 *
 * Format (mirrored by scripts/tally.mjs):
 *   ciphertext = ephemeralPublic(65, uncompressed) ‖ iv(12) ‖ AES-GCM(16-byte plaintext)(32)
 *   AES key    = HKDF-SHA256(ikm = ECDH shared x, salt = ephemeralPublic ‖ recipientPublic,
 *                            info = "lefkada-ballot-enc-v1")       ← this is the ballot's OPENING
 *   AAD        = the poll id (a ballot can't be replayed into another referendum)
 *   plaintext  = [1, optionIndex, 14 random bytes] — every ballot is the same length
 *
 * Pure functions with no app imports.
 */

const INFO = new TextEncoder().encode('lefkada-ballot-enc-v1');
const P256 = { name: 'ECDH', namedCurve: 'P-256' } as const;
const enc = new TextEncoder();

const toB64 = (b: Uint8Array) => btoa(Array.from(b, (x) => String.fromCharCode(x)).join(''));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const buf = (b: Uint8Array) => b as unknown as BufferSource;

/** Accepts a PEM public key (or its bare base64 body) → SPKI base64. */
export function pemToB64(pem: string): string {
  return pem.replace(/-----(BEGIN|END)[^-]*-----/g, '').replace(/\s+/g, '');
}

async function importRecipient(spkiB64: string): Promise<{ key: CryptoKey; raw: Uint8Array }> {
  const key = await crypto.subtle.importKey('spki', buf(fromB64(spkiB64)), P256, true, []);
  return { key, raw: new Uint8Array(await crypto.subtle.exportKey('raw', key)) };
}

/** Throws unless this is a usable P-256 public key. Returns its fingerprint. */
export async function checkEncryptionKey(spkiB64: string): Promise<string> {
  await importRecipient(spkiB64);
  return keyFingerprint(spkiB64);
}

/** SHA-256 of the SPKI, as 8 groups of 4 hex characters — what is printed on
 *  the sealed envelope and shown wherever the key is used. */
export async function keyFingerprint(spkiB64: string): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', buf(fromB64(spkiB64))));
  const hex = Array.from(d.slice(0, 16), (x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
  return (hex.match(/.{4}/g) ?? []).join(' ');
}

async function aesKey(shared: ArrayBuffer, ephRaw: Uint8Array, recipientRaw: Uint8Array): Promise<Uint8Array> {
  const salt = new Uint8Array(ephRaw.length + recipientRaw.length);
  salt.set(ephRaw); salt.set(recipientRaw, ephRaw.length);
  const ikm = await crypto.subtle.importKey('raw', shared, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: buf(salt), info: buf(INFO) }, ikm, 256));
}

/** Seal a choice. Returns the ciphertext (base64, always 148 characters). */
export async function sealBallot(pollId: string, optionIndex: number, recipientSpkiB64: string): Promise<string> {
  if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex > 25) throw new Error('bad option');
  const recipient = await importRecipient(recipientSpkiB64);
  const eph = await crypto.subtle.generateKey(P256, true, ['deriveBits']);
  const ephRaw = new Uint8Array(await crypto.subtle.exportKey('raw', eph.publicKey));
  const shared = await crypto.subtle.deriveBits({ name: 'ECDH', public: recipient.key }, eph.privateKey, 256);
  const key = await crypto.subtle.importKey('raw', buf(await aesKey(shared, ephRaw, recipient.raw)), 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = crypto.getRandomValues(new Uint8Array(16));
  plain[0] = 1; plain[1] = optionIndex;
  const ct = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: buf(iv), additionalData: buf(enc.encode(pollId)) }, key, buf(plain)));
  const out = new Uint8Array(65 + 12 + ct.length);
  out.set(ephRaw); out.set(iv, 65); out.set(ct, 77);
  return toB64(out);
}

/** Open a sealed ballot with its published one-time key. Returns the option
 *  index, or null when the key does not open it / it is not a valid ballot. */
export async function openBallot(pollId: string, ciphertextB64: string, openingB64: string): Promise<number | null> {
  try {
    const raw = fromB64(ciphertextB64);
    if (raw.length !== 109) return null;
    const key = await crypto.subtle.importKey('raw', buf(fromB64(openingB64)), 'AES-GCM', false, ['decrypt']);
    const plain = new Uint8Array(await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: buf(raw.slice(65, 77)), additionalData: buf(enc.encode(pollId)) }, key, buf(raw.slice(77))));
    return plain.length === 16 && plain[0] === 1 ? plain[1] : null;
  } catch {
    return null;
  }
}
