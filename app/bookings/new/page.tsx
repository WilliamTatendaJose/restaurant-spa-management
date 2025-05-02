import { BookingForm } from "@/components/bookings/booking-form"
import { PageHeader } from "@/components/page-header"

export default function NewBookingPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader heading="New Booking" subheading="Create a new spa or restaurant reservation" />

      <div className="mt-6">
        <BookingForm />
      </div>
    </div>
  )
}
