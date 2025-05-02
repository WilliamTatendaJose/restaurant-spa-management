"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"

export function GeneralSettings() {
  const { toast } = useToast()
  const [settings, setSettings] = useState({
    language: "en",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    enableNotifications: true,
    enableSounds: true,
  })

  const handleSelectChange = (name: string, value: string) => {
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setSettings((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSave = () => {
    // In a real app, this would save to SQLite
    console.log("Saving general settings:", settings)

    toast({
      title: "Settings saved",
      description: "Your general settings have been updated successfully.",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>Configure your application preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="language">Language</Label>
            <Select value={settings.language} onValueChange={(value) => handleSelectChange("language", value)}>
              <SelectTrigger id="language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={settings.timezone} onValueChange={(value) => handleSelectChange("timezone", value)}>
              <SelectTrigger id="timezone">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="EST">Eastern Time (EST)</SelectItem>
                <SelectItem value="CST">Central Time (CST)</SelectItem>
                <SelectItem value="MST">Mountain Time (MST)</SelectItem>
                <SelectItem value="PST">Pacific Time (PST)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="dateFormat">Date Format</Label>
            <Select value={settings.dateFormat} onValueChange={(value) => handleSelectChange("dateFormat", value)}>
              <SelectTrigger id="dateFormat">
                <SelectValue placeholder="Select date format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="timeFormat">Time Format</Label>
            <Select value={settings.timeFormat} onValueChange={(value) => handleSelectChange("timeFormat", value)}>
              <SelectTrigger id="timeFormat">
                <SelectValue placeholder="Select time format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                <SelectItem value="24h">24-hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="enableNotifications">Enable Notifications</Label>
            <Switch
              id="enableNotifications"
              checked={settings.enableNotifications}
              onCheckedChange={(checked) => handleSwitchChange("enableNotifications", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="enableSounds">Enable Sounds</Label>
            <Switch
              id="enableSounds"
              checked={settings.enableSounds}
              onCheckedChange={(checked) => handleSwitchChange("enableSounds", checked)}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSave}>Save Changes</Button>
      </CardFooter>
    </Card>
  )
}
