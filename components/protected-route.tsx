"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "manager" | "staff"; // Optional, defaults to any authenticated user
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { userDetails, isLoading, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only check after the auth state has been determined
    if (!isLoading) {
      // If no user is logged in, redirect to login
      if (!userDetails) {
        router.push("/login");
        return;
      }

      // If a specific role is required and the user doesn't have permission
      if (requiredRole && !hasPermission(requiredRole)) {
        // Redirect to a more appropriate page based on their role
        const userRole = userDetails.role;
        if (userRole === "staff") {
          router.push("/dashboard");
        } else {
          router.push("/");
        }
      }
    }
  }, [userDetails, isLoading, requiredRole, router, hasPermission]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // If no user is logged in, don't render children (will redirect from useEffect)
  if (!userDetails) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Redirecting to login...</span>
      </div>
    );
  }

  // If a specific role is required and the user doesn't have permission, don't render children
  if (requiredRole && !hasPermission(requiredRole)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Redirecting to appropriate page...</span>
      </div>
    );
  }

  // User is authenticated and has the required permissions
  return <>{children}</>;
}
