"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { getPendingChangesCount, syncWithSupabase, pullFromSupabase, initDatabase, addSampleData } from "@/lib/db"
import { isSupabaseConfigured } from "@/lib/supabase"

interface SyncStatusContextType {
  isOnline: boolean
  pendingChanges: number
  sync: () => Promise<{ success: boolean; count?: number; error?: string }>
  lastSyncTime: Date | null
  syncError: string | null
  isSyncing: boolean
  schemaErrors: string[] | null
  disableAutoSync: boolean
  toggleAutoSync: () => void
  resetSchemaErrors: () => void
}

const SyncStatusContext = createContext<SyncStatusContextType>({
  isOnline: true,
  pendingChanges: 0,
  sync: async () => ({ success: true, count: 0 }),
  lastSyncTime: null,
  syncError: null,
  isSyncing: false,
  schemaErrors: null,
  disableAutoSync: false,
  toggleAutoSync: () => {},
  resetSchemaErrors: () => {}
})

export function SyncStatusProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingChanges, setPendingChanges] = useState(0)
  const [isDbInitialized, setIsDbInitialized] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [schemaErrors, setSchemaErrors] = useState<string[] | null>(null)
  const [disableAutoSync, setDisableAutoSync] = useState(false)

  // Initialize database once
  useEffect(() => {
    const initialize = async () => {
      try {
        const success = await initDatabase()
        if (success) {
          setIsDbInitialized(true)
          // Add sample data for demo purposes
          await addSampleData()
        }
      } catch (error) {
        console.error("Error initializing database:", error)
        setSyncError(`Database initialization error: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    initialize()
  }, [])

  // Check for pending changes periodically
  useEffect(() => {
    if (!isDbInitialized) return

    const checkPendingChanges = () => {
      try {
        const count = getPendingChangesCount()
        setPendingChanges(count)
      } catch (error) {
        console.error("Error checking pending changes:", error)
        // Don't set a UI error for this routine check
      }
    }

    // Initial check
    checkPendingChanges()

    // Set up interval for checking
    const interval = setInterval(checkPendingChanges, 5000)

    return () => clearInterval(interval)
  }, [isDbInitialized])

  // Set up auto-sync when online
  useEffect(() => {
    if (!isDbInitialized || !isOnline || isSyncing || !isSupabaseConfigured() || disableAutoSync) return

    // Auto-sync if there are pending changes and we're online
    const autoSync = async () => {
      try {
        // Clear previous errors on new sync attempt
        setSyncError(null)

        if (pendingChanges > 0) {
          await performSync()
        } else {
          // If no pending changes, just pull from server
          await performPull()
        }
      } catch (error) {
        console.error("Auto-sync error:", error)
        // Capture the error message but don't display a toast for auto-sync
        setSyncError(`Auto-sync error: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    // Set up interval for auto-sync
    const interval = setInterval(autoSync, 60000) // Every minute

    return () => clearInterval(interval)
  }, [isDbInitialized, isOnline, pendingChanges, isSyncing, disableAutoSync])

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine)

    // Set up event listeners for online/offline status
    const handleOnline = () => {
      setIsOnline(true)
      // Try to sync when we come back online
      if (isDbInitialized && isSupabaseConfigured()) {
        performSync()
      }
    }

    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [isDbInitialized])

  // Detect schema errors from sync errors
  const detectSchemaErrors = (error: string) => {
    const schemaErrorPatterns = [
      // Match column not found errors
      /Could not find the '([^']+)' column of '([^']+)'/i,
      // Match constraint violations
      /null value in column "([^"]+)" .*?violates not-null constraint/i,
      // Other schema-related error patterns can be added here
    ]
    
    for (const pattern of schemaErrorPatterns) {
      if (pattern.test(error)) {
        return true
      }
    }
    
    return false
  }

  // Parse schema error details
  const parseSchemaErrors = (error: string) => {
    // Extract table and column information from error message
    let match;
    
    // Check for "Could not find column" error
    match = error.match(/Could not find the '([^']+)' column of '([^']+)'/i)
    if (match) {
      const [_, column, table] = match
      return `Missing column: ${column} in table ${table}`
    }
    
    // Check for not-null constraint error
    match = error.match(/null value in column "([^"]+)" of relation "([^"]+)"/i)
    if (match) {
      const [_, column, table] = match
      return `Not-null constraint violated: ${column} in table ${table}`
    }
    
    return error
  }

  // Function to reset schema errors
  const resetSchemaErrors = () => {
    setSchemaErrors(null)
  }

  // Function to toggle auto sync
  const toggleAutoSync = () => {
    setDisableAutoSync(prev => !prev)
  }

  // Function to perform sync
  const performSync = async () => {
    if (!isOnline || isSyncing || !isSupabaseConfigured()) {
      return { success: false, error: "Cannot sync at this time" }
    }

    setIsSyncing(true)
    // Clear previous errors
    setSyncError(null)

    try {
      // First push local changes to server
      const pushResult = await syncWithSupabase()

      if (!pushResult.success) {
        // Handle specific push error
        const errorMsg = pushResult.error || "Unknown sync push error"
        setSyncError(errorMsg)
        
        // Detect if it's a schema-related error
        if (pushResult.error && detectSchemaErrors(pushResult.error)) {
          // Either create or append to schema errors list
          const newError = parseSchemaErrors(pushResult.error)
          setSchemaErrors(prev => {
            if (!prev) return [newError]
            if (!prev.includes(newError)) return [...prev, newError]
            return prev
          })
        }
        
        return { success: false, error: errorMsg }
      }

      // Then pull changes from server
      const pullResult = await pullFromSupabase()

      if (!pullResult.success) {
        // Handle specific pull error
        const errorMsg = pullResult.error || "Unknown sync pull error"
        setSyncError(errorMsg)
        
        // Detect if it's a schema-related error
        if (pullResult.error && detectSchemaErrors(pullResult.error)) {
          // Either create or append to schema errors list
          const newError = parseSchemaErrors(pullResult.error)
          setSchemaErrors(prev => {
            if (!prev) return [newError]
            if (!prev.includes(newError)) return [...prev, newError]
            return prev
          })
        }
        
        return { success: false, error: errorMsg }
      }

      // Update pending changes count
      setPendingChanges(getPendingChangesCount())

      // Update last sync time
      setLastSyncTime(new Date())

      return {
        success: true,
        count: (pushResult.count || 0) + (pullResult.count || 0),
      }
    } catch (error) {
      console.error("Sync error:", error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      setSyncError(errorMessage)
      
      // Check for schema errors in the thrown error too
      if (typeof errorMessage === 'string' && detectSchemaErrors(errorMessage)) {
        const newError = parseSchemaErrors(errorMessage)
        setSchemaErrors(prev => {
          if (!prev) return [newError]
          if (!prev.includes(newError)) return [...prev, newError]
          return prev
        })
      }
      
      return { success: false, error: errorMessage }
    } finally {
      setIsSyncing(false)
    }
  }

  // Function to pull changes from server
  const performPull = async () => {
    if (!isOnline || isSyncing || !isSupabaseConfigured()) {
      return { success: false, error: "Cannot pull at this time" }
    }

    setIsSyncing(true)
    // Clear previous errors
    setSyncError(null)

    try {
      // Pull changes from server
      const result = await pullFromSupabase()

      if (!result.success && result.error) {
        setSyncError(result.error)
        
        // Check for schema errors
        if (detectSchemaErrors(result.error)) {
          const newError = parseSchemaErrors(result.error)
          setSchemaErrors(prev => {
            if (!prev) return [newError]
            if (!prev.includes(newError)) return [...prev, newError]
            return prev
          })
        }
      }

      // Update last sync time
      setLastSyncTime(new Date())
      return result
    } catch (error) {
      console.error("Pull error:", error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      setSyncError(errorMessage)
      
      // Check for schema errors in the thrown error too
      if (typeof errorMessage === 'string' && detectSchemaErrors(errorMessage)) {
        const newError = parseSchemaErrors(errorMessage)
        setSchemaErrors(prev => {
          if (!prev) return [newError]
          if (!prev.includes(newError)) return [...prev, newError]
          return prev
        })
      }
      
      return { success: false, error: errorMessage }
    } finally {
      setIsSyncing(false)
    }
  }

  // Function to manually trigger sync
  const sync = async () => {
    if (!isOnline) {
      return { success: false, error: "Device is offline" }
    }

    if (!isDbInitialized) {
      return { success: false, error: "Database not initialized" }
    }

    if (!isSupabaseConfigured()) {
      return { success: false, error: "Supabase not configured" }
    }

    return performSync()
  }

  return (
    <SyncStatusContext.Provider
      value={{
        isOnline,
        pendingChanges,
        sync,
        lastSyncTime,
        syncError,
        isSyncing,
        schemaErrors,
        disableAutoSync,
        toggleAutoSync,
        resetSchemaErrors
      }}
    >
      {children}
    </SyncStatusContext.Provider>
  )
}

export const useSyncStatus = () => useContext(SyncStatusContext)
