import { createClient } from "@supabase/supabase-js";

function cleanEnv(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/^['"]|['"]$/g, "");
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

const supabaseUrl = cleanEnv(import.meta.env.VITE_SUPABASE_URL);
const supabasePublishableKey = cleanEnv(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const isSupabaseConfigured = Boolean(isValidUrl(supabaseUrl) && supabasePublishableKey);

export const supabase = createClient(isSupabaseConfigured ? supabaseUrl : "https://example.supabase.co", supabasePublishableKey || "missing-key", {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
