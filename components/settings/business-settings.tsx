"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

export function BusinessSettings() {
  const { toast } = useToast()
  const [settings, setSettings] = useState({
    businessName: "Spa & Bistro",
    address: "123 Relaxation Ave, Serenity, CA 90210",
    phone: "(555) 123-4567",
    email: "info@spaandbistro.com",
    website: "www.spaandbistro.com",
    taxRate: "8.5",
    openingHours: "Monday-Friday: 9am-9pm\nSaturday-Sunday: 10am-8pm",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    // In a real app, this would save to SQLite
    console.log("Saving business settings:", settings)

    toast({
      title: "Settings saved",
      description: "Your business settings have been updated successfully.",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Settings</CardTitle>
        <CardDescription>Configure your business information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="businessName">Business Name</Label>
          <Input
            id="businessName"
            name="businessName"
            value={settings.businessName}
            onChange={handleChange}
            placeholder="Enter business name"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            name="address"
            value={settings.address}
            onChange={handleChange}
            placeholder="Enter business address"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              value={settings.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={settings.email}
              onChange={handleChange}
              placeholder="Enter email address"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              value={settings.website}
              onChange={handleChange}
              placeholder="Enter website URL"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="taxRate">Tax Rate (%)</Label>
            <Input
              id="taxRate"
              name="taxRate"
              type="number"
              min="0"
              step="0.1"
              value={settings.taxRate}
              onChange={handleChange}
              placeholder="Enter tax rate"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="openingHours">Opening Hours</Label>
          <Textarea
            id="openingHours"
            name="openingHours"
            value={settings.openingHours}
            onChange={handleChange}
            placeholder="Enter opening hours"
            rows={3}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSave}>Save Changes</Button>
      </CardFooter>
    </Card>
  )
}
