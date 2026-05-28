// Middleware is intentionally minimal.
// Auth protection is handled client-side via useAuth() in each protected page.
// This avoids issues with Supabase storing tokens in localStorage (not cookies).

export function middleware() {
  // No-op: all route protection is client-side
}

export const config = {
  matcher: [],
};
