"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BusinessSettings } from "@/components/settings/business-settings";
import { GeneralSettings } from "@/components/settings/general-settings";
import { UserSettings } from "@/components/settings/user-settings";
import { SyncSettings } from "@/components/settings/sync-settings";
import { ZIMRASettings } from "@/components/settings/zimra-settings";
import { useAuth } from "@/lib/auth-context";

export function SettingsTabs() {
  const [activeTab, setActiveTab] = useState("general");
  const { hasPermission } = useAuth();

  // Only admin can access user management
  const canManageUsers = hasPermission("admin");

  // Only managers and admins can access ZIMRA settings
  const canAccessZIMRA = hasPermission("manager");

  // Calculate grid columns based on permissions
  const getGridCols = () => {
    let cols = 3; // general, business, database
    if (canManageUsers) cols++;
    if (canAccessZIMRA) cols++;
    return `grid-cols-${cols}`;
  };

  return (
    <Tabs
      defaultValue="general"
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full"
    >
      <TabsList className={`grid w-full ${getGridCols()}`}>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="business">Business</TabsTrigger>
        {canManageUsers && (
          <TabsTrigger value="users">User Management</TabsTrigger>
        )}
        {canAccessZIMRA && <TabsTrigger value="zimra">ZIMRA</TabsTrigger>}
        <TabsTrigger value="database">Database</TabsTrigger>
      </TabsList>
      <div className="mt-6">
        <TabsContent value="general" className="space-y-4">
          <GeneralSettings />
        </TabsContent>
        <TabsContent value="business" className="space-y-4">
          <BusinessSettings />
        </TabsContent>
        {canManageUsers && (
          <TabsContent value="users" className="space-y-4">
            <UserSettings />
          </TabsContent>
        )}
        {canAccessZIMRA && (
          <TabsContent value="zimra" className="space-y-4">
            <ZIMRASettings />
          </TabsContent>
        )}
        <TabsContent value="database" className="space-y-4">
          <SyncSettings />
        </TabsContent>
      </div>
    </Tabs>
  );
}
