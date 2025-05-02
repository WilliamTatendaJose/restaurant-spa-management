"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function BookingCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  // Mock booking data - in a real app, this would come from your database
  const bookingDates = [
    new Date(2025, 3, 22),
    new Date(2025, 3, 23),
    new Date(2025, 3, 24),
    new Date(2025, 3, 25),
    new Date(2025, 3, 28),
  ]

  // Function to highlight dates with bookings
  const isDayWithBooking = (day: Date) => {
    return bookingDates.some(
      (bookingDate) =>
        bookingDate.getDate() === day.getDate() &&
        bookingDate.getMonth() === day.getMonth() &&
        bookingDate.getFullYear() === day.getFullYear(),
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border"
          components={{
            day: (props) => {
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
            {isDayWithBooking(date) ? (
              <div className="mt-2 space-y-2">
                <div className="rounded-md border p-2">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">Deep Tissue Massage</p>
                      <p className="text-sm text-muted-foreground">Sarah Johnson</p>
                    </div>
                    <Badge>2:00 PM</Badge>
                  </div>
                </div>
                <div className="rounded-md border p-2">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">Dinner Reservation (4 people)</p>
                      <p className="text-sm text-muted-foreground">Michael Chen</p>
                    </div>
                    <Badge variant="outline">7:30 PM</Badge>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No bookings for this date.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
