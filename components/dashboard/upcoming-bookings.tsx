import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function UpcomingBookings() {
  const bookings = [
    {
      id: "1",
      customer: "Sarah Johnson",
      service: "Deep Tissue Massage",
      time: "Today, 2:00 PM",
      type: "spa",
    },
    {
      id: "2",
      customer: "Michael Chen",
      service: "Dinner Reservation (4 people)",
      time: "Today, 7:30 PM",
      type: "restaurant",
    },
    {
      id: "3",
      customer: "Emma Wilson",
      service: "Facial Treatment",
      time: "Tomorrow, 10:00 AM",
      type: "spa",
    },
    {
      id: "4",
      customer: "James Rodriguez",
      service: "Lunch Reservation (2 people)",
      time: "Tomorrow, 12:30 PM",
      type: "restaurant",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Bookings</CardTitle>
        <CardDescription>You have {bookings.length} upcoming bookings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium leading-none">{booking.customer}</p>
                <p className="text-sm text-muted-foreground">{booking.service}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={booking.type === "spa" ? "secondary" : "outline"}>
                  {booking.type === "spa" ? "Spa" : "Restaurant"}
                </Badge>
                <span className="text-sm">{booking.time}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
