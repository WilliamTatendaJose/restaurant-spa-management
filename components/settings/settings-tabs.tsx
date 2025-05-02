"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GeneralSettings } from "@/components/settings/general-settings"
import { BusinessSettings } from "@/components/settings/business-settings"
import { UserSettings } from "@/components/settings/user-settings"
import { SyncSettings } from "@/components/settings/sync-settings"
import { Button } from "@/components/ui/button"

export function SettingsTabs() {
  return (
    <Tabs defaultValue="general" className="space-y-4">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="business">Business</TabsTrigger>
        <TabsTrigger value="users">Users</TabsTrigger>
        <TabsTrigger value="sync">Sync</TabsTrigger>
        <TabsTrigger value="database">Database</TabsTrigger>
      </TabsList>
      <TabsContent value="general">
        <GeneralSettings />
      </TabsContent>
      <TabsContent value="business">
        <BusinessSettings />
      </TabsContent>
      <TabsContent value="users">
        <UserSettings />
      </TabsContent>
      <TabsContent value="sync">
        <SyncSettings />
      </TabsContent>
      <TabsContent value="database">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Database Settings</h3>
            <p className="text-sm text-muted-foreground">Manage your database configuration and run migrations.</p>
          </div>
          <div className="border rounded-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Database Migration</h4>
                <p className="text-sm text-muted-foreground">
                  Run database migration to set up required tables and columns
                </p>
              </div>
              <Button variant="outline" asChild>
                <a href="/settings/database">Manage</a>
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
