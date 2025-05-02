"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut, SessionProvider } from "next-auth/react"
import type { User as SupabaseUser, Session as SupabaseSession } from "@supabase/supabase-js"
import * as offlineAuth from "@/lib/offline-auth"

type UserRole = "admin" | "manager" | "staff"

interface UserDetails {
  id: string
  email: string
  name: string
  role: UserRole
  department?: string
}

interface AuthContextType {
  user: SupabaseUser | null
  userDetails: UserDetails | null
  session: SupabaseSession | null
  isLoading: boolean
  isOnline: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  hasPermission: (requiredRole: UserRole) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Separate component for using NextAuth hooks
function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [session, setSession] = useState<SupabaseSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const { data: nextAuthSession } = useSession()

  // Monitor online status
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Fetch user details from the database
  const fetchUserDetails = async (userId: string) => {
    try {
      // Try to get user details from NextAuth session first
      if (nextAuthSession?.user) {
        const nextAuthUser = nextAuthSession.user as any
        if (nextAuthUser.id === userId) {
          return {
            id: nextAuthUser.id,
            email: nextAuthUser.email || '',
            name: nextAuthUser.name || '',
            role: nextAuthUser.role || 'staff',
            department: nextAuthUser.department
          } as UserDetails
        }
      }
      
      // If online, try Supabase
      if (isOnline) {
        const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).single()

        if (error) {
          console.error("Error fetching user details:", error)

          // If the user profile doesn't exist, create a default one
          if (error.code === "PGRST116") {
            // Get user email from auth
            const { data: userData } = await supabase.auth.getUser()
            const email = userData?.user?.email || ""

            // Create a default user profile
            const defaultProfile = {
              id: userId,
              name: email.split("@")[0] || "New User",
              email: email,
              role: "staff", // Default role
              status: "active",
            }

            // Insert the default profile
            const { data: newProfile, error: insertError } = await supabase
              .from("user_profiles")
              .insert(defaultProfile)
              .select()
              .single()

            if (insertError) {
              console.error("Error creating default user profile:", insertError)
              return null
            }

            return newProfile as UserDetails
          }

          return null
        }

        return data as UserDetails
      } else {
        // If offline, try local storage
        const offlineUser = await offlineAuth.getUser(userId)
        if (offlineUser) {
          return {
            id: offlineUser.id,
            email: offlineUser.email,
            name: offlineUser.name,
            role: offlineUser.role,
            department: offlineUser.department
          } as UserDetails
        }
      }
      
      return null
    } catch (error) {
      console.error("Error in fetchUserDetails:", error)
      return null
    }
  }

  // Check if user has permission based on role
  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!userDetails) return false

    const roleHierarchy: Record<UserRole, number> = {
      admin: 3,
      manager: 2,
      staff: 1,
    }

    return roleHierarchy[userDetails.role] >= roleHierarchy[requiredRole]
  }

  // Refresh the session
  const refreshSession = async () => {
    try {
      if (isOnline) {
        // Try NextAuth first
        if (nextAuthSession?.user) {
          const nextAuthUser = nextAuthSession.user as any
          setUserDetails({
            id: nextAuthUser.id,
            email: nextAuthUser.email || '',
            name: nextAuthUser.name || '',
            role: nextAuthUser.role || 'staff',
            department: nextAuthUser.department
          })
          return
        }
      
        // Otherwise use Supabase
        const { data } = await supabase.auth.getSession()
        setSession(data.session)
        setUser(data.session?.user || null)

        if (data.session?.user) {
          const details = await fetchUserDetails(data.session.user.id)
          setUserDetails(details)
        }
      } else {
        // In offline mode, try to restore session from local storage
        const token = localStorage.getItem('offlineAuthToken')
        if (token) {
          const offlineUser = await offlineAuth.verifySession(token)
          if (offlineUser) {
            setUserDetails({
              id: offlineUser.id,
              email: offlineUser.email,
              name: offlineUser.name,
              role: offlineUser.role,
              department: offlineUser.department
            })
          }
        }
      }
    } catch (error) {
      console.error("Error refreshing session:", error)
    }
  }

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      
      if (isOnline) {
        // Try NextAuth sign in first
        const result = await nextAuthSignIn('credentials', { 
          email, 
          password,
          redirect: false
        })
        
        if (!result?.error) {
          // Successfully signed in with NextAuth
          await refreshSession()
          return { error: null }
        }
        
        // If NextAuth fails, try Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          return { error }
        }

        setSession(data.session)
        setUser(data.session?.user || null)

        if (data.session?.user) {
          const details = await fetchUserDetails(data.session.user.id)
          setUserDetails(details)
        }

        return { error: null }
      } else {
        // Offline authentication
        const result = await offlineAuth.authenticateUser(email, password)
        
        if (!result) {
          return { error: { message: "Invalid email or password" } }
        }
        
        // Store token in localStorage for offline access
        localStorage.setItem('offlineAuthToken', result.token)
        
        setUserDetails({
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          department: result.user.department
        })
        
        return { error: null }
      }
    } catch (error) {
      console.error("Error signing in:", error)
      return { error }
    } finally {
      setIsLoading(false)
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      if (isOnline) {
        // Try NextAuth sign out first
        await nextAuthSignOut({ redirect: false })
        
        // Also sign out from Supabase
        await supabase.auth.signOut()
      }
      
      // Always perform offline sign out
      const token = localStorage.getItem('offlineAuthToken')
      if (token) {
        await offlineAuth.logoutUser(token)
        localStorage.removeItem('offlineAuthToken')
      }
      
      // Reset state
      setSession(null)
      setUser(null)
      setUserDetails(null)
      
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  // Sync sessions between NextAuth, Supabase, and offline storage
  const syncAuthStates = async () => {
    if (!isOnline) return
    
    const token = localStorage.getItem('offlineAuthToken')
    
    // If we have an offline session but we're now online, try to sync it
    if (token && !nextAuthSession && !session) {
      const offlineUser = await offlineAuth.verifySession(token)
      if (offlineUser) {
        console.log('Syncing offline session to online state...')
        // Implement your sync strategy here
        
        // Basic example: try to sign in using credentials
        // This might need additional logic in a real app
        try {
          await offlineAuth.syncOfflineUsers()
        } catch (error) {
          console.error('Failed to sync offline auth:', error)
        }
      }
    }
  }

  // Listen for auth changes
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true)

        // Check if we have a NextAuth session
        if (nextAuthSession?.user) {
          const nextAuthUser = nextAuthSession.user as any
          setUserDetails({
            id: nextAuthUser.id,
            email: nextAuthUser.email || '',
            name: nextAuthUser.name || '',
            role: nextAuthUser.role || 'staff',
            department: nextAuthUser.department
          })
          setIsLoading(false)
          return
        }
        
        // If online, check Supabase
        if (isOnline) {
          // Get initial session
          const { data } = await supabase.auth.getSession()
          setSession(data.session)
          setUser(data.session?.user || null)

          if (data.session?.user) {
            const details = await fetchUserDetails(data.session.user.id)
            setUserDetails(details)
          }

          // Set up auth state change listener
          const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            setSession(newSession)
            setUser(newSession?.user || null)

            if (newSession?.user) {
              const details = await fetchUserDetails(newSession.user.id)
              setUserDetails(details)
            } else {
              setUserDetails(null)
            }
          })

          return () => {
            authListener.subscription.unsubscribe()
          }
        } else {
          // In offline mode, try to restore session from local storage
          const token = localStorage.getItem('offlineAuthToken')
          if (token) {
            const offlineUser = await offlineAuth.verifySession(token)
            if (offlineUser) {
              setUserDetails({
                id: offlineUser.id,
                email: offlineUser.email,
                name: offlineUser.name,
                role: offlineUser.role,
                department: offlineUser.department
              })
            } else {
              // If session is invalid, clear it
              localStorage.removeItem('offlineAuthToken')
            }
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [nextAuthSession, isOnline])
  
  // Sync auth state when online status changes
  useEffect(() => {
    if (isOnline) {
      syncAuthStates()
    }
  }, [isOnline])

  const value = {
    user,
    userDetails,
    session,
    isLoading,
    isOnline,
    signIn,
    signOut,
    refreshSession,
    hasPermission,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthContextProvider>{children}</AuthContextProvider>
    </SessionProvider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
