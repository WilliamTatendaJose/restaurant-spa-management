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
}

const SyncStatusContext = createContext<SyncStatusContextType>({
  isOnline: true,
  pendingChanges: 0,
  sync: async () => ({ success: true, count: 0 }),
  lastSyncTime: null,
})

export function SyncStatusProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingChanges, setPendingChanges] = useState(0)
  const [isDbInitialized, setIsDbInitialized] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

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
    if (!isDbInitialized || !isOnline || isSyncing || !isSupabaseConfigured()) return

    // Auto-sync if there are pending changes and we're online
    const autoSync = async () => {
      try {
        if (pendingChanges > 0) {
          await performSync()
        } else {
          // If no pending changes, just pull from server
          await performPull()
        }
      } catch (error) {
        console.error("Auto-sync error:", error)
        // Don't show toast for auto-sync errors to avoid spamming the user
      }
    }

    // Set up interval for auto-sync
    const interval = setInterval(autoSync, 60000) // Every minute

    return () => clearInterval(interval)
  }, [isDbInitialized, isOnline, pendingChanges, isSyncing])

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

  // Function to perform sync
  const performSync = async () => {
    if (!isOnline || isSyncing || !isSupabaseConfigured()) {
      return { success: false, error: "Cannot sync at this time" }
    }

    setIsSyncing(true)
    try {
      // First push local changes to server
      const pushResult = await syncWithSupabase()

      // Then pull changes from server
      const pullResult = await pullFromSupabase()

      // Update pending changes count
      setPendingChanges(getPendingChangesCount())

      // Update last sync time
      setLastSyncTime(new Date())

      return {
        success: pushResult.success && pullResult.success,
        count: (pushResult.count || 0) + (pullResult.count || 0),
        error: pushResult.error || pullResult.error,
      }
    } catch (error) {
      console.error("Sync error:", error)
      return { success: false, error: String(error) }
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
    try {
      // Pull changes from server
      const result = await pullFromSupabase()

      // Update last sync time
      setLastSyncTime(new Date())

      return result
    } catch (error) {
      console.error("Pull error:", error)
      return { success: false, error: String(error) }
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
    <SyncStatusContext.Provider value={{ isOnline, pendingChanges, sync, lastSyncTime }}>
      {children}
    </SyncStatusContext.Provider>
  )
}

export const useSyncStatus = () => useContext(SyncStatusContext)
