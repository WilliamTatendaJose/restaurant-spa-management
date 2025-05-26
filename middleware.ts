// Middleware to handle authentication and route protection
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the token from the request
  const token = request.cookies.get('offlineAuthToken')?.value;
  
  // Get the path of the request
  const { pathname } = request.nextUrl;
  
  // Protected routes require authentication
  const protectedRoutes = [
    '/',
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
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Check if the route is a Next.js API route for authentication
  const isNextAuthRoute = pathname.startsWith('/api/auth');
  
  // Redirect to login if trying to access a protected route without a token
  if (isProtectedRoute && !token) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }
  
  // Skip handling Next.js API routes for auth (we'll handle them elsewhere)
  if (isNextAuthRoute) {
    return NextResponse.next();
  }
  
  // Allow all other requests
  return NextResponse.next();
}

// Paths that will trigger the middleware
export const config = {
  matcher: [
    // Match all routes except static files, _next, api (except auth), and login
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
