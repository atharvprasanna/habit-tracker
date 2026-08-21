/**
 * Supabase client singleton.
 * Returns null when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set,
 * which causes storage.ts to fall back to localStorage automatically.
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url  = (import.meta.env.VITE_SUPABASE_URL  ?? "") as string;
const key  = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "") as string;

export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null;

export const isSupabaseEnabled = !!supabase;
