"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Edit, Clock, Trash2, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import { spaServicesApi } from "@/lib/db"
import { useToast } from "@/components/ui/use-toast"

interface SpaService {
  id: string
  name: string
  description?: string
  duration: number
  price: number
  category?: string
  status?: string
  isActive?: boolean
}

export function SpaServiceList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [services, setServices] = useState<SpaService[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<SpaService | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Load spa services from the database
    async function loadServices() {
      try {
        setIsLoading(true)
        const servicesData = await spaServicesApi.list() as SpaService[]
        setServices(servicesData)
      } catch (error) {
        console.error("Failed to load spa services:", error)
        toast({
          title: "Error",
          description: "Failed to load spa services.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    loadServices()
  }, [toast])

  const handleDeleteClick = (service: SpaService) => {
    setServiceToDelete(service)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!serviceToDelete) return

    setIsDeleting(true)
    try {
      await spaServicesApi.delete(serviceToDelete.id)
      
      // Remove the deleted service from the local state
      setServices(services.filter(service => service.id !== serviceToDelete.id))
      
      toast({
        title: "Service deleted",
        description: `${serviceToDelete.name} has been deleted successfully.`,
      })
    } catch (error) {
      console.error("Failed to delete service:", error)
      toast({
        title: "Error",
        description: "Failed to delete service. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setServiceToDelete(null)
    }
  }

  const filteredServices = services.filter(
    (service) =>
      service.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline">Filter</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading spa services...</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No spa services found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-muted-foreground">{service.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {service.category || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                          {service.duration} min
                        </div>
                      </TableCell>
                      <TableCell>${Number(service.price).toFixed(2)}</TableCell>
                      <TableCell>
                        {(service.status === "active" || service.isActive) ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/services/spa/${service.id}`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Service
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(service)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Service
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{serviceToDelete?.name}"? This action cannot be undone.
              {/* Add warning if service has active bookings */}
              <div className="mt-2 text-sm text-amber-600">
                ⚠️ Warning: Deleting this service may affect existing bookings that reference it.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete Service"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
