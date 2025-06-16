"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  databaseSync,
  resetAndResync,
  manualSync,
  getSyncStatus,
} from "@/lib/sync-script";

interface ConflictData {
  id: string;
  type: "transaction" | "customer" | "spa_service" | "menu_item";
  localData: any;
  serverData: any;
  timestamp: Date;
}

interface SyncStatusContextType {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingChanges: number;
  syncProgress: number;
  connectionQuality: "good" | "poor" | "offline";
  conflicts: ConflictData[];
  schemaErrors?: string[];
  sync?: () => Promise<{ success: boolean; count?: number; error?: string }>;
  triggerSync: () => Promise<void>;
  resetDatabase?: () => Promise<void>;
  resetSchemaErrors?: () => void;
  getConnectionStatus: () => string;
  resolveConflict: (
    id: string,
    resolution: "local" | "server" | "merge",
    mergedData?: any
  ) => Promise<void>;
  resolveAllConflicts: (resolution: "local" | "server") => Promise<void>;
}

const SyncStatusContext = createContext<SyncStatusContextType | undefined>(
  undefined
);

export function useSyncStatus() {
  const context = useContext(SyncStatusContext);
  if (context === undefined) {
    throw new Error("useSyncStatus must be used within a SyncStatusProvider");
  }
  return context;
}

interface SyncStatusProviderProps {
  children: React.ReactNode;
}

export function SyncStatusProvider({ children }: SyncStatusProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [syncProgress, setSyncProgress] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<
    "good" | "poor" | "offline"
  >("good");
  const [conflicts, setConflicts] = useState<ConflictData[]>([]);
  const [schemaErrors, setSchemaErrors] = useState<string[]>([]);

  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  // Helper function to get unsynced records count
  const getUnsyncedCount = async () => {
    if (!user) return 0; // No user, no pending changes

    try {
      const { listRecords } = await import("@/lib/db");
      const tables = [
        "menu_items",
        "spa_services",
        "transactions",
        "customers",
        "bookings",
        "inventory",
        "staff",
      ];

      let total = 0;
      for (const table of tables) {
        try {
          const unsynced = await listRecords(table, { is_synced: 0 });
          total += unsynced.length;
        } catch (error) {
          console.error(`Error counting unsynced ${table}:`, error);
        }
      }
      return total;
    } catch (error) {
      console.error("Error counting unsynced records:", error);
      return 0;
    }
  };

  // Enhanced sync function with better error handling
  const sync = useCallback(async (): Promise<{
    success: boolean;
    count?: number;
    error?: string;
  }> => {
    if (!user) {
      return { success: false, error: "Please sign in to sync data" };
    }

    if (isSyncing || !isOnline) {
      return { success: false, error: "Sync not possible" };
    }

    setIsSyncing(true);
    setSyncProgress(0);

    try {
      // Suppress toast notifications during sync to avoid spam
      databaseSync.suppressToasts(10000);

      setSyncProgress(25);
      const result = await manualSync();
      setSyncProgress(75);

      if (result.success) {
        setLastSyncTime(new Date());
        setSyncProgress(100);

        // Update pending changes count
        setTimeout(async () => {
          const count = await getUnsyncedCount();
          setPendingChanges(count);
        }, 1000);

        return { success: true, count: result.count };
      } else {
        console.error("Sync failed:", result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Sync error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown sync error",
      };
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  }, [isSyncing, isOnline, user]);

  // Enhanced reset and resync function
  const fullReset = useCallback(async (): Promise<{
    success: boolean;
    count?: number;
    error?: string;
  }> => {
    if (!user) {
      return { success: false, error: "Please sign in to reset and sync data" };
    }

    if (isSyncing) {
      return { success: false, error: "Sync already in progress" };
    }

    setIsSyncing(true);
    setSyncProgress(0);

    try {
      // Suppress toasts during reset
      databaseSync.suppressToasts(15000);

      setSyncProgress(10);
      const result = await resetAndResync();
      setSyncProgress(90);

      if (result.success) {
        setLastSyncTime(new Date());
        setPendingChanges(0); // Reset should clear all pending changes
        setSyncProgress(100);

        return { success: true, count: result.count };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Reset and resync error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Reset failed",
      };
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  }, [isSyncing, user]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionQuality("good");
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionQuality("offline");
    };

    // Set initial state
    setIsOnline(navigator.onLine);
    setConnectionQuality(navigator.onLine ? "good" : "offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Count pending changes when user changes or on startup
  useEffect(() => {
    if (!authLoading) {
      const loadInitialData = async () => {
        const count = await getUnsyncedCount();
        setPendingChanges(count);
      };

      loadInitialData();
    }
  }, [user, authLoading]);

  // Auto-sync when coming online (only if user is authenticated)
  useEffect(() => {
    if (user && isOnline && !isSyncing && pendingChanges > 0) {
      const autoSyncTimer = setTimeout(() => {
        console.log("Auto-syncing after coming online...");
        sync().catch((error) => console.error("Auto-sync failed:", error));
      }, 2000); // 2 second delay

      return () => clearTimeout(autoSyncTimer);
    }
  }, [isOnline, isSyncing, pendingChanges, sync, user]);

  const triggerSync = useCallback(async () => {
    const result = await sync();

    // Only show toast for manual triggers and if not suppressed
    if (!getSyncStatus().suppressToasts) {
      if (result.success) {
        toast({
          title: "Sync completed",
          description: result.count
            ? `${result.count} items synchronized`
            : "All data is up to date",
        });
      } else {
        toast({
          title: "Sync failed",
          description: result.error || "Unable to sync with server",
          variant: "destructive",
        });
      }
    }
  }, [sync, toast]);

  // Reset function for UI
  const resetDatabase = useCallback(async () => {
    const result = await fullReset();

    if (result.success) {
      toast({
        title: "Database reset",
        description: `Database reset and ${result.count} items synchronized`,
      });
    } else {
      toast({
        title: "Reset failed",
        description: result.error || "Unable to reset database",
        variant: "destructive",
      });
    }
  }, [fullReset, toast]);

  const resetSchemaErrors = useCallback(() => {
    setSchemaErrors([]);
  }, []);

  const getConnectionStatus = () => {
    if (!user) return "Not signed in";
    if (!isOnline) return "Offline";
    switch (connectionQuality) {
      case "good":
        return "Online";
      case "poor":
        return "Online (Slow)";
      default:
        return "Offline";
    }
  };

  // Simplified conflict resolution (for future enhancement)
  const resolveConflict = async (
    id: string,
    resolution: "local" | "server" | "merge",
    mergedData?: any
  ) => {
    console.log(`Resolving conflict ${id} with ${resolution}`, mergedData);
    // Remove resolved conflict
    setConflicts((prev) => prev.filter((c) => c.id !== id));
  };

  const resolveAllConflicts = async (resolution: "local" | "server") => {
    console.log(`Resolving all conflicts with ${resolution}`);
    setConflicts([]);
  };

  const value: SyncStatusContextType = {
    isOnline,
    isSyncing,
    lastSyncTime,
    pendingChanges,
    syncProgress,
    connectionQuality,
    conflicts,
    schemaErrors,
    sync,
    triggerSync,
    resetDatabase,
    resetSchemaErrors,
    getConnectionStatus,
    resolveConflict,
    resolveAllConflicts,
  };

  return (
    <SyncStatusContext.Provider value={value}>
      {children}
    </SyncStatusContext.Provider>
  );
}
