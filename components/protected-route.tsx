"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: "admin" | "manager" | "staff" // Optional, defaults to any authenticated user
}
  type SessionUser = {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
  type Session = {
    user?: SessionUser;
  } | null;

  //

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  // const { data: session, status } = useSession()
   const { data: session } = useSession() as { data: Session };
  const router = useRouter()
  
  // Check if user has permission based on role
  const hasPermission = (required: "admin" | "manager" | "staff"): boolean => {
    if (!session?.user?.role) return false
    
    const roleHierarchy: Record<string, number> = {
      admin: 3,
      manager: 2,
      staff: 1,
    }
    
    const userRole = session.user.role as string
    return roleHierarchy[userRole] >= roleHierarchy[required]
  }

  useEffect(() => {
    // Only check after the auth state has been determined
    if (status !== "loading") {
      // If no user is logged in, redirect to login
      if (status === "unauthenticated") {
        router.push("/login")
        return
      }
      
      // If a specific role is required and the user doesn't have permission
      if (requiredRole && !hasPermission(requiredRole)) {
        // Redirect to a more appropriate page based on their role
        const userRole = session?.user?.role as string
        if (userRole === "staff") {
          router.push("/dashboard")
        } else {
          router.push("/")
        }
      }
    }
  }, [session, status, requiredRole, router])

  // Show loading state while checking auth
  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  // If no user is logged in, don't render children (will redirect from useEffect)
  if (status === "unauthenticated") {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Redirecting to login...</span>
      </div>
    )
  }

  // If a specific role is required and the user doesn't have permission, don't render children
  if (requiredRole && !hasPermission(requiredRole)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Redirecting to appropriate page...</span>
      </div>
    )
  }

  // User is authenticated and has the required permissions
  return <>{children}</>
}
