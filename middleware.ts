import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname

  // Create a Supabase client for the middleware
  const supabase = createMiddlewareClient({ req, res })

  // Check if the user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Public routes that don't require authentication
  const publicRoutes = ["/login"]

  // If the user is not authenticated and trying to access a protected route, redirect to login
  if (!session && !publicRoutes.includes(pathname)) {
    const redirectUrl = new URL("/login", req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // If the user is authenticated and trying to access login, redirect to dashboard
  if (session && publicRoutes.includes(pathname)) {
    const redirectUrl = new URL("/", req.url)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

// Specify which routes this middleware should run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
}
