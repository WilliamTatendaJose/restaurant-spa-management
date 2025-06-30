'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Phone,
  MapPin,
  Clock,
  Star,
  Play,
  ArrowRight,
  Heart,
  Award,
  Flower2,
  Sparkles,
  Users,
  Shield,
  Menu,
  X,
  MessageSquare,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { bookingsApi, spaServicesApi, customersApi } from '@/lib/db';
import { FeedbackForm } from '@/components/feedback-form';
import { FeedbackDisplay } from '@/components/feedback-display';
import { OperatingHoursDisplay } from '@/components/operating-hours-display';
import { DeveloperContact } from '@/components/developer-contact';
import hero from '@/public/candles.jpg';
import facials from '@/public/facial.jpg';
import massage from '@/public/massage.jpg';

interface SpaService {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  visits?: number;
}

export default function HomePage() {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [showDeveloperContact, setShowDeveloperContact] = useState(false);
  const { toast } = useToast();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Scroll effect for parallax
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Booking form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [spaServices, setSpaServices] = useState<SpaService[]>([]);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    booking_date: '',
    booking_time: '',
    booking_type: 'spa',
    service: '',
    party_size: '',
    notes: '',
  });

  const handleBookNow = async () => {
    // Load spa services when modal opens
    try {
      const services = await spaServicesApi.list();
      setSpaServices(services as SpaService[]);
    } catch (error) {
      console.error('Error loading services:', error);
    }
    setShowBookingModal(true);
  };

  const handleWatchStory = () => {
    window.open(
      'https://www.facebook.com/profile.php?id=61575636925432',
      '_blank'
    );
  };

  const handleExploreServices = () => {
    window.location.href = '/treatments';
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFeedbackSuccess = () => {
    toast({
      title: 'Thank You! 🎉',
      description: 'Your feedback helps us improve our services.',
    });
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
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
        return;
      }

      if (formData.booking_type === 'spa' && !formData.service) {
        toast({
          title: 'Error',
          description: 'Please select a spa service',
          variant: 'destructive',
        });
        return;
      }

      if (formData.booking_type === 'restaurant' && !formData.party_size) {
        toast({
          title: 'Error',
          description: 'Please specify party size for restaurant booking',
          variant: 'destructive',
        });
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
        const existingCustomer = (existingCustomers as Customer[]).find(
          (c: Customer) =>
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
        customer_email: formData.customer_email, // Add email to booking data
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

      // Reset form and close modal
      setFormData({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        booking_date: '',
        booking_time: '',
        booking_type: 'spa',
        service: '',
        party_size: '',
        notes: '',
      });
      setShowBookingModal(false);
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

  return (
    <div className='flex flex-col min-h-screen bg-gray-50'>
      <main className='flex-1'>
        {/* HERO SECTION TO BE EXTRACTED */}
        <section className='relative h-screen w-full overflow-hidden'>
          <p>Hero section will be here</p>
        </section>
        {/* The rest of the page */}
      </main>
    </div>
  );
}
