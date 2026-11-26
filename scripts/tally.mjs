#!/usr/bin/env node
/**
 * The count of an ENCRYPTED-ballot referendum (v1.9) — run on the mayor's own
 * computer, after the referendum has closed, with the referendum's private key.
 *
 * The private key never goes anywhere: this script reads the (public) sealed
 * ballots, asks the key to derive each ballot's one-time key (its "opening"),
 * and writes them to a file. That file is then uploaded in /admin ▸
 * Δημοψηφίσματα, which re-checks every opening before publishing the count —
 * after which anyone can re-decrypt every ballot and recount.
 *
 *   node scripts/tally.mjs keygen   --out referendum-key.pem
 *       A SOFTWARE key in a file — for trying the feature out, or for
 *       low-stakes polls. It is only as secret as that file. Prints the public
 *       key to paste into the referendum form.
 *
 *   node scripts/tally.mjs selftest (--key-file key.pem | --piv)
 *       Seals a test ballot to the key's public half and opens it again.
 *       RUN THIS WITH YOUR HARDWARE KEY BEFORE USING IT FOR A REAL REFERENDUM.
 *
 *   node scripts/tally.mjs count --poll <referendum id> (--key-file key.pem | --piv) [--out tally.json]
 *       Reads the ballots and writes the count file. Refuses before closing.
 *
 * Hardware key (--piv): a PIV security key (e.g. a YubiKey 5) holding a P-256
 * key generated INSIDE it, in the key-management slot (9d). The derivation runs
 * inside the device through OpenSC's `pkcs11-tool`; nothing can copy the key
 * out. Needs:  brew install opensc yubico-piv-tool
 *   --pkcs11-module <path>  default: Homebrew's libykcs11.dylib
 *   --key-id <hex>          default: 03 (PIV slot 9d)
 *   --pub <public.pem>      the key's public half (as exported when it was generated)
 *   PIN: asked on the terminal (or LEFKADA_PIV_PIN).
 * NOTE: the --piv path was written without a device at hand and is UNTESTED —
 * `selftest --piv` is how you find out whether it works with yours.
 *
 * Backend address: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY from
 * the environment or web/.env.local. Only public data is read; no secret key
 * of the project is needed.
 */

import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

const INFO = Buffer.from('lefkada-ballot-enc-v1');

// ── Format (mirrors web/lib/ballotSeal.ts) ───────────────────────────────────
/** A P-256 public key as its 65-byte uncompressed point (04 ‖ x ‖ y). */
function rawPoint(publicKey) {
  const jwk = publicKey.export({ format: 'jwk' });
  if (jwk.kty !== 'EC' || jwk.crv !== 'P-256') throw new Error('the key must be an elliptic-curve P-256 key');
  return Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x, 'base64url'), Buffer.from(jwk.y, 'base64url')]);
}
const pointToKey = (raw) => crypto.createPublicKey({ format: 'jwk', key: {
  kty: 'EC', crv: 'P-256', x: raw.subarray(1, 33).toString('base64url'), y: raw.subarray(33, 65).toString('base64url') } });
const spkiB64 = (publicKey) => publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
export function fingerprint(spki) {
  const hex = crypto.createHash('sha256').update(Buffer.from(spki, 'base64')).digest().subarray(0, 16).toString('hex').toUpperCase();
  return hex.match(/.{4}/g).join(' ');
}
const openingFor = (shared, ephRaw, recipientRaw) =>
  Buffer.from(crypto.hkdfSync('sha256', shared, Buffer.concat([ephRaw, recipientRaw]), INFO, 32));

/** Open one ballot with its opening → option index, or null. */
export function openBallot(pollId, ciphertextB64, opening) {
  try {
    const raw = Buffer.from(ciphertextB64, 'base64');
    if (raw.length !== 109) return null;
    const d = crypto.createDecipheriv('aes-256-gcm', opening, raw.subarray(65, 77));
    d.setAAD(Buffer.from(pollId));
    d.setAuthTag(raw.subarray(93));
    const plain = Buffer.concat([d.update(raw.subarray(77, 93)), d.final()]);
    return plain.length === 16 && plain[0] === 1 ? plain[1] : null;
  } catch {
    return null;
  }
}

/** Seal a ballot (only used by selftest — the app does this in the browser). */
export function sealBallot(pollId, option, recipientPublic) {
  const eph = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const ephRaw = rawPoint(eph.publicKey);
  const shared = crypto.diffieHellman({ privateKey: eph.privateKey, publicKey: recipientPublic });
  const key = openingFor(shared, ephRaw, rawPoint(recipientPublic));
  const iv = crypto.randomBytes(12);
  const plain = crypto.randomBytes(16); plain[0] = 1; plain[1] = option;
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  c.setAAD(Buffer.from(pollId));
  const ct = Buffer.concat([c.update(plain), c.final(), c.getAuthTag()]);
  return Buffer.concat([ephRaw, iv, ct]).toString('base64');
}

// ── Key holders: something that can do ECDH with the referendum's private key ─
/** A software key in a PEM file. */
export function fileKey(path) {
  const privateKey = crypto.createPrivateKey(readFileSync(path));
  const publicKey = crypto.createPublicKey(privateKey);
  return {
    kind: 'file', publicKey,
    derive: (ephRaw) => crypto.diffieHellman({ privateKey, publicKey: pointToKey(ephRaw) }),
    close() {},
  };
}

/** A PIV hardware key through OpenSC's pkcs11-tool. UNTESTED — see the header. */
export function pivKey({ module, keyId, pubPath, pin }) {
  const publicKey = crypto.createPublicKey(readFileSync(pubPath));
  const dir = mkdtempSync(join(tmpdir(), 'lefkada-tally-'));
  return {
    kind: 'piv', publicKey,
    derive(ephRaw) {
      const peer = join(dir, 'peer.der'); const out = join(dir, 'shared.bin');
      writeFileSync(peer, pointToKey(ephRaw).export({ type: 'spki', format: 'der' }));
      execFileSync('pkcs11-tool', ['--module', module, '--login', '--pin', pin, '--derive', '-m', 'ECDH1-DERIVE',
        '--id', keyId, '--input-file', peer, '--output-file', out], { stdio: ['ignore', 'ignore', 'pipe'] });
      const shared = readFileSync(out);
      rmSync(out, { force: true });
      if (shared.length !== 32) throw new Error(`the device returned ${shared.length} bytes, expected 32`);
      return shared;
    },
    close() { rmSync(dir, { recursive: true, force: true }); },
  };
}

/** Derive the opening of one ballot with the key holder. */
export function openingOf(holder, ciphertextB64) {
  const raw = Buffer.from(ciphertextB64, 'base64');
  if (raw.length !== 109 || raw[0] !== 4) return null;
  const ephRaw = raw.subarray(0, 65);
  try {
    return openingFor(holder.derive(ephRaw), ephRaw, rawPoint(holder.publicKey));
  } catch (e) {
    if (holder.kind === 'piv') throw e; // a device failure must stop the count, not spoil ballots
    return null;                        // a malformed point: an invalid ballot
  }
}

/** The whole count, given the ballots: { ballots: {id: {k, o}}, counts, invalid }. */
export function countBallots(holder, pollId, rows, optionCount) {
  const ballots = {}; const counts = Array(optionCount).fill(0); let invalid = 0;
  for (const row of rows) {
    const opening = openingOf(holder, row.ciphertext);
    let o = opening ? openBallot(pollId, row.ciphertext, opening) : null;
    if (o !== null && o >= optionCount) o = null;
    if (o === null) invalid++; else counts[o]++;
    // An unopenable ballot still gets a (useless, random) opening, so anyone can see for themselves that it does not open.
    ballots[row.id] = { k: (opening ?? crypto.randomBytes(32)).toString('base64'), o };
  }
  return { ballots, counts, invalid };
}

// ── CLI ──────────────────────────────────────────────────────────────────────
function args() {
  const a = process.argv.slice(3); const out = {};
  for (let i = 0; i < a.length; i++) {
    if (!a[i].startsWith('--')) continue;
    const k = a[i].slice(2);
    out[k] = a[i + 1] && !a[i + 1].startsWith('--') ? a[++i] : true;
  }
  return out;
}
function backend() {
  const env = { ...process.env };
  const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'web', '.env.local');
  if (existsSync(file)) {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*(NEXT_PUBLIC_SUPABASE_(?:URL|ANON_KEY))\s*=\s*(.+?)\s*$/);
      if (m && !env[m[1]]) env[m[1]] = m[2];
    }
  }
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, ''); const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not found (environment or web/.env.local)');
  return { url, key };
}
async function rest(path) {
  const { url, key } = backend();
  const res = await fetch(`${url}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}
function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => { rl.close(); process.stdout.write('\n'); resolve(answer.trim()); });
    rl._writeToOutput = (s) => { if (s.includes(question)) rl.output.write(question); }; // don't echo the PIN
  });
}
async function holderFrom(a) {
  if (a['key-file']) return fileKey(a['key-file']);
  if (a.piv) {
    if (typeof a.pub !== 'string') throw new Error('--piv needs --pub <public.pem> (the public key exported when the device key was generated)');
    // Check the tools are there BEFORE asking for the PIN.
    const module = typeof a['pkcs11-module'] === 'string' ? a['pkcs11-module'] : '/opt/homebrew/lib/libykcs11.dylib';
    if (!existsSync(module)) throw new Error(`PKCS#11 module not found: ${module}\n  brew install yubico-piv-tool   (or pass --pkcs11-module <path>)`);
    try { execFileSync('pkcs11-tool', ['--version'], { stdio: 'ignore' }); }
    catch (e) { if (e.code === 'ENOENT') throw new Error('pkcs11-tool not found\n  brew install opensc'); }
    const pin = process.env.LEFKADA_PIV_PIN || await askHidden('PIV PIN: ');
    return pivKey({ module, keyId: typeof a['key-id'] === 'string' ? a['key-id'] : '03', pubPath: a.pub, pin });
  }
  throw new Error('say where the key is: --key-file <key.pem>  or  --piv --pub <public.pem>');
}
const pem = (publicKey) => publicKey.export({ type: 'spki', format: 'pem' });

async function main() {
  const cmd = process.argv[2]; const a = args();
  if (cmd === 'keygen') {
    if (typeof a.out !== 'string') throw new Error('keygen needs --out <file.pem>');
    if (existsSync(a.out)) throw new Error(`${a.out} already exists — refusing to overwrite a key`);
    const pair = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
    writeFileSync(a.out, pair.privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
    console.log(`Private key written to ${a.out} — keep it offline; whoever has this file can read the ballots.`);
    console.log(`Fingerprint: ${fingerprint(spkiB64(pair.publicKey))}\n\nPublic key (paste into the referendum form):\n${pem(pair.publicKey)}`);
    return;
  }
  if (cmd === 'selftest') {
    const holder = await holderFrom(a);
    try {
      const sealed = sealBallot('ref_selftest', 3, holder.publicKey);
      const opening = openingOf(holder, sealed);
      const got = opening ? openBallot('ref_selftest', sealed, opening) : null;
      if (got !== 3) throw new Error('the key did NOT open a ballot sealed to its public half — do not use it');
      console.log(`✓ ${holder.kind === 'piv' ? 'The hardware key' : 'The key file'} opens ballots sealed to it.`);
      console.log(`Fingerprint: ${fingerprint(spkiB64(holder.publicKey))}\n\nPublic key (paste into the referendum form):\n${pem(holder.publicKey)}`);
    } finally { holder.close(); }
    return;
  }
  if (cmd === 'count') {
    if (typeof a.poll !== 'string') throw new Error('count needs --poll <referendum id>');
    const id = a.poll.replace(/^ref_/, ''); const pollId = `ref_${id}`;
    const [ref] = await rest(`referendums?id=eq.${encodeURIComponent(id)}&select=title_el,options,ends_at,encrypted_ballots,encryption_key,tallied_at`);
    if (!ref) throw new Error('referendum not found (is it published?)');
    if (!ref.encrypted_ballots) throw new Error('this referendum does not use encrypted ballots');
    if (ref.tallied_at) throw new Error('this referendum was already counted');
    if (Date.now() < new Date(ref.ends_at).getTime() && !a['i-know-it-is-still-open']) {
      throw new Error(`the referendum is still open until ${ref.ends_at} — the count is done after closing`);
    }
    const holder = await holderFrom(a);
    try {
      if (spkiB64(holder.publicKey) !== ref.encryption_key) {
        throw new Error(`this is not the referendum's key.\n  referendum: ${fingerprint(ref.encryption_key)}\n  this key:   ${fingerprint(spkiB64(holder.publicKey))}`);
      }
      const rows = [];
      for (let from = 0; ; from += 1000) {
        const page = await rest(`referendums_ballots?poll_id=eq.${encodeURIComponent(pollId)}&select=id,ciphertext&order=id&offset=${from}&limit=1000`);
        rows.push(...page);
        if (page.length < 1000) break;
      }
      console.log(`«${ref.title_el}» — ${rows.length} sealed ballot(s). Opening…`);
      const result = countBallots(holder, pollId, rows, ref.options.length);
      const out = typeof a.out === 'string' ? a.out : `tally-${id}.json`;
      writeFileSync(out, JSON.stringify({ version: 1, poll_id: pollId, fingerprint: fingerprint(ref.encryption_key), ballots: result.ballots }, null, 1) + '\n');
      ref.options.forEach((o, i) => console.log(`  ${String.fromCharCode(65 + i)}. ${o.el}: ${result.counts[i]}`));
      if (result.invalid) console.log(`  (did not open / invalid: ${result.invalid})`);
      console.log(`\nCount file written to ${out} — upload it in /admin ▸ Δημοψηφίσματα to publish the result.`);
    } finally { holder.close(); }
    return;
  }
  console.log('usage: node scripts/tally.mjs <keygen|selftest|count> …   (see the comment at the top of this file)');
  process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => { console.error('✗ ' + (e.message || e)); process.exit(1); });
}
