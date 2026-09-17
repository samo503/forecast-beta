// Only ever returns a same-origin relative path, or "/" as a safe
// fallback — shared by AuthForm (client-side router.push) and
// auth/callback/route.ts (server-side redirect), since both build a
// destination from a caller-supplied `next` query param.
//
// Requiring a leading "/", and rejecting "//" and "/\", isn't just about
// blocking protocol-relative URLs. auth/callback/route.ts builds its
// redirect as `${origin}${next}` — plain string concatenation, not URL
// resolution — so anything that doesn't start with "/" can escape the
// origin entirely once concatenated:
//   next = "@evil.com"   -> "https://forecasttv.app@evil.com"
//     parses as userinfo "forecasttv.app", host "evil.com"
//   next = ".evil.com"   -> "https://forecasttv.app.evil.com"
//     a real subdomain of evil.com, which its owner controls
// A leading "/" rules out both of these, plus absolute URLs
// ("https://evil.com") and bare paths with no leading slash ("foo") that
// would otherwise concatenate into something malformed or dangerous.
// "/\" is included alongside "//" because some browsers normalize a
// leading backslash to a forward slash before parsing, making "/\evil.com"
// behave like "//evil.com" (protocol-relative) despite not literally
// starting with two slashes.
export function safeNext(next: string | null | undefined): string {
  if (!next) return "/";
  if (!next.startsWith("/")) return "/";
  if (next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}
