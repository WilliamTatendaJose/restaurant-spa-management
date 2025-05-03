"use client"

import { useSyncStatus } from "@/components/sync-status-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Cloud, CloudOff, RefreshCw, XCircle, Clock, Database } from "lucide-react"
import { useState } from "react"
import { isSupabaseConfigured } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export function SyncStatus() {
  const { 
    isOnline, 
    pendingChanges, 
    sync, 
    lastSyncTime, 
    syncError, 
    isSyncing: syncInProgress,
    schemaErrors,
    disableAutoSync,
    toggleAutoSync
  } = useSyncStatus()
  
  const [isManualSyncing, setIsManualSyncing] = useState(false)
  const [showError, setShowError] = useState(false)
  const supabaseConfigured = isSupabaseConfigured()
  const router = useRouter()
  
  const handleSync = async () => {
    if (isManualSyncing || syncInProgress || !isOnline || !supabaseConfigured) return
    setIsManualSyncing(true)
    setShowError(false)
    
    try {
      const result = await sync()
      if (!result.success && result.error) {
        setShowError(true)
      }
    } finally {
      setIsManualSyncing(false)
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
  
  const isSyncing = isManualSyncing || syncInProgress;
  
  return (
    <div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Badge
                  variant="outline"
                  className={`gap-1 ${schemaErrors ? "border-red-500 text-red-500" : supabaseConfigured ? "border-green-500 text-green-500" : "border-amber-500 text-amber-500"}`}
                >
                  {schemaErrors ? (
                    <>
                      <Database className="h-3 w-3" />
                      Schema Mismatch
                    </>
                  ) : (
                    <>
                      <Cloud className="h-3 w-3" />
                      {supabaseConfigured ? "Online" : "Local Only"}
                    </>
                  )}
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 border-amber-500 text-amber-500">
                  <CloudOff className="h-3 w-3" />
                  Offline
                  {pendingChanges > 0 && ` (${pendingChanges})`}
                </Badge>
              )}
              
              {isOnline && supabaseConfigured && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-7 px-2 text-xs ${disableAutoSync ? "border-amber-500 text-amber-500" : ""}`}
                    onClick={toggleAutoSync}
                    title={disableAutoSync ? "Enable auto-sync" : "Disable auto-sync"}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {disableAutoSync ? "Auto: Off" : "Auto: On"}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={handleSync}
                    disabled={isSyncing}
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? "animate-spin" : ""}`} />
                    {pendingChanges > 0 ? `Sync (${pendingChanges})` : "Sync"}
                  </Button>
                </>
              )}
              
              {lastSyncTime && (
                <span className="text-xs text-muted-foreground hidden md:inline-block">
                  {formatLastSync()}
                </span>
              )}
              
              {schemaErrors && isOnline && supabaseConfigured && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs border-red-500 text-red-500"
                  onClick={() => router.push('/settings/database')}
                >
                  <Database className="h-3 w-3 mr-1" />
                  Fix Schema
                </Button>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {isOnline
              ? supabaseConfigured
                ? schemaErrors
                  ? "Database schema mismatch detected - sync is failing"
                  : pendingChanges > 0
                    ? `${pendingChanges} changes pending synchronization`
                    : "Connected to server - all changes are synced"
                : "Working in local mode - Supabase not configured"
              : `Working offline - ${pendingChanges} changes will sync when connection is restored`}
            {syncError && (
              <div className="mt-1 text-red-400 text-xs">
                Last sync error - click sync button to see details
              </div>
            )}
            {disableAutoSync && (
              <div className="mt-1 text-amber-400 text-xs">
                Automatic synchronization is disabled
              </div>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {(showError && syncError) && (
        <Alert variant="destructive" className="mt-2 py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs flex items-center justify-between">
            <span>{syncError}</span>
            <XCircle 
              className="h-4 w-4 cursor-pointer" 
              onClick={() => setShowError(false)}
            />
          </AlertDescription>
        </Alert>
      )}
      
      {schemaErrors && showError && (
        <Alert variant="destructive" className="mt-2 py-2">
          <Database className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <span>Database schema mismatch detected. Go to </span>
            <button 
              className="underline font-medium"
              onClick={() => router.push('/settings/database')}
            >
              Settings → Database
            </button>
            <span> to fix it.</span>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
