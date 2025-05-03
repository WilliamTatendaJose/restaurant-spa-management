import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  // Skip middleware for NextAuth API routes and other non-page routes
  if (req.nextUrl.pathname.startsWith('/api/') ||
      req.nextUrl.pathname.startsWith('/_next/') ||
      req.nextUrl.pathname.includes('.')) {
    return NextResponse.next();
  }
  
  // Public routes that don't require authentication
  const publicRoutes = ["/login"]
  const pathname = req.nextUrl.pathname

  try {
    // Get token from the session using NextAuth JWT
    const token = await getToken({ 
      req,
      secret: process.env.NEXTAUTH_SECRET
    })
    
    // If the user is not authenticated and trying to access a protected route, redirect to login
    if (!token && !publicRoutes.includes(pathname)) {
      const redirectUrl = new URL("/login", req.url)
      console.log(`Middleware: Redirecting unauthenticated user from ${pathname} to /login`)
      return NextResponse.redirect(redirectUrl)
    }
    
    // If the user is authenticated and trying to access login, redirect to dashboard
    if (token && publicRoutes.includes(pathname)) {
      const redirectUrl = new URL("/", req.url)
      console.log(`Middleware: Redirecting authenticated user from ${pathname} to /`)
      return NextResponse.redirect(redirectUrl)
    }
    
    console.log(`Middleware: Allowing access to ${pathname}`)
    return NextResponse.next()
  } catch (error) {
    console.error("Middleware error:", error)
    // If there's an error in authentication check, let the request through
    // The page-level authentication will handle it
    return NextResponse.next() 
  }
}

// Match all request paths except for specific static files and API routes
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /api/auth/* (NextAuth API routes)
     * - /_next/static (static files)
     * - /_next/image (next image)
     * - /favicon.ico, /svg, etc. (static assets)
     */
    "/((?!api/auth|_next/static|_next/image|.*\\.png$|.*\\.svg$|favicon.ico).*)"
  ],
}
