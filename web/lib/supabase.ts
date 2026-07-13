'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Tolerate common paste mistakes: surrounding whitespace and trailing slashes
// (a trailing slash makes every API route resolve to an invalid path).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, '');
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

/** True when the Supabase env vars are set. When false the app runs fully
 *  offline on the bundled data (exactly the pre-v1.0 behaviour). */
export const backendConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

/** Lazily created shared Supabase client, or null when not configured. */
export function getSupabase(): SupabaseClient | null {
  if (!backendConfigured) return null;
  if (!client) client = createClient(url!, anonKey!);
  return client;
}
