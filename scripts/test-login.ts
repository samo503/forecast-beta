// Dev-only helper — NOT part of the app bundle, nothing here is imported
// by src/. Logs in as the dedicated password-auth test account (see
// TEST_USER_EMAIL/TEST_USER_PASSWORD in .env.local) via Supabase's normal
// anon-key password-auth API and prints the resulting session as JSON, so
// it can be fed into a browser tab to get an authenticated session for
// local testing without going through the real magic-link flow.
//
// Usage: node scripts/test-login.ts

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal(): Record<string, string> {
  const env: Record<string, string> = {};
  let text: string;
  try {
    text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  } catch {
    return env;
  }
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return env;
}

const env = { ...loadEnvLocal(), ...process.env };

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const email = env.TEST_USER_EMAIL;
const password = env.TEST_USER_PASSWORD;

if (!url || !anonKey || !email || !password) {
  console.error(
    "Missing one of NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, TEST_USER_EMAIL, TEST_USER_PASSWORD in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(url, anonKey);

const { data, error } = await supabase.auth.signInWithPassword({ email, password });

if (error) {
  console.error("Sign-in failed:", error.message);
  process.exit(1);
}

// Print just what's needed to reconstruct a session client-side.
console.log(
  JSON.stringify({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  })
);
