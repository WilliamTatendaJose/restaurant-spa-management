import { BookingCalendar } from "@/components/bookings/booking-calendar"
import { BookingFilters } from "@/components/bookings/booking-filters"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function BookingsPage() {
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
            <BookingFilters />
            <BookingCalendar />
          </div>
        </TabsContent>
        <TabsContent value="list" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
            <BookingFilters />
            <div className="bg-card rounded-lg border shadow-sm p-4">
              <h3 className="text-lg font-medium">Upcoming Bookings</h3>
              {/* Booking list would go here */}
              <p className="text-muted-foreground mt-2">Loading bookings...</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
