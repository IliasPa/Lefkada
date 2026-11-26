// Supabase Edge Function: ballot-cast (v1.8 — anonymous ballots, step 2)
// Accepts one ballot per valid ticket. It is called WITHOUT a user session —
// the ticket's signature is the only credential — so it must be deployed with
// JWT verification OFF, otherwise Supabase would demand an account:
//
// Deploy:  supabase functions deploy ballot-cast --no-verify-jwt
// Secrets: none required. Optional (v2.1), to accept ballots sent through an
//          independent relay that hides the voter's network address:
//          BALLOT_BOX_KEY = a P-256 private key in PKCS#8 form
//          (node scripts/tally.mjs keygen --out box-key.pem, then
//           supabase secrets set BALLOT_BOX_KEY="$(cat box-key.pem)" and delete the file)

import { handleCast } from "../_shared/ballot.ts";
import { supabaseDeps } from "../_shared/deps.ts";

Deno.serve((req) => handleCast(req, supabaseDeps()));
