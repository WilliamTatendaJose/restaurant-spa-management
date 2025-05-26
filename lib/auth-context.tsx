"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as offlineAuth from "./offline-auth";

type UserRole = "admin" | "manager" | "staff";

interface UserDetails {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
}

interface AuthContextType {
  userDetails: UserDetails | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasPermission: (requiredRole: UserRole) => boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Debug logging
  useEffect(() => {
    console.log("AuthContextProvider mounted");
  }, []);

  // Check if user has permission based on role
  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!userDetails) return false;

    const roleHierarchy: Record<UserRole, number> = {
      admin: 3,
      manager: 2,
      staff: 1,
    };

    return roleHierarchy[userDetails.role] >= roleHierarchy[requiredRole];
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    console.log("=== AuthContext signIn called ===");
    console.log("Email:", email);
    console.log("Password length:", password.length);

    try {
      console.log("Setting loading to true...");
      setIsLoading(true);

      // Use offline authentication
      console.log("About to call offlineAuth.authenticateUser...");
      const result = await offlineAuth.authenticateUser(email, password);
      console.log("Got result from offlineAuth.authenticateUser:", result);

      if (!result) {
        console.log("Authentication failed - no result returned");
        return { error: "Invalid credentials" };
      }

      console.log("Authentication successful, storing token...");
      // Store token in both localStorage and cookies for offline access
      localStorage.setItem("offlineAuthToken", result.token);

      // Also set as HTTP-only cookie for middleware
      document.cookie = `offlineAuthToken=${result.token}; path=/; max-age=${
        7 * 24 * 60 * 60
      }; SameSite=Lax`;

      console.log("Setting user details...");
      setUserDetails({
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        department: result.user.department,
      });

      console.log("Authentication complete, returning success");
      return { error: null };
    } catch (error) {
      console.error("Error in signIn function:", error);
      return { error };
    } finally {
      console.log("Setting loading to false...");
      setIsLoading(false);
      console.log("=== AuthContext signIn completed ===");
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const token = localStorage.getItem("offlineAuthToken");
      if (token) {
        await offlineAuth.logoutUser(token);
        localStorage.removeItem("offlineAuthToken");
        // Clear the cookie as well
        document.cookie = "offlineAuthToken=; path=/; max-age=0";
      }

      setUserDetails(null);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Refresh session - reload user details from stored token
  const refreshSession = async () => {
    try {
      const token = localStorage.getItem("offlineAuthToken");
      if (token) {
        const user = await offlineAuth.verifySession(token);
        if (user) {
          setUserDetails({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            department: user.department,
          });
        } else {
          // Invalid or expired token
          localStorage.removeItem("offlineAuthToken");
          setUserDetails(null);
        }
      }
    } catch (error) {
      console.error("Error refreshing session:", error);
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("offlineAuthToken");

        if (token) {
          const user = await offlineAuth.verifySession(token);
          if (user) {
            setUserDetails({
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              department: user.department,
            });
          } else {
            // Invalid or expired token
            localStorage.removeItem("offlineAuthToken");
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const value = {
    userDetails,
    isLoading,
    signIn,
    signOut,
    hasPermission,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthContextProvider>{children}</AuthContextProvider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
