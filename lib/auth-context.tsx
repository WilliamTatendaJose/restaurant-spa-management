"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

type UserRole = "admin" | "manager" | "staff";

interface UserDetails {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userDetails: UserDetails | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: any }>;
  hasPermission: (requiredRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Role hierarchy: admin > manager > staff
const roleHierarchy: Record<UserRole, number> = {
  admin: 3,
  manager: 2,
  staff: 1,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();

  // Permission checking function
  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!userDetails) return false;

    const userRoleLevel = roleHierarchy[userDetails.role];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    return userRoleLevel >= requiredRoleLevel;
  };

  // Create user details from Supabase user and database profile
  const createUserDetails = async (user: User): Promise<UserDetails> => {
    try {
      // Fetch user profile from database
      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("name, role, department, id")
        .eq("id", user.id)
        .single();
      console.log("Supabase user_profiles query result:", { profile, error, userId: user.id });

      if (error) {
        console.error("Error fetching user profile:", error);
        // Fallback to basic user info with staff role if profile not found
        const fallback = {
          id: user.id,
          email: user.email || "",
          name: user.user_metadata?.full_name || user.email?.split("@")[0],
          role: "staff" as UserRole,
        };
        console.log("Using fallback userDetails:", fallback);
        return fallback;
      }

      const details = {
        id: user.id,
        email: user.email || "",
        name:
          profile.name ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0],
        role: profile.role as UserRole,
      };
      console.log("Fetched userDetails from profile:", details);
      return details;
    } catch (error) {
      console.error("Error creating user details:", error);
      // Fallback to basic user info with staff role
      const fallback = {
        id: user.id,
        email: user.email || "",
        name: user.user_metadata?.full_name || user.email?.split("@")[0],
        role: "staff" as UserRole,
      };
      console.log("Using fallback userDetails (catch):", fallback);
      return fallback;
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      const user = session?.user ?? null;
      setUser(user);

      if (user) {
        const details = await createUserDetails(user);
        setUserDetails(details);
        console.log("setUserDetails (initial):", details);
      } else {
        setUserDetails(null);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);

      setSession(session);
      const user = session?.user ?? null;
      setUser(user);

      if (user) {
        const details = await createUserDetails(user);
        setUserDetails(details);
        console.log("setUserDetails (auth change):", details);
      } else {
        setUserDetails(null);
      }

      // Trigger sync when user signs in
      if (event === "SIGNED_IN" && session?.user) {
        console.log("User signed in, triggering initial sync...");
        // Import and trigger sync after a short delay to allow components to initialize
        setTimeout(async () => {
          try {
            const { databaseSync } = await import("@/lib/sync-script");
            await databaseSync.resetAndResync();
          } catch (error) {
            console.error("Failed to sync after sign in:", error);
          }
        }, 1000);
      }

      // Clear local data when user signs out
      if (event === "SIGNED_OUT") {
        console.log("User signed out, clearing local data...");
        try {
          // Clear IndexedDB
          const request = indexedDB.deleteDatabase("RestaurantSpaDB");
          request.onsuccess = () => console.log("Local database cleared");
          request.onerror = () =>
            console.error("Failed to clear local database");
        } catch (error) {
          console.error("Error clearing local data:", error);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Set isLoading to false only after userDetails is set (or null if no user)
  useEffect(() => {
    console.log("[AuthContext] useEffect (user/userDetails change):", { user, userDetails });
    // If session has been checked (user is null or userDetails is set), loading is done
    if ((user === null && userDetails === null) || (user && userDetails)) {
      setIsLoading(false);
      console.log("[AuthContext] isLoading set to false");
    } else {
      setIsLoading(true); // Explicitly set loading to true while fetching details
      console.log("[AuthContext] isLoading set to true (waiting for userDetails)");
    }
  }, [user, userDetails]);

  useEffect(() => {
    console.log("AuthProvider state:", { user, session, userDetails, isLoading });
  }, [user, session, userDetails, isLoading]);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    console.log("[AuthContext] signIn called, isLoading set to true");
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } finally {
      // Removed setIsLoading(false) from here
    }
  };

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    console.log("[AuthContext] signUp called, isLoading set to true");
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { error };
    } finally {
      // Removed setIsLoading(false) from here
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    console.log("[AuthContext] signOut called, isLoading set to true");
    try {
      await supabase.auth.signOut();
    } finally {
      // Removed setIsLoading(false) from here
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const value = {
    user,
    session,
    userDetails,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
