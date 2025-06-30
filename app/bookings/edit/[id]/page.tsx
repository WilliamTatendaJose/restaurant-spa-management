import { BookingForm } from '@/components/bookings/booking-form';
import { PageHeader } from '@/components/page-header';
import { bookingsApi } from '@/lib/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface EditBookingPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const { id } = params;
  const booking = await bookingsApi.get(id);

  if (!booking) {
    return {
      title: 'Booking Not Found',
      description: 'The requested booking could not be found.',
    };
  }

  return {
    title: `Edit Booking for ${booking.customer_name} | Bookings`,
    description: `Update the details for booking ID: ${booking.id}.`,
    openGraph: {
      title: `Edit Booking for ${booking.customer_name}`,
      description: `Update the details for booking ID: ${booking.id}`,
    },
    twitter: {
      card: 'summary',
      title: `Edit Booking for ${booking.customer_name}`,
      description: `Update the details for booking ID: ${booking.id}`,
    },
  };
}

export default async function EditBookingPage({
  params,
}: EditBookingPageProps) {
  const booking = await bookingsApi.get(params.id);

  if (!booking) {
    notFound();
  }

  return (
    <div className='container mx-auto px-4 py-6'>
      <PageHeader heading='Edit Booking' subheading='Update booking details' />

      <div className='mt-6'>
        <BookingForm booking={booking} bookingId={params.id} />
      </div>
    </div>
  );
}
