// Supabase Edge Function: ballot-cast (v1.8 — anonymous ballots, step 2)
// Accepts one ballot per valid ticket. It is called WITHOUT a user session —
// the ticket's signature is the only credential — so it must be deployed with
// JWT verification OFF, otherwise Supabase would demand an account:
//
// Deploy:  supabase functions deploy ballot-cast --no-verify-jwt
// Secrets: none of its own (it only needs the public ticket keys).

import { handleCast } from "../_shared/ballot.ts";
import { supabaseDeps } from "../_shared/deps.ts";

Deno.serve((req) => handleCast(req, supabaseDeps()));
