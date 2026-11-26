// Supabase Edge Function: govgr-auth (v2.0 — TAXISnet verification)
// Links a signed-in account to the citizen's ΑΦΜ after they sign in on gov.gr
// with their TAXISnet codes. gov.gr redirects the browser back here WITHOUT a
// Supabase session, so JWT verification must be off (the signed `state`
// carries the account instead):
//
// Deploy:  supabase functions deploy govgr-auth --no-verify-jwt
// Secrets (all from the municipality's ΚΕΔ approval — see SETUP_BACKEND.md §13):
//   GOVGR_AUTHORIZE_URL  GOVGR_TOKEN_URL  GOVGR_USERINFO_URL
//   GOVGR_CLIENT_ID      GOVGR_CLIENT_SECRET
//   GOVGR_REDIRECT_URI   = https://<project-ref>.supabase.co/functions/v1/govgr-auth
//   GOVGR_APP_URL        = the app's public address, e.g. https://lefkada.example/
//   GOVGR_STATE_SECRET   = openssl rand -base64 32
//   optional: GOVGR_SCOPE (default "read"), GOVGR_CLIENT_AUTH = body | basic

import { handleGovgr } from "../_shared/govgr.ts";
import { supabaseDeps } from "../_shared/deps.ts";

const env = (k: string) => Deno.env.get(k) ?? "";

Deno.serve((req) => {
  const base = supabaseDeps();
  return handleGovgr(req, {
    getUser: base.getUser,
    rpc: base.rpc,
    fetch,
    config: {
      authorizeUrl: env("GOVGR_AUTHORIZE_URL"),
      tokenUrl: env("GOVGR_TOKEN_URL"),
      userinfoUrl: env("GOVGR_USERINFO_URL"),
      clientId: env("GOVGR_CLIENT_ID"),
      clientSecret: env("GOVGR_CLIENT_SECRET"),
      redirectUri: env("GOVGR_REDIRECT_URI"),
      appUrl: env("GOVGR_APP_URL"),
      stateSecret: env("GOVGR_STATE_SECRET"),
      scope: env("GOVGR_SCOPE") || undefined,
      clientAuth: env("GOVGR_CLIENT_AUTH") === "basic" ? "basic" : "body",
    },
  });
});
