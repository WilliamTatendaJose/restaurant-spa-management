"use client"

import { useState, useEffect } from "react"
import { BookingCalendar } from "@/components/bookings/booking-calendar"
import { BookingFilters } from "@/components/bookings/booking-filters"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"
import Link from "next/link"
import { bookingsApi, spaServicesApi } from "@/lib/db"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Booking {
  id: string
  customer_name: string
  booking_date: string
  booking_time: string
  booking_type: string
  service: string
  status: string
  staff?: string
  party_size?: string
}

interface SpaService {
  id: string
  name: string
}

interface BookingFilters {
  bookingType: string
  status: string
  staffId: string
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<BookingFilters>({
    bookingType: "all",
    status: "all",
    staffId: "all"
  })
  const [serviceMap, setServiceMap] = useState<Record<string, string>>({})

  // Fetch all bookings and services
  useEffect(() => {
    async function fetchData() {
      try {
        // First fetch services to build the lookup map
        const services = await spaServicesApi.list() as SpaService[]
        const servicesById: Record<string, string> = {}
        services.forEach(service => {
          servicesById[service.id] = service.name
        })
        setServiceMap(servicesById)
        
        // Then fetch bookings
        const data = await bookingsApi.list() as Booking[]
        setBookings(data)
        setFilteredBookings(data)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Apply filters when they change
  useEffect(() => {
    let result = [...bookings]
    
    // Filter by booking type
    if (filters.bookingType !== "all") {
      result = result.filter(booking => booking.booking_type === filters.bookingType)
    }
    
    // Filter by status
    if (filters.status !== "all") {
      result = result.filter(booking => booking.status === filters.status)
    }
    
    // Filter by staff member
    if (filters.staffId !== "all") {
      result = result.filter(booking => booking.staff === filters.staffId)
    }
    
    // Sort by date and time
    result.sort((a, b) => {
      const dateA = new Date(`${a.booking_date}T${a.booking_time}`)
      const dateB = new Date(`${b.booking_date}T${b.booking_time}`)
      return dateA.getTime() - dateB.getTime()
    })
    
    setFilteredBookings(result)
  }, [filters, bookings])

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString()
    } catch (e) {
      return dateString
    }
  }

  // Format time for display
  const formatTime = (timeString: string) => {
    if (!timeString) return ""
    try {
      const [hours, minutes] = timeString.split(':')
      const time = new Date()
      time.setHours(parseInt(hours, 10), parseInt(minutes, 10))
      return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch (e) {
      return timeString
    }
  }

  // Get service or table display
  const getServiceDisplay = (booking: Booking) => {
    if (booking.booking_type === "spa") {
      // Look up service name from the service map
      return serviceMap[booking.service] || "Unknown Service"
    } else {
      return `Table for ${booking.party_size || '?'}`
    }
  }

  // Handle filter changes from the BookingFilters component
  const handleFilterChange = (newFilters: BookingFilters) => {
    setFilters(newFilters)
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between">
        <PageHeader heading="Bookings" subheading="Manage spa and restaurant reservations" />
        <Button asChild>
          <Link href="/bookings/new">
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="calendar" className="mt-6">
        <TabsList>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        <TabsContent value="calendar" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
            <BookingFilters onFilterChange={handleFilterChange} />
            <BookingCalendar />
          </div>
        </TabsContent>
        <TabsContent value="list" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
            <BookingFilters onFilterChange={handleFilterChange} />
            <div className="bg-card rounded-lg border shadow-sm">
              <h3 className="text-lg font-medium p-4 border-b">Bookings</h3>
              
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <p>Loading bookings...</p>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground">No bookings found matching the filters.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service/Table</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map(booking => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div className="font-medium">{formatDate(booking.booking_date)}</div>
                          <div className="text-sm text-muted-foreground">{formatTime(booking.booking_time)}</div>
                        </TableCell>
                        <TableCell>{booking.customer_name}</TableCell>
                        <TableCell>
                          {getServiceDisplay(booking)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={booking.booking_type === "spa" ? "secondary" : "outline"}>
                            {booking.booking_type === "spa" ? "Spa" : "Restaurant"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              booking.status === "confirmed" ? "default" : 
                              booking.status === "cancelled" ? "destructive" : 
                              "outline"
                            }
                          >
                            {booking.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
