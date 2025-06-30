'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Calendar, Clock, Sparkles, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { bookingsApi, customersApi, spaServicesApi } from '@/lib/db';

interface SpaService {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface HeroBookingModalProps {
  showModal: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedService?: SpaService | null;
}

export function HeroBookingModal({
  showModal,
  onClose,
  onSuccess,
  preselectedService,
}: HeroBookingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [spaServices, setSpaServices] = useState<SpaService[]>([]);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    booking_date: '',
    booking_time: '',
    booking_type: 'spa',
    service: preselectedService?.id || '',
    party_size: '',
    notes: '',
  });
  const { toast } = useToast();

  // Load spa services when modal opens
  useEffect(() => {
    async function loadServices() {
      try {
        const services = await spaServicesApi.list();
        setSpaServices(services as SpaService[]);
      } catch (error) {
        console.error('Error loading services:', error);
      }
    }
    loadServices();
  }, []);

  // Update form when preselectedService changes
  useEffect(() => {
    if (preselectedService) {
      setFormData((prev) => ({
        ...prev,
        booking_type: 'spa',
        service: preselectedService.id,
      }));
    }
  }, [preselectedService]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation
      if (
        !formData.customer_name ||
        !formData.customer_email ||
        !formData.customer_phone ||
        !formData.booking_date ||
        !formData.booking_time
      ) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      if (formData.booking_type === 'spa' && !formData.service) {
        toast({
          title: 'Error',
          description: 'Please select a spa service',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      if (formData.booking_type === 'restaurant' && !formData.party_size) {
        toast({
          title: 'Error',
          description: 'Please specify party size for restaurant booking',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Check for duplicate bookings
      try {
        const existingBookings = await bookingsApi.list();
        const duplicateBooking = existingBookings.find(
          (booking: any) =>
            booking.customer_email?.toLowerCase() ===
            formData.customer_email.toLowerCase() &&
            booking.booking_date === formData.booking_date &&
            booking.booking_time === formData.booking_time &&
            booking.service === formData.service &&
            booking.status !== 'cancelled'
        );

        if (duplicateBooking) {
          toast({
            title: 'Booking Already Exists',
            description:
              'You already have a booking for this service at this time. Please choose a different time or contact us to modify your existing booking.',
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
      } catch (error) {
        console.error('Error checking for duplicate bookings:', error);
        // Continue with booking creation if check fails
      }

      // First, create or find customer
      let customerId;
      try {
        const existingCustomers = await customersApi.list();
        const existingCustomer = existingCustomers.find(
          (c: any) =>
            c.email?.toLowerCase() === formData.customer_email.toLowerCase()
        );

        if (existingCustomer) {
          customerId = existingCustomer.id;
          // Update customer info if needed
          await customersApi.update(existingCustomer.id, {
            name: formData.customer_name,
            phone: formData.customer_phone,
            last_visit: new Date().toISOString(),
            visits: (existingCustomer.visits || 0) + 1,
          });
        } else {
          // Create new customer
          const newCustomer = await customersApi.create({
            name: formData.customer_name,
            email: formData.customer_email,
            phone: formData.customer_phone,
            customer_type:
              formData.booking_type === 'spa' ? 'spa' : 'restaurant',
            visits: 1,
            last_visit: new Date().toISOString(),
          });
          customerId = newCustomer.id;
        }
      } catch (error) {
        console.error('Error handling customer:', error);
      }

      // Create booking with pending status
      const bookingData = {
        customer_name: formData.customer_name,
        customer_id: customerId,
        customer_email: formData.customer_email,
        booking_date: formData.booking_date,
        booking_time: formData.booking_time,
        booking_type: formData.booking_type,
        service: formData.service,
        status: 'pending',
        party_size: formData.party_size || null,
        notes: formData.notes || '',
      };

      const booking = await bookingsApi.create(bookingData);

      // Send confirmation email
      try {
        const serviceName =
          formData.booking_type === 'spa'
            ? spaServices.find((s: SpaService) => s.id === formData.service)
              ?.name || 'Spa Service'
            : `Table for ${formData.party_size} - Restaurant Reservation`;

        const response = await fetch('/api/bookings/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: booking.id,
            customerName: formData.customer_name,
            customerEmail: formData.customer_email,
            customerPhone: formData.customer_phone,
            serviceName,
            bookingDate: formData.booking_date,
            bookingTime: formData.booking_time,
          }),
        });

        const result = await response.json();

        if (result.success) {
          toast({
            title: 'Booking Created Successfully! 🎉',
            description:
              'Your booking request has been submitted and a confirmation email has been sent. Our team will contact you soon to confirm your appointment.',
          });
        } else {
          toast({
            title: 'Booking Created Successfully! 🎉',
            description:
              'Your booking request has been submitted. Our team will contact you soon to confirm your appointment.',
          });
        }
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        toast({
          title: 'Booking Created Successfully! 🎉',
          description:
            'Your booking request has been submitted. Our team will contact you soon to confirm your appointment.',
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: 'Error',
        description:
          'Failed to create booking. Please try again or call us directly.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showModal) return null;

  // Find the selected service details
  const selectedService = spaServices.find((s) => s.id === formData.service);

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 dark:bg-black/80 p-4 backdrop-blur-sm'>
      <div className='shadow-3xl max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-emerald-100 dark:border-emerald-900 bg-white dark:bg-gray-900 p-8'>
        <div className='mb-8 text-center'>
          <div className='mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 dark:from-emerald-800 dark:to-emerald-900 shadow-xl'>
            <Calendar className='h-8 w-8 text-white' />
          </div>
          <h3 className='mb-3 text-4xl font-light text-gray-800 dark:text-gray-100'>
            Book Your <span className='text-emerald-700 dark:text-emerald-400'>Experience</span>
          </h3>
          <div className='mx-auto mb-4 h-px w-16 bg-gradient-to-r from-emerald-500 to-amber-500 dark:from-emerald-700 dark:to-amber-700'></div>
          <p className='text-lg text-gray-700 dark:text-gray-200'>
            Fill out the form below and we'll confirm your booking shortly
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-8'>
          {/* Contact Information */}
          <div className='space-y-6'>
            <div className='flex items-center space-x-3 border-b border-emerald-200 dark:border-emerald-900 pb-3'>
              <div className='flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900'>
                <Calendar className='h-4 w-4 text-emerald-700 dark:text-emerald-300' />
              </div>
              <h4 className='text-xl font-medium text-gray-800 dark:text-gray-100'>
                Contact Information
              </h4>
            </div>

            <div className='space-y-4'>
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='customer_name' className='text-gray-800 dark:text-gray-100'>
                    Full Name *
                  </Label>
                  <Input
                    id='customer_name'
                    name='customer_name'
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    placeholder='Enter your full name'
                    required
                    className='border-gray-300 dark:border-emerald-900 bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 focus:border-emerald-700 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-700/20 dark:focus:ring-emerald-800/40'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='customer_phone' className='text-gray-800 dark:text-gray-100'>
                    Phone Number *
                  </Label>
                  <Input
                    id='customer_phone'
                    name='customer_phone'
                    value={formData.customer_phone}
                    onChange={handleInputChange}
                    placeholder='+263 xxx xxx xxx'
                    required
                    className='border-gray-300 dark:border-emerald-900 bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 focus:border-emerald-700 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-700/20 dark:focus:ring-emerald-800/40'
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='customer_email' className='text-gray-800 dark:text-gray-100'>
                  Email Address *
                </Label>
                <Input
                  id='customer_email'
                  name='customer_email'
                  type='email'
                  value={formData.customer_email}
                  onChange={handleInputChange}
                  placeholder='your.email@example.com'
                  required
                  className='border-gray-300 dark:border-emerald-900 bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 focus:border-emerald-700 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-700/20 dark:focus:ring-emerald-800/40'
                />
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className='space-y-6'>
            <div className='flex items-center space-x-3 border-b border-emerald-200 dark:border-emerald-900 pb-3'>
              <div className='flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900'>
                <Clock className='h-4 w-4 text-emerald-700 dark:text-emerald-300' />
              </div>
              <h4 className='text-xl font-medium text-gray-800 dark:text-gray-100'>
                Booking Details
              </h4>
            </div>

            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='booking_type' className='text-gray-800 dark:text-gray-100'>
                  Experience Type *
                </Label>
                <Select
                  value={formData.booking_type}
                  onValueChange={(value) =>
                    handleSelectChange('booking_type', value)
                  }
                  disabled={!!preselectedService}
                >
                  <SelectTrigger
                    id='booking_type'
                    className='border-gray-300 dark:border-emerald-900 bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 focus:border-emerald-700 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-700/20 dark:focus:ring-emerald-800/40'
                  >
                    <SelectValue placeholder='Select booking type' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='spa'>Spa Treatment</SelectItem>
                    <SelectItem value='restaurant'>
                      Restaurant Reservation
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.booking_type === 'spa' ? (
                <div className='space-y-2'>
                  <Label htmlFor='service' className='text-gray-800 dark:text-gray-100'>
                    Select Treatment *
                  </Label>
                  <Select
                    value={formData.service}
                    onValueChange={(value) =>
                      handleSelectChange('service', value)
                    }
                    disabled={!!preselectedService}
                  >
                    <SelectTrigger
                      id='service'
                      className='border-gray-300 dark:border-emerald-900 bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 focus:border-emerald-700 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-700/20 dark:focus:ring-emerald-800/40'
                    >
                      <SelectValue placeholder='Select a treatment' />
                    </SelectTrigger>
                    <SelectContent>
                      {spaServices.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - ${service.price} ({service.duration}{' '}
                          min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Display selected service details */}
                  {selectedService && (
                    <div className='mt-2 rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950 p-3'>
                      <div className='flex justify-between'>
                        <span className='text-sm font-medium text-emerald-700 dark:text-emerald-300'>
                          Selected treatment:
                        </span>
                        <span className='text-sm font-medium text-gray-700 dark:text-gray-100'>
                          {selectedService.name}
                        </span>
                      </div>
                      <div className='mt-1 flex justify-between'>
                        <span className='text-sm text-emerald-700 dark:text-emerald-300'>
                          Duration:
                        </span>
                        <span className='text-sm text-gray-700 dark:text-gray-100'>
                          {selectedService.duration} minutes
                        </span>
                      </div>
                      <div className='mt-1 flex justify-between'>
                        <span className='text-sm text-emerald-700 dark:text-emerald-300'>Price:</span>
                        <span className='text-sm text-gray-700 dark:text-gray-100'>
                          ${selectedService.price}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className='space-y-2'>
                  <Label htmlFor='party_size' className='text-gray-800 dark:text-gray-100'>
                    Number of Guests *
                  </Label>
                  <Select
                    value={formData.party_size}
                    onValueChange={(value) =>
                      handleSelectChange('party_size', value)
                    }
                  >
                    <SelectTrigger
                      id='party_size'
                      className='border-gray-300 dark:border-emerald-900 bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 focus:border-emerald-700 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-700/20 dark:focus:ring-emerald-800/40'
                    >
                      <SelectValue placeholder='Select party size' />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1} {i === 0 ? 'Person' : 'People'}
                        </SelectItem>
                      ))}
                      <SelectItem value='more'>More than 10 People</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className='grid gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='booking_date' className='text-gray-800 dark:text-gray-100'>
                    Preferred Date *
                  </Label>
                  <Input
                    id='booking_date'
                    name='booking_date'
                    type='date'
                    value={formData.booking_date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className='border-gray-300 dark:border-emerald-900 bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 focus:border-emerald-700 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-700/20 dark:focus:ring-emerald-800/40'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='booking_time' className='text-gray-800 dark:text-gray-100'>
                    Preferred Time *
                  </Label>
                  <Input
                    id='booking_time'
                    name='booking_time'
                    type='time'
                    value={formData.booking_time}
                    onChange={handleInputChange}
                    required
                    className='border-gray-300 dark:border-emerald-900 bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 focus:border-emerald-700 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-700/20 dark:focus:ring-emerald-800/40'
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='notes' className='text-gray-800 dark:text-gray-100'>
                  Special Requests (Optional)
                </Label>
                <Textarea
                  id='notes'
                  name='notes'
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder='Any special requests, allergies, or preferences...'
                  rows={3}
                  className='resize-none border-gray-300 dark:border-emerald-900 bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 focus:border-emerald-700 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-700/20 dark:focus:ring-emerald-800/40'
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className='flex gap-4 pt-6'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={isSubmitting}
              className='flex-1 border-2 border-emerald-300 dark:border-emerald-800 py-4 text-lg text-emerald-800 dark:text-emerald-200 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/40'
            >
              <X className='mr-2 h-4 w-4' />
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isSubmitting}
              className='flex-1 bg-gradient-to-r from-emerald-700 to-emerald-800 dark:from-emerald-900 dark:to-emerald-950 py-4 text-lg text-white shadow-xl hover:from-emerald-800 hover:to-emerald-900 dark:hover:from-emerald-800 dark:hover:to-emerald-900 hover:shadow-emerald-600/25'
            >
              {isSubmitting ? (
                <>
                  <div className='mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-white'></div>
                  Submitting...
                </>
              ) : (
                <>
                  Book Now
                  <Sparkles className='ml-2 h-5 w-5' />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
