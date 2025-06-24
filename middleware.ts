import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (key) => request.cookies.get(key)?.value,
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  const protectedRoutes = [
    '/dashboard',
    '/bookings',
    '/customers',
    '/inventory',
    '/pos',
    '/profile',
    '/services',
    '/settings',
    '/staff',
    '/tasks',
  ];

  const isProtectedRoute = protectedRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  return NextResponse.next();

// Paths that will trigger the middleware
export const config = {
  matcher: [
    // Match all routes except static files, _next, api, login, and public assets
    '/((?!api|login|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
