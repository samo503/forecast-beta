import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Refreshes the Supabase session on every request and persists any rotated
// tokens to the response cookies. This is NOT an auth gate — no route is
// redirected here (most of the app is intentionally public; only specific
// actions like Lock Pick or /profile require a session, and they check
// that themselves). Without this, a Server Component that needs to refresh
// an expiring access token can't — Server Components can't write cookies —
// so the rotated refresh token gets silently dropped and the session dies.
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not use getSession() here — always use getUser(), which validates
  // the token with Supabase and triggers a refresh if it's expired.
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)',
  ],
}
