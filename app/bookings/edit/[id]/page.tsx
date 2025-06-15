import { BookingForm } from "@/components/bookings/booking-form"
import { PageHeader } from "@/components/page-header"

interface EditBookingPageProps {
  params: {
    id: string
  }
}

export default function EditBookingPage({ params }: EditBookingPageProps) {
  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader 
        heading="Edit Booking" 
        subheading="Update booking details" 
      />
      
      <div className="mt-6">
        <BookingForm bookingId={params.id} />
      </div>
    </div>
  )
}