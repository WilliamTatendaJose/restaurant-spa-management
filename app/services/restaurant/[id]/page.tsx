"use client"
import { MenuItemForm } from "@/components/services/menu-item-form"
import { PageHeader } from "@/components/page-header"
import { useEffect, useState } from "react"
import { menuItemsApi } from "@/lib/db"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Trash2, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function EditMenuItemPage({ params }: { params: Promise<{ id: string }> }) {
  const [menuItem, setMenuItem] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  // Resolve params in useEffect
  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params
      setResolvedParams(resolved)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (!resolvedParams?.id) return

    async function fetchMenuItem() {
      try {
        setIsLoading(true)
        const itemData = await menuItemsApi.get(resolvedParams!.id)
        
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
  }, [resolvedParams, toast])

  const handleDelete = async () => {
    if (!menuItem || !resolvedParams) return
    
    try {
      setIsDeleting(true)
      await menuItemsApi.delete(resolvedParams.id)
      
      toast({
        title: "Menu item deleted",
        description: `${menuItem.name} has been successfully deleted.`,
      })
      
      router.push("/services/restaurant")
    } catch (error) {
      console.error("Error deleting menu item:", error)
      toast({
        title: "Error",
        description: "Failed to delete menu item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between">
        <PageHeader heading="Edit Menu Item" subheading="Update menu item details and pricing" />
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/services/restaurant">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Menu
            </Link>
          </Button>
          {menuItem && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the menu item "{menuItem.name}" from your restaurant menu.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete Menu Item"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
      
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
