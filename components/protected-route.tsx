"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  // Debug log
  console.log("[ProtectedRoute] Render:", { user, isLoading, isChecking });

  useEffect(() => {
    console.log("[ProtectedRoute] useEffect triggered", { user, isLoading });
    if (!isLoading) {
      if (!user) {
        console.log(
          "[ProtectedRoute] No authenticated user, redirecting to login...",
          { redirectTo }
        );
        router.push(redirectTo);
      } else {
        console.log("[ProtectedRoute] User authenticated:", user.email);
        setIsChecking(false);
      }
    }
  }, [user, isLoading, router, redirectTo]);

  if (isLoading || isChecking) {
    console.log("[ProtectedRoute] Showing loader", { isLoading, isChecking });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log("[ProtectedRoute] No user after loading, returning null");
    return null; // Will redirect in useEffect
  }

  console.log("[ProtectedRoute] Rendering children");
  return <>{children}</>;
}
