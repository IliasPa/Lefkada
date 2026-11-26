// Wires the ballot logic (_shared/ballot.ts) to this Supabase project.
import { createClient } from "npm:@supabase/supabase-js@2";
import type { Deps } from "./ballot.ts";

export function supabaseDeps(): Deps {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  return {
    masterKey: Deno.env.get("TICKET_MASTER_KEY") ?? "",
    boxKey: Deno.env.get("BALLOT_BOX_KEY") ?? "",
    async getUser(jwt) {
      const { data, error } = await admin.auth.getUser(jwt);
      return error || !data?.user ? null : { id: data.user.id };
    },
    async rpc(fn, args) {
      const { data, error } = await admin.rpc(fn, args);
      return { data, error: error ? { code: error.code, message: error.message } : null };
    },
  };
}
