"use client"

import { MenuItemForm } from "@/components/services/menu-item-form"
import { PageHeader } from "@/components/page-header"
import { useEffect, useState } from "react"
import { menuItemsApi } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

export default function EditMenuItemPage({ params }: { params: { id: string } }) {
  const [menuItem, setMenuItem] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchMenuItem() {
      try {
        setIsLoading(true)
        const itemData = await menuItemsApi.get(params.id)
        
        if (!itemData) {
          toast({
            title: "Menu item not found",
            description: "The requested menu item could not be found.",
            variant: "destructive",
          })
          return
        }
        
        setMenuItem(itemData)
      } catch (error) {
        console.error("Error fetching menu item:", error)
        toast({
          title: "Error",
          description: "Failed to load menu item details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchMenuItem()
  }, [params.id, toast])

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader heading="Edit Menu Item" subheading="Update menu item details and pricing" />

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ) : menuItem ? (
          <MenuItemForm menuItem={menuItem} />
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Menu item not found. It may have been deleted or the ID is invalid.
          </div>
        )}
      </div>
    </div>
  )
}
