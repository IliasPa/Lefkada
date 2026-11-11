// Supabase Edge Function: ballot-ticket (v1.8 — anonymous ballots, step 1)
// Signs ONE blinded ticket per signed-in account per referendum, without being
// able to see the serial inside it. Also creates a referendum's ticket keys
// when the mayor switches «Ανώνυμα ψηφοδέλτια» on (action: "init").
//
// Deploy:  supabase functions deploy ballot-ticket
// Secrets: supabase secrets set TICKET_MASTER_KEY="$(openssl rand -base64 32)"
//          (set it ONCE and never change it — it unlocks the stored ticket keys)

import { handleTicket } from "../_shared/ballot.ts";
import { supabaseDeps } from "../_shared/deps.ts";

Deno.serve((req) => handleTicket(req, supabaseDeps()));
