"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { bookingsApi, spaServicesApi } from "@/lib/db"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Edit, Check, X } from "lucide-react"
import Link from "next/link"

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
  const [bookingDates, setBookingDates] = useState<Map<string, string[]>>(new Map())
  const [selectedDateBookings, setSelectedDateBookings] = useState<Booking[]>([])
  const [serviceMap, setServiceMap] = useState<Record<string, string>>({}) // Map of id to name
  const { toast } = useToast()
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

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
        
        // Create a map of dates to booking status counts
        const dateMap = new Map<string, string[]>()
        
        data.forEach(booking => {
          const dateKey = booking.booking_date
          if (!dateMap.has(dateKey)) {
            dateMap.set(dateKey, [])
          }
          const statuses = dateMap.get(dateKey) || []
          if (!statuses.includes(booking.status)) {
            statuses.push(booking.status)
          }
          dateMap.set(dateKey, statuses)
        })
        
        setBookingDates(dateMap)
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

  // Function to determine day class based on booking status
  const getDayClass = (day: Date) => {
    const dateString = day.toISOString().split('T')[0]
    const statuses = bookingDates.get(dateString) || []
    
    if (statuses.includes("confirmed")) {
      return "bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-800/40"
    } else if (statuses.includes("pending")) {
      return "bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-800/40"
    } else if (statuses.length > 0) {
      return "bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800/40"
    }
    
    return ""
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

  // Handle status change
  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    setUpdatingStatus(bookingId)
    try {
      await bookingsApi.update(bookingId, { status: newStatus })
      
      // Update local state to reflect the change
      const updatedBookings = bookings.map(booking => 
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      )
      setBookings(updatedBookings)
      
      // Update the bookingDates map to reflect the new status
      if (date) {
        const dateString = date.toISOString().split('T')[0]
        const dayBookings = updatedBookings.filter(b => b.booking_date === dateString)
        
        const statuses = new Set<string>()
        dayBookings.forEach(b => statuses.add(b.status))
        
        const newBookingDates = new Map(bookingDates)
        newBookingDates.set(dateString, Array.from(statuses))
        setBookingDates(newBookingDates)
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

  // Get status dot color
  const getStatusDotColor = (statuses: string[]) => {
    if (statuses.includes("confirmed")) {
      return "bg-green-500 dark:bg-green-400"
    } else if (statuses.includes("pending")) {
      return "bg-amber-500 dark:bg-amber-400"
    }
    return "bg-blue-500 dark:bg-blue-400"
  }

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-4 flex-1 flex flex-col h-full">
        {isLoading ? (
          <div className="flex justify-center items-center py-8 h-full">
            Loading bookings calendar...
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 min-h-[400px]">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border w-full h-full"
                classNames={{
                  months: "h-full flex-1",
                  month: "h-full flex-1 space-y-4",
                  table: "w-full h-[calc(100%-3rem)]",
                  tbody: "w-full h-full",
                  head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                  cell: "h-9 w-9 text-center text-sm relative p-0 data-[isSelected=true]:bg-primary data-[isSelected=true]:text-primary-foreground data-[isSelected=true]:rounded-md",
                  day: "h-9 w-9 p-0 aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md"
                }}
                components={{
                  Day: (props: DayProps) => {
                    const dateString = props.date.toISOString().split('T')[0]
                    const statuses = bookingDates.get(dateString) || []
                    const hasBookings = statuses.length > 0
                    const dayClass = getDayClass(props.date)
                    
                    return (
                      <div 
                        {...props} 
                        className={`
                          ${props.className} 
                          relative 
                          ${dayClass}
                          ${date && props.date.toDateString() === date.toDateString() ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" : ""}
                        `}
                      >
                        {props.children}
                        {hasBookings && (
                          <div className="absolute bottom-1 right-1">
                            <Badge 
                              variant="secondary" 
                              className={`h-2 w-2 rounded-full p-0 ${getStatusDotColor(statuses)}`} 
                            />
                          </div>
                        )}
                      </div>
                    )
                  },
                }}
              />
            </div>

            {date && (
              <div className="mt-4 overflow-y-auto max-h-[350px] flex-1">
                <h3 className="font-medium sticky top-0 bg-background py-2 z-10">
                  Bookings for {date.toLocaleDateString()}
                </h3>
                {selectedDateBookings.length > 0 ? (
                  <div className="mt-2 space-y-3">
                    {selectedDateBookings.map(booking => (
                      <div key={booking.id} className="rounded-md border p-3">
                        <div className="flex justify-between flex-wrap gap-2">
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
                            
                            <div className="flex items-center">
                              <Select 
                                value={booking.status}
                                onValueChange={(value) => handleStatusChange(booking.id, value)}
                                disabled={updatingStatus === booking.id}
                              >
                                <SelectTrigger className="w-[130px] h-8">
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
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 ml-1" 
                                asChild
                              >
                                <Link href={`/bookings/edit/${booking.id}`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="flex mt-2 gap-2">
                          <Button 
                            size="sm" 
                            variant={booking.status === "confirmed" ? "default" : "outline"}
                            className="h-7 px-2"
                            onClick={() => handleStatusChange(booking.id, "confirmed")}
                            disabled={booking.status === "confirmed" || updatingStatus === booking.id}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Confirm
                          </Button>
                          <Button 
                            size="sm" 
                            variant={booking.status === "cancelled" ? "destructive" : "outline"}
                            className="h-7 px-2"
                            onClick={() => handleStatusChange(booking.id, "cancelled")}
                            disabled={booking.status === "cancelled" || updatingStatus === booking.id}
                          >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">No bookings for this date.</p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
