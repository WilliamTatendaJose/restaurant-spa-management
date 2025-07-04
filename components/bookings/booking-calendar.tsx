'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { bookingsApi, spaServicesApi, customersApi } from '@/lib/db';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Edit, Check, X } from 'lucide-react';
import Link from 'next/link';

interface Booking {
  id: string;
  customer_name: string;
  booking_date: string;
  booking_time: string;
  booking_type: string;
  service: string;
  status: string;
  party_size?: string;
  customer_id?: string;
  updated_at?: string;
  created_at?: string;
}

interface SpaService {
  id: string;
  name: string;
}

interface DayProps {
  date: Date;
  className?: string;
  children?: React.ReactNode;
}

export function BookingCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingDates, setBookingDates] = useState<Map<string, string[]>>(
    new Map()
  );
  const [selectedDateBookings, setSelectedDateBookings] = useState<Booking[]>(
    []
  );
  const [serviceMap, setServiceMap] = useState<Record<string, string>>({}); // Map of id to name
  const { toast } = useToast();
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Load spa services for lookup
        const services = (await spaServicesApi.list()) as SpaService[];
        const servicesById: Record<string, string> = {};
        services.forEach((service) => {
          servicesById[service.id] = service.name;
        });
        setServiceMap(servicesById);

        // Load bookings
        const data = (await bookingsApi.list()) as Booking[];

        // Get today's date in YYYY-MM-DD format for filtering
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];

        // Filter out past bookings (only show today and future bookings)
        const currentAndFutureBookings = data.filter((booking) => {
          const bookingDate = new Date(booking.booking_date + 'T00:00:00');
          const bookingDateString = bookingDate.toISOString().split('T')[0];
          return bookingDateString >= todayString;
        });

        // Deduplicate bookings by customer_name, booking_date, booking_time, and booking_type
        const deduplicatedBookings = currentAndFutureBookings.reduce(
          (acc: Booking[], current: Booking) => {
            const existingIndex = acc.findIndex(
              (booking) =>
                booking.customer_name?.toLowerCase() ===
                  current.customer_name?.toLowerCase() &&
                booking.booking_date === current.booking_date &&
                booking.booking_time === current.booking_time &&
                booking.booking_type === current.booking_type
            );

            if (existingIndex === -1) {
              // Booking doesn't exist, add it
              acc.push(current);
            } else {
              // Booking exists, keep the one with more recent updated_at or created_at
              const existing = acc[existingIndex];
              const currentDate = new Date(
                current.updated_at || current.created_at || 0
              );
              const existingDate = new Date(
                existing.updated_at || existing.created_at || 0
              );

              if (currentDate > existingDate) {
                acc[existingIndex] = current; // Replace with newer booking
              }
            }

            return acc;
          },
          []
        );

        setBookings(deduplicatedBookings);

        // Create a map of dates to booking status counts using deduplicated data
        const dateMap = new Map<string, string[]>();
        deduplicatedBookings.forEach((booking) => {
          // Ensure consistent date format (YYYY-MM-DD) without timezone issues
          const bookingDate = new Date(booking.booking_date + 'T00:00:00');
          const dateKey = bookingDate.toISOString().split('T')[0];

          if (!dateMap.has(dateKey)) {
            dateMap.set(dateKey, []);
          }

          const statuses = dateMap.get(dateKey) || [];
          if (!statuses.includes(booking.status)) {
            statuses.push(booking.status);
          }
          dateMap.set(dateKey, statuses);
        });

        setBookingDates(dateMap);

        // Initialize selected date bookings with deduplicated data
        updateSelectedDateBookings(new Date(), deduplicatedBookings);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Function to update selected date bookings
  const updateSelectedDateBookings = (
    selectedDate: Date | undefined,
    bookingsList: Booking[]
  ) => {
    if (selectedDate && bookingsList.length > 0) {
      // Use consistent date formatting to avoid timezone issues
      const formattedDate = selectedDate.toISOString().split('T')[0];
      const dayBookings = bookingsList.filter((booking) => {
        // Ensure booking date is also formatted consistently
        const bookingDate = new Date(booking.booking_date + 'T00:00:00');
        const bookingDateString = bookingDate.toISOString().split('T')[0];
        return bookingDateString === formattedDate;
      });

      // Sort bookings by time
      dayBookings.sort((a, b) => a.booking_time.localeCompare(b.booking_time));

      setSelectedDateBookings(dayBookings);
    } else {
      setSelectedDateBookings([]);
    }
  };

  // Handle date selection
  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    updateSelectedDateBookings(newDate, bookings);
  };

  // Function to determine day class based on booking status
  const getDayClass = (day: Date) => {
    const dateString = day.toISOString().split('T')[0];
    const statuses = bookingDates.get(dateString) || [];

    if (statuses.includes('confirmed')) {
      return 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-800/40';
    } else if (statuses.includes('pending')) {
      return 'bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-800/40';
    } else if (statuses.length > 0) {
      return 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800/40';
    }

    return '';
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    try {
      const [hours, minutes] = timeString.split(':');
      const time = new Date();
      time.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      return time.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return timeString;
    }
  };

  // Get the display name for a service
  const getServiceDisplayName = (booking: Booking) => {
    if (booking.booking_type === 'spa') {
      // Try to look up the service name from our map
      return serviceMap[booking.service] || booking.service;
    } else {
      return `Table for ${booking.party_size || '?'}`;
    }
  };

  // Handle status change
  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    setUpdatingStatus(bookingId);
    try {
      await bookingsApi.update(bookingId, { status: newStatus });

      // Update local state to reflect the change
      const updatedBookings = bookings.map((booking) =>
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      );
      setBookings(updatedBookings);

      // Update the bookingDates map to reflect the new status
      if (date) {
        const dateString = date.toISOString().split('T')[0];
        const dayBookings = updatedBookings.filter((b) => {
          const bookingDate = new Date(b.booking_date + 'T00:00:00');
          const bookingDateString = bookingDate.toISOString().split('T')[0];
          return bookingDateString === dateString;
        });

        const statuses = new Set<string>();
        dayBookings.forEach((b) => statuses.add(b.status));

        const newBookingDates = new Map(bookingDates);
        newBookingDates.set(dateString, Array.from(statuses));
        setBookingDates(newBookingDates);

        // Update the selected date bookings to reflect the status change
        updateSelectedDateBookings(date, updatedBookings);
      }

      // Send confirmation notification if status changed to "confirmed"
      if (newStatus === 'confirmed') {
        const booking = bookings.find((b) => b.id === bookingId);
        if (booking) {
          try {
            // Get customer details
            let customerEmail = '';
            let customerPhone = '';

            if (booking.customer_id) {
              const customer = await customersApi.get(booking.customer_id);
              if (customer) {
                customerEmail = customer.email || '';
                customerPhone = customer.phone || '';
              }
            }

            // Get service name
            let serviceName = '';
            if (booking.booking_type === 'spa') {
              serviceName = serviceMap[booking.service] || 'Spa Service';
            } else {
              serviceName = `Table for ${booking.party_size || '?'} - Restaurant`;
            }

            // Send confirmation notification
            const confirmationResponse = await fetch('/api/bookings/confirm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bookingId: booking.id,
                customerName: booking.customer_name,
                customerEmail,
                customerPhone,
                serviceName,
                bookingDate: booking.booking_date,
                bookingTime: booking.booking_time,
                notificationType: 'both',
              }),
            });

            const confirmationResult = await confirmationResponse.json();

            if (confirmationResult.success) {
              const notifications = [];
              if (confirmationResult.results?.email?.success)
                notifications.push('email');
              if (confirmationResult.results?.whatsapp?.success)
                notifications.push('WhatsApp');

              if (notifications.length > 0) {
                toast({
                  title: 'Booking confirmed & customer notified',
                  description: `Confirmation sent via ${notifications.join(
                    ' and '
                  )} to ${booking.customer_name}`,
                });
              } else {
                toast({
                  title: 'Booking confirmed',
                  description:
                    'No customer contact information available for notifications',
                });
              }
            } else {
              toast({
                title: 'Booking confirmed',
                description:
                  'Customer notification failed, but booking status updated',
                variant: 'default',
              });
            }
          } catch (notificationError) {
            console.error(
              'Error sending confirmation notification:',
              notificationError
            );
            toast({
              title: 'Booking confirmed',
              description:
                'Status updated successfully, but notification failed',
              variant: 'default',
            });
          }
        }
      } else {
        toast({
          title: 'Status updated',
          description: `Booking status has been updated to ${newStatus}`,
        });
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update booking status',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'cancelled':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Get status dot color
  const getStatusDotColor = (statuses: string[]) => {
    if (statuses.includes('confirmed')) {
      return 'bg-green-500 dark:bg-green-400';
    } else if (statuses.includes('pending')) {
      return 'bg-amber-500 dark:bg-amber-400';
    }
    return 'bg-blue-500 dark:bg-blue-400';
  };

  return (
    <Card className='flex h-full w-full flex-col'>
      <CardContent className='flex h-full flex-1 flex-col p-4'>
        {isLoading ? (
          <div className='flex h-full items-center justify-center py-8'>
            Loading bookings calendar...
          </div>
        ) : (
          <div className='flex h-full flex-col space-y-4'>
            <div className='min-h-[400px] flex-1 rounded-md border p-4'>
              <Calendar
                mode='single'
                selected={date}
                onSelect={handleDateSelect}
                className='h-full w-full'
                classNames={{
                  month: 'space-y-4 w-full',
                  caption:
                    'flex justify-center pt-1 relative items-center w-full',
                  caption_label: 'text-sm font-medium',
                  nav: 'space-x-1 flex items-center',
                  nav_button:
                    'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                  nav_button_previous: 'absolute left-1',
                  nav_button_next: 'absolute right-1',
                  table: 'w-full border-collapse',
                  head_row: 'flex w-full mt-2',
                  head_cell:
                    'text-muted-foreground rounded-md w-full font-normal text-[0.8rem] flex-1 text-center',
                  row: 'flex w-full mt-2',
                  cell: 'h-9 w-full text-center text-sm p-0 relative focus-within:relative focus-within:z-20 cursor-pointer',
                  day: 'h-9 w-9 p-0 mx-auto flex items-center justify-center rounded-md aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                  day_selected:
                    'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                  day_today: 'bg-accent text-accent-foreground',
                  day_outside: 'text-muted-foreground opacity-50',
                  day_disabled: 'text-muted-foreground opacity-50',
                  day_hidden: 'invisible',
                }}
                components={{
                  Day: ({ date: dayDate, displayMonth, ...otherProps }) => {
                    const dateString = dayDate.toISOString().split('T')[0];
                    const statuses = bookingDates.get(dateString) || [];
                    const hasBookings = statuses.length > 0;
                    const dayClass = getDayClass(dayDate);
                    const isSelected =
                      date && dayDate.toDateString() === date.toDateString();

                    // Extract className if it exists, otherwise use empty string
                    const { className = '', ...domProps } = otherProps as {
                      className?: string;
                      [key: string]: any;
                    };

                    // Filter out any React-specific props
                    const cleanDomProps = Object.fromEntries(
                      Object.entries(domProps).filter(
                        ([key]) =>
                          !key.startsWith('aria-') ||
                          ['aria-selected', 'aria-label'].includes(key)
                      )
                    );

                    return (
                      <div
                        {...cleanDomProps}
                        className={` ${className} relative mx-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-md p-0 ${dayClass} ${
                          isSelected
                            ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                            : ''
                        } `}
                        onClick={() => handleDateSelect(dayDate)}
                      >
                        <span className='absolute inset-0 flex items-center justify-center'>
                          {dayDate.getDate()}
                        </span>
                        {hasBookings && (
                          <div className='absolute bottom-0.5 right-0.5'>
                            <span
                              className={`block h-2 w-2 rounded-full ${getStatusDotColor(
                                statuses
                              )}`}
                            />
                          </div>
                        )}
                      </div>
                    );
                  },
                }}
              />
            </div>

            <div
              className='bookings-container flex-1 overflow-y-auto rounded-md border p-4'
              style={{ maxHeight: '350px' }}
            >
              {date ? (
                <>
                  <h3 className='sticky top-0 z-10 mb-3 border-b bg-background py-2 font-medium'>
                    Bookings for {date.toLocaleDateString()}
                  </h3>
                  {selectedDateBookings.length > 0 ? (
                    <div className='space-y-3'>
                      {selectedDateBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className='rounded-md border p-3 transition-colors hover:bg-accent/50'
                        >
                          <div className='flex flex-wrap justify-between gap-2'>
                            <div>
                              <p className='font-medium'>
                                {getServiceDisplayName(booking)}
                              </p>
                              <p className='text-sm text-muted-foreground'>
                                {booking.customer_name}
                              </p>
                            </div>
                            <div className='flex items-center gap-2'>
                              <Badge
                                variant={
                                  booking.booking_type === 'spa'
                                    ? 'secondary'
                                    : 'outline'
                                }
                              >
                                {formatTime(booking.booking_time)}
                              </Badge>

                              <div className='flex items-center'>
                                <Select
                                  value={booking.status}
                                  onValueChange={(value) =>
                                    handleStatusChange(booking.id, value)
                                  }
                                  disabled={updatingStatus === booking.id}
                                >
                                  <SelectTrigger className='h-8 w-[130px]'>
                                    <SelectValue>
                                      <Badge
                                        variant={
                                          getStatusColor(booking.status) as any
                                        }
                                      >
                                        {booking.status}
                                      </Badge>
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value='pending'>
                                      Pending
                                    </SelectItem>
                                    <SelectItem value='confirmed'>
                                      Confirmed
                                    </SelectItem>
                                    <SelectItem value='cancelled'>
                                      Cancelled
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='ml-1 h-8 w-8'
                                  asChild
                                >
                                  <Link href={`/bookings/edit/${booking.id}`}>
                                    <Edit className='h-4 w-4' />
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className='mt-2 flex gap-2'>
                            <Button
                              size='sm'
                              variant={
                                booking.status === 'confirmed'
                                  ? 'default'
                                  : 'outline'
                              }
                              className='h-7 px-2'
                              onClick={() =>
                                handleStatusChange(booking.id, 'confirmed')
                              }
                              disabled={
                                booking.status === 'confirmed' ||
                                updatingStatus === booking.id
                              }
                            >
                              <Check className='mr-1 h-3.5 w-3.5' />
                              Confirm
                            </Button>
                            <Button
                              size='sm'
                              variant={
                                booking.status === 'cancelled'
                                  ? 'destructive'
                                  : 'outline'
                              }
                              className='h-7 px-2'
                              onClick={() =>
                                handleStatusChange(booking.id, 'cancelled')
                              }
                              disabled={
                                booking.status === 'cancelled' ||
                                updatingStatus === booking.id
                              }
                            >
                              <X className='mr-1 h-3.5 w-3.5' />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='flex h-[200px] flex-col items-center justify-center text-center'>
                      <p className='text-sm text-muted-foreground'>
                        No bookings for {date.toLocaleDateString()}
                      </p>
                      <Button
                        variant='outline'
                        size='sm'
                        className='mt-2'
                        asChild
                      >
                        <Link href='/bookings/new'>Create a booking</Link>
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className='flex h-[200px] flex-col items-center justify-center text-center'>
                  <p className='text-muted-foreground'>
                    Select a date to view bookings
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
