import { createBrowserClient } from "@supabase/ssr";

// Cookie-syncing client for client components that touch auth state
// (sign in, sign out) — keeps the session in cookies so server actions
// and server components see the same signed-in user. Public reads that
// don't need auth should use lib/supabase/client.ts instead.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
