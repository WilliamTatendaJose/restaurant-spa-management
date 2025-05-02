"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { bookingsApi ,spaServicesApi} from "@/lib/db"
import { useToast } from "@/components/ui/use-toast"

interface Booking {
  id: string
  customer_name: string
  booking_date: string
  booking_time: string
  booking_type: string
  service: string
  status: string
  party_size?: string
}
interface SpaService {
  id: string
  name: string
}

export function UpcomingBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const [serviceMap, setServiceMap] = useState<Record<string, string>>({})
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUpcomingBookings() {
      try {
        // Get all bookings
         const services = await spaServicesApi.list() as SpaService[]
                const servicesById: Record<string, string> = {}
                services.forEach(service => {
                  servicesById[service.id] = service.name
                })
                setServiceMap(servicesById)
        const allBookings = await bookingsApi.list() as Booking[]
        
        // Filter for only upcoming bookings (today and future)
        const today = new Date()
        today.setHours(0, 0, 0, 0) // Set to beginning of today
        
        const upcomingBookings = allBookings.filter(booking => {
          const bookingDate = new Date(booking.booking_date)
          return bookingDate >= today && booking.status !== "cancelled"
        })
        
        // Sort by date and time
        upcomingBookings.sort((a, b) => {
          const dateA = new Date(`${a.booking_date}T${a.booking_time}`)
          const dateB = new Date(`${b.booking_date}T${b.booking_time}`)
          return dateA.getTime() - dateB.getTime()
        })
        
        // Only take the next 4 bookings
        setBookings(upcomingBookings.slice(0, 4))
      } catch (error) {
        console.error("Error fetching upcoming bookings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUpcomingBookings()
  }, [])

  // Format booking time for display
  const formatBookingTime = (bookingDate: string, bookingTime: string) => {
    try {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const date = new Date(bookingDate)
      const time = new Date(`${bookingDate}T${bookingTime}`)
      const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      
      // Check if it's today or tomorrow
      if (date.toDateString() === today.toDateString()) {
        return `Today, ${timeString}`
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return `Tomorrow, ${timeString}`
      } else {
        return `${date.toLocaleDateString()}, ${timeString}`
      }
    } catch (e) {
      return `${bookingDate}, ${bookingTime}`
    }
  }

  // Get service description (spa treatment or restaurant booking)
  const getServiceDescription = (booking: Booking) => {
    if (booking.booking_type === "spa") {
      return  serviceMap[booking.service] || "Unknown Service"
    } else {
      return `Dinner Reservation (${booking.party_size || '?'} people)`
    }
  }

  // Handle status change
  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    setUpdatingStatus(bookingId)
    try {
      await bookingsApi.update(bookingId, { status: newStatus })
      
      // Update local state to reflect the change
      if (newStatus === "cancelled") {
        // Remove cancelled bookings from the list
        setBookings(prev => prev.filter(booking => booking.id !== bookingId))
      } else {
        setBookings(prev => prev.map(booking => 
          booking.id === bookingId ? { ...booking, status: newStatus } : booking
        ))
      }
      
      toast({
        title: "Status updated",
        description: `Booking status has been updated to ${newStatus}`,
      })
    } catch (error) {
      console.error("Error updating booking status:", error)
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      })
    } finally {
      setUpdatingStatus(null)
    }
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "default"
      case "cancelled": return "destructive"
      case "pending": return "secondary"
      default: return "outline"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Bookings</CardTitle>
        <CardDescription>
          {isLoading 
            ? "Loading upcoming bookings..." 
            : bookings.length > 0 
              ? `You have ${bookings.length} upcoming bookings` 
              : "No upcoming bookings"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-4">
            <p className="text-sm text-muted-foreground">Loading bookings...</p>
          </div>
        ) : bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium leading-none">{booking.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{getServiceDescription(booking)}</p>
                  <div className="text-sm">{formatBookingTime(booking.booking_date, booking.booking_time)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={booking.booking_type === "spa" ? "secondary" : "outline"}>
                    {booking.booking_type === "spa" ? "Spa" : "Restaurant"}
                  </Badge>
                  <Select 
                    value={booking.status}
                    onValueChange={(value) => handleStatusChange(booking.id, value)}
                    disabled={updatingStatus === booking.id}
                  >
                    <SelectTrigger className="w-[110px] h-8">
                      <SelectValue>
                        <Badge variant={getStatusColor(booking.status) as any}>
                          {booking.status}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">No upcoming bookings found.</p>
        )}
      </CardContent>
    </Card>
  )
}
