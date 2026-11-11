/** The commit this build was made from (see next.config.js) and where to read it. */
export const BUILD_COMMIT = process.env.NEXT_PUBLIC_BUILD_COMMIT ?? 'unknown';
export const REPO_URL = 'https://github.com/IliasPa/Lefkada';

/** A published commit is 40 hex characters; anything else ("unknown",
 *  "…-dirty") is a build that cannot be matched to the public code. */
export const buildIsPublished = /^[0-9a-f]{40}$/.test(BUILD_COMMIT);
export const buildCommitUrl = buildIsPublished ? `${REPO_URL}/commit/${BUILD_COMMIT}` : REPO_URL;

/**
 * Content-Security-Policy: the browser itself refuses to let these pages talk
 * to anything outside this list — so a compromised dependency (or an injected
 * script) cannot quietly send a vote, a ticket or a session to another server.
 *
 *   connect-src — where data can be SENT: this site and the Supabase project.
 *   img-src     — images only from the hosts the app really uses (an image
 *                 address is otherwise a way to smuggle data out).
 *   frame-src   — the explainer videos (YouTube's no-cookie player).
 *
 * Limits, honestly: Next.js's static export needs inline scripts, so this is
 * not a defence against script injection as such; and a page can always
 * navigate the whole tab to another address. It also cannot protect against
 * someone who changes the deployed site itself — that is what the build-commit
 * check (scripts/verify-live.mjs) is for. Not applied in `next dev`, whose
 * hot-reloading needs eval and a websocket.
 */
export function contentSecurityPolicy(): string | null {
  if (process.env.NODE_ENV !== 'production') return null;
  const supabase = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
  const backend = /^https:\/\/[a-z0-9.-]+$/i.test(supabase) ? ` ${supabase}` : '';
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    `connect-src 'self'${backend}`,
    "img-src 'self' data: blob: https://lefkada.gov.gr https://www.lefkada.gov.gr"
      + ` https://commons.wikimedia.org https://upload.wikimedia.org https://*.tile.openstreetmap.org${backend}`,
    'frame-src https://www.youtube-nocookie.com',
    "font-src 'self' data:",
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}
