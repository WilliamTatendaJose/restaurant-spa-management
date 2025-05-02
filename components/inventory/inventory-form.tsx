"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useSyncStatus } from "@/components/sync-status-provider"
import { inventoryApi } from "@/lib/db"

interface InventoryItem {
  id?: string
  name: string
  category: string
  quantity: number
  unit: string
  reorder_level: number
  description?: string
  last_updated?: string
}

interface InventoryFormProps {
  item?: InventoryItem
  itemId?: string
}

export function InventoryForm({ item, itemId }: InventoryFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { isOnline } = useSyncStatus()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(!!itemId)
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(item || null)

  const [formData, setFormData] = useState<InventoryItem>({
    name: "",
    category: "spa",
    quantity: 0,
    unit: "piece",
    reorder_level: 10,
    description: "",
  })

  // Fetch inventory item if itemId is provided
  useEffect(() => {
    async function fetchInventoryItem() {
      if (!itemId) return

      try {
        const fetchedItem = await inventoryApi.get(itemId)
        if (fetchedItem) {
          // Type cast the fetched item as an InventoryItem
          const typedItem = fetchedItem as unknown as InventoryItem
          setCurrentItem(typedItem)
          setFormData({
            name: typedItem.name || "",
            category: typedItem.category || "spa",
            quantity: typedItem.quantity || 0,
            unit: typedItem.unit || "piece",
            reorder_level: typedItem.reorder_level || 10,
            description: typedItem.description || "",
          })
        } else {
          toast({
            title: "Error",
            description: "Inventory item not found",
            variant: "destructive",
          })
          router.push("/inventory")
        }
      } catch (error) {
        console.error("Error fetching inventory item:", error)
        toast({
          title: "Error",
          description: "Failed to fetch inventory item. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (itemId) {
      fetchInventoryItem()
    } else if (item) {
      // If item is directly provided, use it
      setFormData({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        reorder_level: item.reorder_level,
        description: item.description || "",
      })
    }
  }, [itemId, item, toast, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantity" || name === "reorder_level" ? Number.parseInt(value) || 0 : value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (currentItem?.id || itemId) {
        // Update existing inventory item
        await inventoryApi.update(currentItem?.id || itemId!, {
          ...formData,
          last_updated: new Date().toISOString(),
        })
        toast({
          title: "Inventory updated",
          description: isOnline
            ? "Inventory item has been updated successfully."
            : "Inventory item has been updated offline and will sync when connection is restored.",
        })
      } else {
        // Create new inventory item
        await inventoryApi.create({
          ...formData,
          last_updated: new Date().toISOString(),
        })
        toast({
          title: "Inventory added",
          description: isOnline
            ? "New inventory item has been added successfully."
            : "Inventory item has been added offline and will sync when connection is restored.",
        })
      }

      router.push("/inventory")
    } catch (error) {
      console.error("Error saving inventory item:", error)
      toast({
        title: "Error",
        description: "Failed to save inventory item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center p-8">
            <p>Loading inventory item...</p>
          </div>
        </CardContent>
      </Card>
    )
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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spa">Spa</SelectItem>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="unit">Unit</Label>
                <Select value={formData.unit} onValueChange={(value) => handleSelectChange("unit", value)}>
                  <SelectTrigger id="unit">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="piece">Piece</SelectItem>
                    <SelectItem value="bottle">Bottle</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="kg">Kilogram</SelectItem>
                    <SelectItem value="liter">Liter</SelectItem>
                    <SelectItem value="jar">Jar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Current Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="reorder_level">Reorder Level</Label>
                <Input
                  id="reorder_level"
                  name="reorder_level"
                  type="number"
                  min="0"
                  value={formData.reorder_level}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter item description (optional)"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push("/inventory")} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : currentItem?.id || itemId ? "Update Item" : "Add Item"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
