"use client"

import { Badge } from "@/components/ui/badge"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useSyncStatus } from "@/components/sync-status-provider"
import { RefreshCw, Database, Server } from "lucide-react"
import { isSupabaseConfigured } from "@/lib/supabase"

export function SyncSettings() {
  const { toast } = useToast()
  const { isOnline, pendingChanges, sync, lastSyncTime, isSyncing: isGlobalSyncing } = useSyncStatus()
  const [localSyncing, setLocalSyncing] = useState(false)
  const [settings, setSettings] = useState({
    autoSync: true,
    syncInterval: "15",
    syncOnStartup: true,
    syncWhenOnline: true,
  })
  const supabaseConfigured = isSupabaseConfigured()

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem("syncSettings")
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (e) {
        console.error("Error loading sync settings:", e)
      }
    }
  }, [])

  const handleSelectChange = (name: string, value: string) => {
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setSettings((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSave = () => {
    // Save settings to localStorage
    localStorage.setItem("syncSettings", JSON.stringify(settings))

    toast({
      title: "Settings saved",
      description: "Your synchronization settings have been updated successfully.",
    })
  }

  const handleManualSync = async () => {
    if (localSyncing || isGlobalSyncing || !isOnline || !supabaseConfigured) {
      toast({
        title: "Sync not possible",
        description: isGlobalSyncing 
          ? "A sync operation is already in progress" 
          : !isOnline 
          ? "You are currently offline"
          : !supabaseConfigured
          ? "Database is not configured"
          : "Cannot sync at this time",
        variant: "destructive",
      });
      return;
    }

    setLocalSyncing(true);
    try {
      const result = await sync();
      if (result.success) {
        toast({
          title: "Sync complete",
          description: result.count 
            ? `Successfully synchronized ${result.count} changes with the server.`
            : "All data is up to date.",
        });
      } else {
        toast({
          title: "Sync failed",
          description: result.error || "Failed to synchronize with the server.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Sync error",
        description: error instanceof Error ? error.message : "An unexpected error occurred during synchronization.",
        variant: "destructive",
      });
    } finally {
      setLocalSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Synchronization Settings</CardTitle>
        <CardDescription>Configure database synchronization options</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="syncInterval">Sync Interval (minutes)</Label>
            <Select value={settings.syncInterval} onValueChange={(value) => handleSelectChange("syncInterval", value)}>
              <SelectTrigger id="syncInterval">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Manual Sync</Label>
            <Button
              onClick={handleManualSync}
              disabled={!isOnline || localSyncing || isGlobalSyncing || !supabaseConfigured || pendingChanges === 0}
              className="w-full"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${localSyncing ? "animate-spin" : ""}`} />
              {localSyncing ? "Syncing..." : pendingChanges > 0 ? `Sync Now (${pendingChanges} changes)` : "Sync Now"}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoSync">Automatic Sync</Label>
              <p className="text-sm text-muted-foreground">Automatically sync at regular intervals</p>
            </div>
            <Switch
              id="autoSync"
              checked={settings.autoSync}
              onCheckedChange={(checked) => handleSwitchChange("autoSync", checked)}
              disabled={!supabaseConfigured}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="syncOnStartup">Sync on Startup</Label>
              <p className="text-sm text-muted-foreground">Sync when the application starts</p>
            </div>
            <Switch
              id="syncOnStartup"
              checked={settings.syncOnStartup}
              onCheckedChange={(checked) => handleSwitchChange("syncOnStartup", checked)}
              disabled={!supabaseConfigured}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="syncWhenOnline">Sync When Online</Label>
              <p className="text-sm text-muted-foreground">Automatically sync when connection is restored</p>
            </div>
            <Switch
              id="syncWhenOnline"
              checked={settings.syncWhenOnline}
              onCheckedChange={(checked) => handleSwitchChange("syncWhenOnline", checked)}
              disabled={!supabaseConfigured}
            />
          </div>
        </div>

        <div className="rounded-md border p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold">Local Database</h4>
              <p className="text-sm text-muted-foreground">IndexedDB database stored on this device</p>
            </div>
            <Badge variant="outline">Connected</Badge>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Server className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold">Supabase Database</h4>
              <p className="text-sm text-muted-foreground">Remote PostgreSQL database</p>
            </div>
            {supabaseConfigured ? (
              isOnline ? (
                <Badge variant="outline" className="border-green-500 text-green-500">
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="border-amber-500 text-amber-500">
                  Disconnected
                </Badge>
              )
            ) : (
              <Badge variant="outline" className="border-red-500 text-red-500">
                Not Configured
              </Badge>
            )}
          </div>

          {lastSyncTime && (
            <div className="mt-4 text-sm text-muted-foreground">Last synchronized: {lastSyncTime.toLocaleString()}</div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSave}>Save Changes</Button>
      </CardFooter>
    </Card>
  )
}
