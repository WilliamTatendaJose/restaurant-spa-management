import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function RecentBookings() {
  const bookings = [
    {
      id: "1",
      customer: "Sarah Johnson",
      service: "Deep Tissue Massage",
      date: "2025-04-22",
      time: "2:00 PM",
      status: "confirmed",
      type: "spa",
      amount: "$120.00",
    },
    {
      id: "2",
      customer: "Michael Chen",
      service: "Dinner Reservation (4 people)",
      date: "2025-04-22",
      time: "7:30 PM",
      status: "confirmed",
      type: "restaurant",
      amount: "$0.00",
    },
    {
      id: "3",
      customer: "Emma Wilson",
      service: "Facial Treatment",
      date: "2025-04-23",
      time: "10:00 AM",
      status: "pending",
      type: "spa",
      amount: "$85.00",
    },
    {
      id: "4",
      customer: "James Rodriguez",
      service: "Lunch Reservation (2 people)",
      date: "2025-04-23",
      time: "12:30 PM",
      status: "confirmed",
      type: "restaurant",
      amount: "$0.00",
    },
    {
      id: "5",
      customer: "Lisa Thompson",
      service: "Hot Stone Massage",
      date: "2025-04-24",
      time: "3:30 PM",
      status: "confirmed",
      type: "spa",
      amount: "$150.00",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Bookings</CardTitle>
        <CardDescription>Recent bookings across all services</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">{booking.customer}</TableCell>
                <TableCell>{booking.service}</TableCell>
                <TableCell>{`${booking.date}, ${booking.time}`}</TableCell>
                <TableCell>
                  <Badge variant={booking.type === "spa" ? "secondary" : "outline"}>
                    {booking.type === "spa" ? "Spa" : "Restaurant"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={booking.status === "confirmed" ? "success" : "outline"}>{booking.status}</Badge>
                </TableCell>
                <TableCell className="text-right">{booking.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
