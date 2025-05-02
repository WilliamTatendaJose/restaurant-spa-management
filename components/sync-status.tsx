"use client"

import { useSyncStatus } from "@/components/sync-status-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Cloud, CloudOff, RefreshCw } from "lucide-react"
import { useState } from "react"
import { isSupabaseConfigured } from "@/lib/supabase"

export function SyncStatus() {
  const { isOnline, pendingChanges, sync, lastSyncTime } = useSyncStatus()
  const [isSyncing, setIsSyncing] = useState(false)
  const supabaseConfigured = isSupabaseConfigured()

  const handleSync = async () => {
    if (isSyncing || !isOnline || pendingChanges === 0 || !supabaseConfigured) return

    setIsSyncing(true)
    try {
      await sync()
    } finally {
      setIsSyncing(false)
    }
  }

  const formatLastSync = () => {
    if (!lastSyncTime) return "Never synced"

    // If synced today, show time
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const syncDate = new Date(lastSyncTime)

    if (syncDate >= today) {
      return `Last sync: Today at ${syncDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    }

    // If synced yesterday
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (syncDate >= yesterday) {
      return `Last sync: Yesterday at ${syncDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    }

    // Otherwise show date
    return `Last sync: ${syncDate.toLocaleDateString()}`
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Badge
                variant="outline"
                className={`gap-1 ${supabaseConfigured ? "border-green-500 text-green-500" : "border-amber-500 text-amber-500"}`}
              >
                <Cloud className="h-3 w-3" />
                {supabaseConfigured ? "Online" : "Local Only"}
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 border-amber-500 text-amber-500">
                <CloudOff className="h-3 w-3" />
                Offline
                {pendingChanges > 0 && ` (${pendingChanges})`}
              </Badge>
            )}

            {isOnline && supabaseConfigured && pendingChanges > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleSync}
                disabled={isSyncing}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? "animate-spin" : ""}`} />
                Sync ({pendingChanges})
              </Button>
            )}

            {lastSyncTime && (
              <span className="text-xs text-muted-foreground hidden md:inline-block">{formatLastSync()}</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {isOnline
            ? supabaseConfigured
              ? pendingChanges > 0
                ? `${pendingChanges} changes pending synchronization`
                : "Connected to server - all changes are synced"
              : "Working in local mode - Supabase not configured"
            : `Working offline - ${pendingChanges} changes will sync when connection is restored`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
