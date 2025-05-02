"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { bookingsApi } from "@/lib/db"

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

export function UpcomingBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUpcomingBookings() {
      try {
        // Get all bookings
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
      return booking.service
    } else {
      return `Dinner Reservation (${booking.party_size || '?'} people)`
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
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={booking.booking_type === "spa" ? "secondary" : "outline"}>
                    {booking.booking_type === "spa" ? "Spa" : "Restaurant"}
                  </Badge>
                  <span className="text-sm">{formatBookingTime(booking.booking_date, booking.booking_time)}</span>
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
