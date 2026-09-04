import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars. Copy .env.local.example to .env.local and fill in your project's URL and anon key from Settings → API."
  );
}

// Single shared client for browser/client-component use. Auth-aware — respects
// RLS policies as the currently signed-in user (or anonymous, pre-login).
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
