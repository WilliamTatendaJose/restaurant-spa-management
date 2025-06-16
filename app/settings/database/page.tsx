"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { useSyncStatus } from "@/components/sync-status-provider"
import { 
  Database, 
  RefreshCw, 
  Trash2, 
  Download, 
  Upload, 
  AlertCircle, 
  CheckCircle,
  Loader2
} from "lucide-react"
import { isSupabaseConfigured } from "@/lib/supabase"
import { resetAndResync, manualSync, pushChanges, pullChanges } from "@/lib/sync-script"

export default function DatabaseSettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ 
    success: boolean; 
    message?: string; 
    error?: string; 
    count?: number;
    details?: any;
  } | null>(null)
  
  const { toast } = useToast()
  const { 
    isOnline, 
    isSyncing, 
    pendingChanges, 
    lastSyncTime,
    resetSchemaErrors 
  } = useSyncStatus()
  
  const isConfigured = isSupabaseConfigured()

  const runOperation = async (operation: () => Promise<any>, operationName: string) => {
    setIsLoading(true)
    setResult(null)

    try {
      const operationResult = await operation()
      setResult({
        success: operationResult.success,
        message: operationResult.success 
          ? `${operationName} completed successfully` 
          : `${operationName} failed`,
        error: operationResult.error,
        count: operationResult.count,
        details: operationResult.details
      })
      
      if (operationResult.success) {
        resetSchemaErrors?.()
        
        toast({
          title: `${operationName} completed`,
          description: operationResult.count 
            ? `${operationResult.count} items processed`
            : "Operation completed successfully",
        })
      } else {
        toast({
          title: `${operationName} failed`,
          description: operationResult.error || "Operation failed",
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setResult({
        success: false,
        error: errorMessage,
        message: `${operationName} failed`
      })
      
      toast({
        title: `${operationName} failed`,
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFullReset = () => runOperation(resetAndResync, "Database reset and resync")
  const handleManualSync = () => runOperation(manualSync, "Manual sync")
  const handlePushChanges = () => runOperation(pushChanges, "Push local changes")
  const handlePullChanges = () => runOperation(pullChanges, "Pull server changes")

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Database Settings</h1>
          <p className="text-muted-foreground">
            Manage database synchronization and troubleshoot sync issues
          </p>
        </div>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Internet Connection</p>
                <Badge variant={isOnline ? "default" : "destructive"}>
                  {isOnline ? "Online" : "Offline"}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Supabase Configuration</p>
                <Badge variant={isConfigured ? "default" : "destructive"}>
                  {isConfigured ? "Configured" : "Not Configured"}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Pending Changes</p>
                <Badge variant={pendingChanges > 0 ? "secondary" : "outline"}>
                  {pendingChanges} items
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Last Sync</p>
                <p className="text-sm text-muted-foreground">
                  {lastSyncTime 
                    ? lastSyncTime.toLocaleString() 
                    : "Never synced"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sync Operations */}
        <Card>
          <CardHeader>
            <CardTitle>Sync Operations</CardTitle>
            <CardDescription>
              Manual synchronization controls to resolve sync issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isConfigured && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Supabase is not configured. Please set up your environment variables first.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleManualSync}
                disabled={!isOnline || isSyncing || isLoading || !isConfigured}
                className="h-auto p-4 flex-col gap-2"
              >
                {(isSyncing || isLoading) ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <RefreshCw className="h-5 w-5" />
                )}
                <span className="font-medium">Bidirectional Sync</span>
                <span className="text-xs opacity-75">
                  Push local changes and pull server updates
                </span>
              </Button>

              <Button
                onClick={handlePushChanges}
                disabled={!isOnline || isSyncing || isLoading || !isConfigured || pendingChanges === 0}
                variant="outline"
                className="h-auto p-4 flex-col gap-2"
              >
                <Upload className="h-5 w-5" />
                <span className="font-medium">Push Changes</span>
                <span className="text-xs opacity-75">
                  Upload local changes to server
                </span>
              </Button>

              <Button
                onClick={handlePullChanges}
                disabled={!isOnline || isSyncing || isLoading || !isConfigured}
                variant="outline"
                className="h-auto p-4 flex-col gap-2"
              >
                <Download className="h-5 w-5" />
                <span className="font-medium">Pull Changes</span>
                <span className="text-xs opacity-75">
                  Download server updates
                </span>
              </Button>

              <Button
                onClick={handleFullReset}
                disabled={!isOnline || isSyncing || isLoading || !isConfigured}
                variant="destructive"
                className="h-auto p-4 flex-col gap-2"
              >
                <Trash2 className="h-5 w-5" />
                <span className="font-medium">Reset Database</span>
                <span className="text-xs opacity-75">
                  Clear local data and resync from server
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Operation Result */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                )}
                Operation Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant={result.success ? "default" : "destructive"}>
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">{result.message}</p>
                    {result.count !== undefined && (
                      <p>Items processed: {result.count}</p>
                    )}
                    {result.error && (
                      <p className="text-sm opacity-75">Error: {result.error}</p>
                    )}
                    {result.details?.tables && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Table Details:</p>
                        <ul className="text-sm opacity-75 ml-4">
                          {Object.entries(result.details.tables).map(([table, info]: [string, any]) => (
                            <li key={table}>
                              {table}: {info.count || 0} items
                              {info.error && ` (Error: ${info.error})`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Troubleshooting Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <p><strong>Sync Issues:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Try "Bidirectional Sync" first to resolve most sync conflicts</li>
                <li>If data appears inconsistent, use "Reset Database" to get a fresh copy from server</li>
                <li>Use "Push Changes" when you have local changes that need to be uploaded</li>
                <li>Use "Pull Changes" to get the latest data from server without uploading local changes</li>
              </ul>
              
              <p className="mt-4"><strong>Authentication Issues:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Make sure you're logged in to sync with the server</li>
                <li>User authentication works across browsers, but data sync requires login</li>
                <li>If sync fails with "Authentication required", try logging out and back in</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
