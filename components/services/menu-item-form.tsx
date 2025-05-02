"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { useSyncStatus } from "@/components/sync-status-provider"

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  dietary: string[]
  isAvailable: boolean
}

interface MenuItemFormProps {
  menuItem?: MenuItem
}

export function MenuItemForm({ menuItem }: MenuItemFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { isOnline } = useSyncStatus()

  const [formData, setFormData] = useState({
    name: menuItem?.name || "",
    description: menuItem?.description || "",
    price: menuItem?.price?.toString() || "",
    category: menuItem?.category || "food",
    isAvailable: menuItem?.isAvailable ?? true,
  })

  const [dietary, setDietary] = useState<string[]>(menuItem?.dietary || [])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleDietaryChange = (value: string, checked: boolean) => {
    if (checked) {
      setDietary((prev) => [...prev, value])
    } else {
      setDietary((prev) => prev.filter((item) => item !== value))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // In a real app, this would save to SQLite
      console.log("Saving menu item:", { ...formData, dietary })

      toast({
        title: menuItem ? "Menu item updated" : "Menu item created",
        description: isOnline
          ? "The menu item has been successfully saved."
          : "The menu item has been saved offline and will sync when connection is restored.",
      })

      router.push("/services/restaurant")
    } catch (error) {
      console.error("Error saving menu item:", error)
      toast({
        title: "Error",
        description: "Failed to save menu item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter item name"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter item description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="drinks">Drinks</SelectItem>
                    <SelectItem value="desserts">Desserts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Dietary Options</Label>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="vegetarian"
                    checked={dietary.includes("vegetarian")}
                    onCheckedChange={(checked) => handleDietaryChange("vegetarian", checked)}
                  />
                  <Label htmlFor="vegetarian">Vegetarian</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="vegan"
                    checked={dietary.includes("vegan")}
                    onCheckedChange={(checked) => handleDietaryChange("vegan", checked)}
                  />
                  <Label htmlFor="vegan">Vegan</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="gluten-free"
                    checked={dietary.includes("gluten-free")}
                    onCheckedChange={(checked) => handleDietaryChange("gluten-free", checked)}
                  />
                  <Label htmlFor="gluten-free">Gluten-Free</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dairy-free"
                    checked={dietary.includes("dairy-free")}
                    onCheckedChange={(checked) => handleDietaryChange("dairy-free", checked)}
                  />
                  <Label htmlFor="dairy-free">Dairy-Free</Label>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isAvailable"
                checked={formData.isAvailable}
                onCheckedChange={(checked) => handleSwitchChange("isAvailable", checked)}
              />
              <Label htmlFor="isAvailable">Item is available on the menu</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/services/restaurant")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : menuItem ? "Update Item" : "Create Item"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
