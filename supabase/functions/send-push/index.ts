// Supabase Edge Function: send-push
// Sends a Web Push notification to every stored subscription.
// Only callable by a logged-in user with the 'mayor' role.
//
// Deploy:  supabase functions deploy send-push
// Secrets: supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:iliasparaskevas3@gmail.com

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── Authorise: caller must be the mayor ─────────────────────────────────
    const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
    if (userErr || !userData?.user) return json({ error: "Not authenticated" }, 401);

    const { data: roleRow } = await supabase
      .from("app_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "mayor")
      .maybeSingle();
    if (!roleRow) return json({ error: "Not authorised" }, 403);

    // ── Payload ──────────────────────────────────────────────────────────────
    const { title, body, url } = await req.json();
    if (!title || !body) return json({ error: "title and body are required" }, 400);

    webpush.setVapidDetails(
      Deno.env.get("VAPID_SUBJECT") ?? "mailto:iliasparaskevas3@gmail.com",
      Deno.env.get("VAPID_PUBLIC_KEY")!,
      Deno.env.get("VAPID_PRIVATE_KEY")!,
    );

    const { data: subs, error: subsErr } = await supabase
      .from("push_subscriptions")
      .select("id, subscription");
    if (subsErr) return json({ error: subsErr.message }, 500);

    const payload = JSON.stringify({ title, body, url: url ?? "/" });
    let sent = 0;
    const dead: string[] = [];

    await Promise.all(
      (subs ?? []).map(async (row) => {
        try {
          await webpush.sendNotification(row.subscription, payload);
          sent++;
        } catch (e) {
          // 404/410 mean the subscription no longer exists — clean it up
          const status = (e as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) dead.push(row.id);
        }
      }),
    );

    if (dead.length) {
      await supabase.from("push_subscriptions").delete().in("id", dead);
    }

    return json({ sent, removed: dead.length, total: subs?.length ?? 0 });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
