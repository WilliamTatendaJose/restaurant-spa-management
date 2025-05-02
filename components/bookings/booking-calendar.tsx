"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { bookingsApi, spaServicesApi } from "@/lib/db"

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

interface DayProps {
  date: Date
  className?: string
  children?: React.ReactNode
}

export function BookingCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [bookingDates, setBookingDates] = useState<Date[]>([])
  const [selectedDateBookings, setSelectedDateBookings] = useState<Booking[]>([])
  const [serviceMap, setServiceMap] = useState<Record<string, string>>({}) // Map of id to name

  useEffect(() => {
    async function fetchData() {
      try {
        // Load spa services for lookup
        const services = await spaServicesApi.list() as SpaService[]
        const servicesById: Record<string, string> = {}
        services.forEach(service => {
          servicesById[service.id] = service.name
        })
        setServiceMap(servicesById)
        
        // Load bookings
        const data = await bookingsApi.list() as Booking[]
        setBookings(data)
        
        // Extract all the booking dates for highlighting
        const dates = data.map(booking => new Date(booking.booking_date))
        setBookingDates(dates)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Update selected date bookings when date changes
  useEffect(() => {
    if (date && bookings.length > 0) {
      const formattedDate = date.toISOString().split('T')[0]
      const dayBookings = bookings.filter(booking => 
        booking.booking_date === formattedDate
      )
      
      // Sort bookings by time
      dayBookings.sort((a, b) => a.booking_time.localeCompare(b.booking_time))
      
      setSelectedDateBookings(dayBookings)
    } else {
      setSelectedDateBookings([])
    }
  }, [date, bookings])

  // Function to highlight dates with bookings
  const isDayWithBooking = (day: Date) => {
    return bookingDates.some(
      (bookingDate) =>
        bookingDate.getDate() === day.getDate() &&
        bookingDate.getMonth() === day.getMonth() &&
        bookingDate.getFullYear() === day.getFullYear(),
    )
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

  // Get the display name for a service
  const getServiceDisplayName = (booking: Booking) => {
    if (booking.booking_type === "spa") {
      // Try to look up the service name from our map
      return serviceMap[booking.service] || booking.service
    } else {
      return `Table for ${booking.party_size || '?'}`
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            Loading bookings calendar...
          </div>
        ) : (
          <>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              components={{
                Day: (props: DayProps) => {
                  const isBookingDay = isDayWithBooking(props.date)

                  return (
                    <div {...props} className={`${props.className} relative ${isBookingDay ? "bg-primary/10" : ""}`}>
                      {props.children}
                      {isBookingDay && (
                        <div className="absolute bottom-0 right-0">
                          <Badge variant="secondary" className="h-1.5 w-1.5 rounded-full p-0" />
                        </div>
                      )}
                    </div>
                  )
                },
              }}
            />

            {date && (
              <div className="mt-6">
                <h3 className="font-medium">Bookings for {date.toLocaleDateString()}</h3>
                {selectedDateBookings.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {selectedDateBookings.map(booking => (
                      <div key={booking.id} className="rounded-md border p-2">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">
                              {getServiceDisplayName(booking)}
                            </p>
                            <p className="text-sm text-muted-foreground">{booking.customer_name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={booking.booking_type === "spa" ? "secondary" : "outline"}
                            >
                              {formatTime(booking.booking_time)}
                            </Badge>
                            <Badge variant={booking.status === "confirmed" ? "default" : "outline"}>
                              {booking.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">No bookings for this date.</p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
