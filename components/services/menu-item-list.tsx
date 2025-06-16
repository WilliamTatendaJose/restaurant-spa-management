"use client"
import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { menuItemsApi } from "@/lib/db"
import { useToast } from "@/components/ui/use-toast"
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

interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  category: string
  dietary?: string[]
  isAvailable?: boolean
  status?: string
}

interface MenuItemListProps {
  category: string
}

export function MenuItemList({ category }: MenuItemListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Load menu items from the database
    async function loadMenuItems() {
      try {
        setIsLoading(true)
        const items = await menuItemsApi.listByCategory(category) as MenuItem[]
        setMenuItems(items)
      } catch (error) {
        console.error("Failed to load menu items:", error)
        toast({
          title: "Error",
          description: "Failed to load menu items.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    loadMenuItems()
  }, [category, toast])

  const handleDelete = async (item: MenuItem) => {
    try {
      setDeletingItemId(item.id)
      await menuItemsApi.delete(item.id)
      
      // Remove the item from the local state
      setMenuItems(prevItems => prevItems.filter(i => i.id !== item.id))
      
      toast({
        title: "Menu item deleted",
        description: `${item.name} has been successfully deleted.`,
      })
    } catch (error) {
      console.error("Error deleting menu item:", error)
      toast({
        title: "Error",
        description: "Failed to delete menu item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeletingItemId(null)
    }
  }

  const filteredItems = menuItems.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline">Filter</Button>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Loading menu items...</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Dietary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                    No menu items found. Try adjusting your search or add a new item.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>${Number(item.price).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.dietary && item.dietary.length > 0 ? (
                          item.dietary.map((diet) => (
                            <Badge key={diet} variant="outline" className="capitalize">
                              {diet}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(item.status === "active" || item.isAvailable) ? (
                        <Badge variant="success">Available</Badge>
                      ) : (
                        <Badge variant="secondary">Unavailable</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/services/restaurant/${item.id}`}>
                            <Edit className="mr-1 h-4 w-4" />
                            Edit
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive hover:text-destructive"
                              disabled={deletingItemId === item.id}
                            >
                              <Trash2 className="mr-1 h-4 w-4" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete "{item.name}" from your restaurant menu.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(item)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={deletingItemId === item.id}
                              >
                                {deletingItemId === item.id ? "Deleting..." : "Delete Menu Item"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
