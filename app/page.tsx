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
    <div className='min-h-screen bg-gradient-to-b from-emerald-50 via-stone-50 to-amber-50'>
      {/* Enhanced Navigation Bar */}
      <nav className='fixed top-0 z-50 w-full border-b border-emerald-100/50 bg-white/90 shadow-lg backdrop-blur-xl transition-all duration-300'>
        <div className='mx-auto max-w-7xl px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <div className='relative'>
                <div className='absolute inset-0 rounded-full bg-emerald-500/20 blur-lg'></div>
                <Flower2 className='relative h-10 w-10 text-emerald-600' />
              </div>
              <div>
                <span className='text-2xl font-light tracking-wide text-gray-800'>
                  LEWA
                </span>
                <span className='-mt-1 block text-sm font-medium text-emerald-600'>
                  HEALTH SPA
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className='hidden items-center space-x-8 lg:flex'>
              <a href='#services' className='group relative py-2'>
                <span className='font-medium text-gray-600 transition-colors hover:text-emerald-600'>
                  Services
                </span>
                <div className='absolute bottom-0 left-0 h-0.5 w-0 bg-emerald-600 transition-all duration-300 group-hover:w-full'></div>
              </a>
              <a href='#experience' className='group relative py-2'>
                <span className='font-medium text-gray-600 transition-colors hover:text-emerald-600'>
                  Experience
                </span>
                <div className='absolute bottom-0 left-0 h-0.5 w-0 bg-emerald-600 transition-all duration-300 group-hover:w-full'></div>
              </a>
              <a href='#contact' className='group relative py-2'>
                <span className='font-medium text-gray-600 transition-colors hover:text-emerald-600'>
                  Contact
                </span>
                <div className='absolute bottom-0 left-0 h-0.5 w-0 bg-emerald-600 transition-all duration-300 group-hover:w-full'></div>
              </a>
              <Button
                onClick={handleBookNow}
                className='transform bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-2 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:from-emerald-700 hover:to-emerald-800 hover:shadow-emerald-500/25'
              >
                <Calendar className='mr-2 h-4 w-4' />
                Book Now
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant='ghost'
              size='icon'
              className='lg:hidden'
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className='h-6 w-6' />
              ) : (
                <Menu className='h-6 w-6' />
              )}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className='mt-4 border-t border-emerald-100 pb-4 lg:hidden'>
              <div className='flex flex-col space-y-4 pt-4'>
                <a
                  href='#services'
                  className='font-medium text-gray-600 transition-colors hover:text-emerald-600'
                >
                  Services
                </a>
                <a
                  href='#experience'
                  className='font-medium text-gray-600 transition-colors hover:text-emerald-600'
                >
                  Experience
                </a>
                <a
                  href='#contact'
                  className='font-medium text-gray-600 transition-colors hover:text-emerald-600'
                >
                  Contact
                </a>
                <Button
                  onClick={handleBookNow}
                  className='w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white'
                >
                  <Calendar className='mr-2 h-4 w-4' />
                  Book Now
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <section className='relative flex h-screen items-center justify-center overflow-hidden'>
        {/* Parallax Background */}
        <div
          className='absolute inset-0 transform'
          style={{
            transform: isMobile ? 'none' : `translateY(${scrollY * 0.5}px)`,
          }}
        >
          <Image
            src={hero}
            alt='Luxury Spa Treatment Room'
            fill
            className='scale-110 object-cover'
            priority
          />
          <div className='absolute inset-0 bg-gradient-to-br from-emerald-900/70 via-emerald-800/50 to-amber-900/60'></div>
          <div className='absolute inset-0 bg-black/20'></div>
        </div>

        {/* Animated Background Elements */}
        <div className='absolute inset-0 overflow-hidden'>
          <div className='absolute left-10 top-20 h-32 w-32 animate-pulse rounded-full bg-emerald-400/10 blur-xl'></div>
          <div className='absolute right-20 top-40 h-24 w-24 animate-pulse rounded-full bg-amber-400/10 blur-xl delay-1000'></div>
          <div className='delay-2000 absolute bottom-32 left-1/4 h-40 w-40 animate-pulse rounded-full bg-emerald-500/10 blur-xl'></div>
        </div>

        {/* Hero Content */}
        <div className='relative z-10 mx-auto max-w-6xl px-6 text-center'>
          {/* <div className="mb-8 animate-fade-in-up">
            <div className="flex items-center justify-center mb-6">
              <div className="relative p-4 md:p-6 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 mr-4 md:mr-8">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-amber-400/20 rounded-full blur-lg"></div>
                <Flower2 className="relative h-16 w-16 md:h-20 md:w-20 text-white drop-shadow-2xl" />
              </div>
              <div className="text-left">
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extralight text-white tracking-wider drop-shadow-2xl leading-none">
                  LEWA
                </h1>
                <div className="flex items-center mt-2">
                  <div className="h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent w-10 md:w-20 mr-4"></div>
                  <span className="text-2xl sm:text-3xl md:text-4xl text-amber-200 font-light tracking-wide">
                    HEALTH SPA
                  </span>
                  <div className="h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent w-10 md:w-20 ml-4"></div>
                </div>
              </div>
            </div>
          </div> */}

          <div className='animate-fade-in-up mb-12 delay-300'>
            <p className='mb-6 text-2xl font-light leading-relaxed text-white/95 md:text-3xl lg:text-4xl'>
              Discover Your Sanctuary of Serenity
            </p>
            {/* <p className="text-lg md:text-xl lg:text-2xl text-white/85 max-w-4xl mx-auto leading-relaxed mb-4">
              Indulge in transformative wellness experiences that harmonize
              ancient healing traditions with contemporary luxury in Zimbabwe's
              most prestigious spa destination
            </p> */}
            <p className='mx-auto max-w-3xl text-base leading-relaxed text-white/75 md:text-lg lg:text-xl'>
              Located in the heart of Harare's exclusive Highlands district
            </p>
          </div>

          <div className='animate-fade-in-up flex flex-col items-center justify-center gap-6 delay-500 sm:flex-row'>
            <Button
              size='lg'
              onClick={handleBookNow}
              className='group w-full transform border-2 border-emerald-500/50 bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-5 text-lg text-white shadow-2xl backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:from-emerald-700 hover:to-emerald-800 hover:shadow-emerald-500/30 sm:w-auto md:px-16 md:py-7 md:text-xl'
            >
              <Calendar className='mr-3 h-5 w-5 transition-transform duration-300 group-hover:rotate-12 md:h-6 md:w-6' />
              Begin Your Journey
              <Sparkles className='ml-3 h-5 w-5 transition-transform duration-300 group-hover:scale-110' />
            </Button>

            <Button
              size='lg'
              variant='outline'
              onClick={handleWatchStory}
              className='group w-full border-2 border-white/30 bg-white/5 px-8 py-5 text-lg text-white shadow-xl backdrop-blur-lg transition-all duration-500 hover:border-white/50 hover:bg-white/10 sm:w-auto md:px-14 md:py-7 md:text-xl'
            >
              <Play className='mr-3 h-5 w-5 transition-transform duration-300 group-hover:scale-110 md:h-6 md:w-6' />
              Explore Our Story
            </Button>
          </div>
        </div>
      </section>

      {/* Enhanced Services Section */}
      <section
        id='services'
        className='bg-gradient-to-b from-stone-50 via-white to-emerald-50/30 px-6 py-20 md:py-24 lg:py-32'
      >
        <div className='mx-auto max-w-7xl'>
          <div className='mb-16 text-center md:mb-24'>
            <Badge
              variant='outline'
              className='mb-6 border-emerald-300 bg-emerald-50 px-6 py-2 text-sm font-medium text-emerald-700'
            >
              <Sparkles className='mr-2 h-4 w-4' />
              Our Signature Services
            </Badge>
            <h2 className='mb-6 text-4xl font-extralight tracking-wide text-gray-800 sm:text-5xl md:mb-8 md:text-6xl lg:text-7xl'>
              Wellness & <span className='text-emerald-600'>Beauty</span>
            </h2>
            <div className='mx-auto mb-6 h-px w-24 bg-gradient-to-r from-emerald-400 to-amber-400 md:mb-8'></div>
            <p className='mx-auto max-w-4xl text-lg leading-relaxed text-gray-600 md:text-xl'>
              Experience our signature treatments designed to restore your mind,
              body, and spirit in our luxurious spa environment crafted for
              ultimate relaxation
            </p>
          </div>

          <div className='mb-16 grid items-center gap-12 md:mb-24 lg:grid-cols-2 lg:gap-20'>
            {/* Enhanced Massage Therapy Card */}
            <div className='group order-2 lg:order-1'>
              <Card className='hover:shadow-3xl overflow-hidden border-0 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 shadow-2xl transition-all duration-700'>
                <div className='relative overflow-hidden'>
                  <Image
                    src={massage}
                    alt='Relaxing Massage Therapy'
                    width={700}
                    height={400}
                    className='h-80 w-full object-cover transition-transform duration-1000 group-hover:scale-110'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-emerald-900/80 via-emerald-800/40 to-transparent'></div>
                  <div className='absolute bottom-4 left-4 text-white md:bottom-6 md:left-6'>
                    <div className='mb-3 flex items-center'>
                      <Heart className='mr-3 h-8 w-8 text-rose-300' />
                      <Badge className='border-white/30 bg-white/20 text-white'>
                        Signature Treatment
                      </Badge>
                    </div>
                    <h3 className='text-3xl font-light leading-tight md:text-4xl'>
                      Therapeutic
                      <br />
                      Massage
                    </h3>
                  </div>
                </div>

                <CardContent className='p-6 md:p-10'>
                  <p className='mb-8 text-base leading-relaxed text-gray-600 md:mb-10 md:text-lg'>
                    Indulge in our signature massage treatments that combine
                    traditional techniques with modern wellness practices to
                    melt away stress and restore inner harmony.
                  </p>

                  <div className='mb-8 space-y-4 md:mb-10 md:space-y-6'>
                    <div className='group/item flex items-center text-gray-700 transition-colors hover:text-emerald-600'>
                      <div className='mr-4 h-2 w-2 rounded-full bg-amber-400 transition-colors group-hover/item:bg-emerald-500'></div>
                      <span className='text-base md:text-lg'>
                        Deep Tissue Massage
                      </span>
                    </div>
                    <div className='group/item flex items-center text-gray-700 transition-colors hover:text-emerald-600'>
                      <div className='mr-4 h-2 w-2 rounded-full bg-amber-400 transition-colors group-hover/item:bg-emerald-500'></div>
                      <span className='text-base md:text-lg'>
                        Hot Stone Therapy
                      </span>
                    </div>
                    <div className='group/item flex items-center text-gray-700 transition-colors hover:text-emerald-600'>
                      <div className='mr-4 h-2 w-2 rounded-full bg-amber-400 transition-colors group-hover/item:bg-emerald-500'></div>
                      <span className='text-base md:text-lg'>
                        Aromatherapy Sessions
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleExploreServices}
                    className='group/btn w-full bg-gradient-to-r from-emerald-600 to-emerald-700 py-4 text-base shadow-xl transition-all duration-300 hover:from-emerald-700 hover:to-emerald-800 hover:shadow-emerald-500/25 md:py-6 md:text-lg'
                  >
                    Explore Massage Services
                    <ArrowRight className='ml-2 h-5 w-5 transition-transform duration-300 group-hover/btn:translate-x-2' />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Facial Treatments Card */}
            <div className='group order-1 lg:order-2'>
              <Card className='hover:shadow-3xl overflow-hidden border-0 bg-gradient-to-br from-amber-50 via-white to-amber-50/50 shadow-2xl transition-all duration-700'>
                <div className='relative overflow-hidden'>
                  <Image
                    src={facials}
                    alt='Luxury Facial Treatment'
                    width={700}
                    height={400}
                    className='h-80 w-full object-cover transition-transform duration-1000 group-hover:scale-110'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-amber-900/80 via-amber-800/40 to-transparent'></div>
                  <div className='absolute bottom-4 left-4 text-white md:bottom-6 md:left-6'>
                    <div className='mb-3 flex items-center'>
                      <Award className='mr-3 h-8 w-8 text-amber-300' />
                      <Badge className='border-white/30 bg-white/20 text-white'>
                        Premium Care
                      </Badge>
                    </div>
                    <h3 className='text-3xl font-light leading-tight md:text-4xl'>
                      Facial
                      <br />
                      Rejuvenation
                    </h3>
                  </div>
                </div>

                <CardContent className='p-6 md:p-10'>
                  <p className='mb-8 text-base leading-relaxed text-gray-600 md:mb-10 md:text-lg'>
                    Revitalize your skin with our premium facial treatments
                    using organic products and advanced techniques for a
                    radiant, youthful glow that lasts.
                  </p>

                  <div className='mb-8 space-y-4 md:mb-10 md:space-y-6'>
                    <div className='group/item flex items-center text-gray-700 transition-colors hover:text-amber-600'>
                      <div className='mr-4 h-2 w-2 rounded-full bg-emerald-400 transition-colors group-hover/item:bg-amber-500'></div>
                      <span className='text-base md:text-lg'>
                        Anti-Aging Treatments
                      </span>
                    </div>
                    <div className='group/item flex items-center text-gray-700 transition-colors hover:text-amber-600'>
                      <div className='mr-4 h-2 w-2 rounded-full bg-emerald-400 transition-colors group-hover/item:bg-amber-500'></div>
                      <span className='text-base md:text-lg'>
                        Hydrating Facials
                      </span>
                    </div>
                    <div className='group/item flex items-center text-gray-700 transition-colors hover:text-amber-600'>
                      <div className='mr-4 h-2 w-2 rounded-full bg-emerald-400 transition-colors group-hover/item:bg-amber-500'></div>
                      <span className='text-base md:text-lg'>
                        Organic Skincare
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleExploreServices}
                    className='group/btn w-full bg-gradient-to-r from-amber-600 to-amber-700 py-4 text-base shadow-xl transition-all duration-300 hover:from-amber-700 hover:to-amber-800 hover:shadow-amber-500/25 md:py-6 md:text-lg'
                  >
                    View Facial Services
                    <ArrowRight className='ml-2 h-5 w-5 transition-transform duration-300 group-hover/btn:translate-x-2' />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Enhanced Video/Experience Section */}
          <div className='shadow-3xl relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-100 via-white to-amber-100 p-8 md:p-12 lg:p-16'>
            <div className='absolute inset-0 bg-gradient-to-br from-emerald-50/80 to-amber-50/80'></div>
            <div className='relative text-center'>
              <div className='mb-8'>
                <div className='mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-xl md:h-20 md:w-20'>
                  <Flower2 className='h-8 w-8 text-white md:h-10 md:w-10' />
                </div>
                <h3 className='mb-6 text-3xl font-light text-gray-800 sm:text-4xl md:text-5xl'>
                  Experience <span className='text-emerald-600'>Serenity</span>
                </h3>
                <div className='mx-auto mb-6 h-px w-16 bg-gradient-to-r from-emerald-400 to-amber-400'></div>
                <p className='mx-auto mb-8 max-w-3xl text-lg leading-relaxed text-gray-600 md:text-xl'>
                  Step into our tranquil spa environment where every detail is
                  designed for your relaxation and every moment is crafted for
                  your wellbeing
                </p>
              </div>
              <Button
                size='lg'
                onClick={handleWatchStory}
                className='border-2 border-emerald-600/30 bg-gradient-to-r from-emerald-600/20 to-amber-600/20 px-4 py-2 text-sm text-emerald-800 shadow-xl backdrop-blur-sm transition-all duration-300 hover:from-emerald-600/30 hover:to-amber-600/30 hover:text-emerald-900 hover:shadow-2xl sm:px-6 sm:py-3 sm:text-base'
              >
                <Play className='mr-3 h-4 w-4 sm:h-5 sm:w-5' />
                Take a Virtual Tour
                <Sparkles className='ml-3 h-4 w-4 sm:h-5 sm:w-5' />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Experience Section */}
      <section
        id='experience'
        className='bg-gradient-to-br from-stone-100 via-emerald-50/30 to-amber-50/30 py-20 md:py-24 lg:py-32'
      >
        <div className='mx-auto max-w-7xl px-6'>
          <div className='mb-16 text-center md:mb-24'>
            <Badge
              variant='outline'
              className='mb-6 border-amber-300 bg-amber-50 px-6 py-2 text-sm font-medium text-amber-700'
            >
              <Award className='mr-2 h-4 w-4' />
              The LEWA Experience
            </Badge>
            <h2 className='mb-6 text-4xl font-extralight tracking-wide text-gray-800 sm:text-5xl md:mb-8 md:text-6xl lg:text-7xl'>
              Your Wellness <span className='text-amber-600'>Journey</span>
            </h2>
            <div className='mx-auto mb-6 h-px w-24 bg-gradient-to-r from-amber-400 to-emerald-400 md:mb-8'></div>
            <p className='mx-auto max-w-4xl text-lg leading-relaxed text-gray-600 md:text-xl'>
              Every moment crafted for your wellbeing and inner peace through
              our holistic approach to luxury wellness
            </p>
          </div>

          <div className='grid gap-8 md:grid-cols-2 md:gap-12 lg:grid-cols-3'>
            {/* Enhanced Feature Cards */}
            <div className='group cursor-pointer text-center'>
              <div className='relative mb-10'>
                <div className='flex h-56 w-full items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-200 via-emerald-300 to-emerald-400 shadow-xl transition-all duration-700 group-hover:scale-105 group-hover:shadow-2xl sm:h-64'>
                  <div className='absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent'></div>
                  <Flower2 className='relative h-20 w-20 text-emerald-800 transition-transform duration-500 group-hover:rotate-12' />
                </div>
                <div className='absolute -bottom-4 left-1/2 h-8 w-8 -translate-x-1/2 transform rounded-full border-4 border-emerald-100 bg-white shadow-lg'></div>
              </div>
              <h3 className='mb-6 text-2xl font-light text-gray-800 transition-colors group-hover:text-emerald-600 md:text-3xl'>
                Serene Atmosphere
              </h3>
              <p className='text-base leading-relaxed text-gray-600 md:text-lg'>
                Immerse yourself in carefully curated spaces designed for
                ultimate relaxation, peace, and spiritual renewal
              </p>
            </div>

            <div className='group cursor-pointer text-center'>
              <div className='relative mb-10'>
                <div className='flex h-56 w-full items-center justify-center rounded-3xl bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400 shadow-xl transition-all duration-700 group-hover:scale-105 group-hover:shadow-2xl sm:h-64'>
                  <div className='absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent'></div>
                  <Heart className='relative h-20 w-20 text-amber-800 transition-transform duration-500 group-hover:scale-110' />
                </div>
                <div className='absolute -bottom-4 left-1/2 h-8 w-8 -translate-x-1/2 transform rounded-full border-4 border-amber-100 bg-white shadow-lg'></div>
              </div>
              <h3 className='mb-6 text-2xl font-light text-gray-800 transition-colors group-hover:text-amber-600 md:text-3xl'>
                Expert Care
              </h3>
              <p className='text-base leading-relaxed text-gray-600 md:text-lg'>
                Our skilled therapists provide personalized attention and expert
                care tailored to your unique wellness journey
              </p>
            </div>

            <div className='group cursor-pointer text-center md:col-span-2 lg:col-span-1'>
              <div className='relative mb-10'>
                <div className='flex h-56 w-full items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-200 via-amber-200 to-emerald-300 shadow-xl transition-all duration-700 group-hover:scale-105 group-hover:shadow-2xl sm:h-64'>
                  <div className='absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent'></div>
                  <Award className='relative h-20 w-20 text-emerald-800 transition-transform duration-500 group-hover:rotate-12' />
                </div>
                <div className='absolute -bottom-4 left-1/2 h-8 w-8 -translate-x-1/2 transform rounded-full border-4 border-emerald-100 bg-white shadow-lg'></div>
              </div>
              <h3 className='mb-6 text-2xl font-light text-gray-800 transition-colors group-hover:text-emerald-600 md:text-3xl'>
                Premium Treatments
              </h3>
              <p className='text-base leading-relaxed text-gray-600 md:text-lg'>
                Experience luxury treatments using the finest organic products
                and time-honored techniques for lasting results
              </p>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className='mt-20 grid grid-cols-2 gap-8 text-center md:grid-cols-4'>
            <div className='group'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 transition-transform duration-300 group-hover:scale-110'>
                <Users className='h-8 w-8 text-emerald-600' />
              </div>
              <div className='text-2xl font-light text-gray-800'>100+</div>
              <div className='text-sm uppercase tracking-wide text-gray-600'>
                Happy Clients
              </div>
            </div>
            <div className='group'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200 transition-transform duration-300 group-hover:scale-110'>
                <Sparkles className='h-8 w-8 text-amber-600' />
              </div>
              <div className='text-2xl font-light text-gray-800'>15+</div>
              <div className='text-sm uppercase tracking-wide text-gray-600'>
                Treatments
              </div>
            </div>
            <div className='group'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 transition-transform duration-300 group-hover:scale-110'>
                <Award className='h-8 w-8 text-emerald-600' />
              </div>
              <div className='text-2xl font-light text-gray-800'>Service</div>
              <div className='text-sm uppercase tracking-wide text-gray-600'>
                Excellence
              </div>
            </div>
            <div className='group'>
              <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200 transition-transform duration-300 group-hover:scale-110'>
                <Shield className='h-8 w-8 text-amber-600' />
              </div>
              <div className='text-2xl font-light text-gray-800'>100%</div>
              <div className='text-sm uppercase tracking-wide text-gray-600'>
                Natural
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW: Feedback Section */}
      <section className='bg-gradient-to-br from-white via-emerald-50/20 to-amber-50/20 px-6 py-20 md:py-24 lg:py-32'>
        <div className='mx-auto max-w-7xl'>
          <div className='mb-16 text-center md:mb-20'>
            <Badge
              variant='outline'
              className='mb-6 border-emerald-300 bg-emerald-50 px-6 py-2 text-sm font-medium text-emerald-700'
            >
              <Heart className='mr-2 h-4 w-4' />
              Guest Testimonials
            </Badge>
            <h2 className='mb-6 text-4xl font-extralight tracking-wide text-gray-800 sm:text-5xl md:mb-8 md:text-6xl lg:text-7xl'>
              Our Guests <span className='text-emerald-600'>Love Us</span>
            </h2>
            <div className='mx-auto mb-6 h-px w-24 bg-gradient-to-r from-emerald-400 to-amber-400 md:mb-8'></div>
            <p className='mx-auto max-w-4xl text-lg leading-relaxed text-gray-600 md:text-xl'>
              Discover what our guests have to say about their experiences at
              LEWA Luxury Spa
            </p>
          </div>

          <div className='grid items-center gap-8 md:gap-16 lg:grid-cols-2'>
            {/* Feedback Display */}
            <div className='lg:order-2'>
              <FeedbackDisplay />
            </div>

            {/* Feedback Benefits */}
            <div className='space-y-8 lg:order-1'>
              <div className='group flex items-start space-x-4 md:space-x-6'>
                <div className='flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 transition-transform duration-300 group-hover:scale-110'>
                  <Star className='h-8 w-8 text-emerald-600' />
                </div>
                <div>
                  <h3 className='mb-2 text-lg font-medium text-gray-800 transition-colors group-hover:text-emerald-600 md:text-xl'>
                    Authentic Experiences
                  </h3>
                  <p className='leading-relaxed text-gray-600'>
                    Real testimonials from our valued guests who have
                    experienced our premium services firsthand
                  </p>
                </div>
              </div>

              <div className='group flex items-start space-x-4 md:space-x-6'>
                <div className='flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200 transition-transform duration-300 group-hover:scale-110'>
                  <MessageSquare className='h-8 w-8 text-amber-600' />
                </div>
                <div>
                  <h3 className='mb-2 text-lg font-medium text-gray-800 transition-colors group-hover:text-amber-600 md:text-xl'>
                    Your Voice Matters
                  </h3>
                  <p className='leading-relaxed text-gray-600'>
                    We value your feedback and continuously improve our services
                    based on guest suggestions
                  </p>
                </div>
              </div>

              <div className='group flex items-start space-x-4 md:space-x-6'>
                <div className='flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-amber-100 transition-transform duration-300 group-hover:scale-110'>
                  <Award className='h-8 w-8 text-emerald-600' />
                </div>
                <div>
                  <h3 className='mb-2 text-lg font-medium text-gray-800 transition-colors group-hover:text-emerald-600 md:text-xl'>
                    Recognized Excellence
                  </h3>
                  <p className='leading-relaxed text-gray-600'>
                    Join the hundreds of satisfied guests who have experienced
                    our award-winning services
                  </p>
                </div>
              </div>

              <Button
                size='lg'
                onClick={() => setShowFeedbackModal(true)}
                className='w-full transform bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 text-base text-white shadow-xl transition-all duration-300 hover:scale-105 hover:from-emerald-700 hover:to-emerald-800 hover:shadow-emerald-500/25 sm:w-auto sm:px-8 sm:text-lg md:px-12 md:text-xl'
              >
                <Heart className='mr-3 h-6 w-6' />
                Share Your Feedback
                <Sparkles className='ml-3 h-5 w-5' />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Contact Section */}
      <section
        id='contact'
        className='bg-gradient-to-br from-emerald-50 via-white to-stone-50 px-6 py-20 md:py-24 lg:py-32'
      >
        <div className='mx-auto max-w-6xl'>
          <div className='mb-16 text-center md:mb-20'>
            <Badge
              variant='outline'
              className='mb-6 border-emerald-300 bg-emerald-50 px-6 py-2 text-sm font-medium text-emerald-700'
            >
              <MapPin className='mr-2 h-4 w-4' />
              Visit Us Today
            </Badge>
            <h2 className='mb-6 text-4xl font-extralight tracking-wide text-gray-800 sm:text-5xl md:mb-8 md:text-6xl lg:text-7xl'>
              Visit Our Spa <span className='text-emerald-600'>Sanctuary</span>
            </h2>
            <div className='mx-auto mb-6 h-px w-24 bg-gradient-to-r from-emerald-400 to-amber-400 md:mb-8'></div>
            <p className='mx-auto max-w-3xl text-lg leading-relaxed text-gray-600 md:text-xl'>
              Located in the heart of Harare's prestigious Highlands district
            </p>
          </div>

          <div className='mb-16 grid gap-8 md:mb-20 md:grid-cols-2 md:gap-12 lg:grid-cols-3'>
            {/* Enhanced Contact Cards */}
            <Card className='group overflow-hidden border-0 bg-gradient-to-br from-white to-emerald-50/30 text-center shadow-xl transition-all duration-500 hover:shadow-2xl'>
              <CardContent className='p-8 md:p-10'>
                <div className='mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-xl transition-transform duration-300 group-hover:scale-110 md:h-20 md:w-20'>
                  <MapPin className='h-8 w-8 text-white md:h-10 md:w-10' />
                </div>
                <h3 className='mb-6 text-xl font-light text-gray-800 transition-colors group-hover:text-emerald-600 md:text-2xl'>
                  Our Location
                </h3>
                <div className='space-y-2 text-base leading-relaxed text-gray-600 md:text-lg'>
                  <p>29 Montgomery Road</p>
                  <p>Highlands, Harare</p>
                  <p>Zimbabwe</p>
                </div>
              </CardContent>
            </Card>

            <Card className='group overflow-hidden border-0 bg-gradient-to-br from-white to-amber-50/30 text-center shadow-xl transition-all duration-500 hover:shadow-2xl'>
              <CardContent className='p-8 md:p-10'>
                <div className='mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600 shadow-xl transition-transform duration-300 group-hover:scale-110 md:h-20 md:w-20'>
                  <Phone className='h-8 w-8 text-white md:h-10 md:w-10' />
                </div>
                <h3 className='mb-6 text-xl font-light text-gray-800 transition-colors group-hover:text-amber-600 md:text-2xl'>
                  Contact Us
                </h3>
                <div className='space-y-2 text-base leading-relaxed text-gray-600 md:text-lg'>
                  <p>+263 78 004 5833</p>
                  <p>info@lewa.co.zw</p>
                  <p>www.lewa.co.zw</p>
                </div>
              </CardContent>
            </Card>

            {/* Replace static opening hours with dynamic display */}
            <div className='md:col-span-2 lg:col-span-1'>
              <OperatingHoursDisplay />
            </div>
          </div>

          {/* Enhanced CTA Section */}
          <div className='relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 to-emerald-800 p-8 text-center text-white md:p-12 lg:p-16'>
            <div className='absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-amber-600/20'></div>
            <div className='relative'>
              <h3 className='mb-6 text-2xl font-light md:text-3xl lg:text-4xl'>
                Ready to Begin Your Wellness Journey?
              </h3>
              <p className='mx-auto mb-10 max-w-2xl text-lg text-emerald-100 md:text-xl'>
                Book your appointment today and experience the ultimate in
                luxury spa treatments
              </p>
              <div className='flex flex-col items-center justify-center gap-6 sm:flex-row'>
                <Button
                  size='lg'
                  onClick={handleBookNow}
                  className='w-full transform border-2 border-white/20 bg-white px-8 py-5 text-lg text-emerald-800 shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-emerald-50 hover:shadow-white/25 sm:w-auto md:px-16 md:py-6 md:text-xl'
                >
                  <Calendar className='mr-3 h-6 w-6' />
                  Book Your Treatment
                  <Sparkles className='ml-3 h-5 w-5' />
                </Button>
                <Link
                  href='/dashboard'
                  className='inline-block w-full sm:w-auto'
                >
                  <Button
                    size='lg'
                    variant='ghost'
                    className='w-full border-2 border-white/30 px-8 py-5 text-lg text-white transition-all duration-300 hover:border-white/50 hover:bg-white/10 md:px-12 md:py-6 md:text-xl'
                  >
                    Staff Portal
                    <ArrowRight className='ml-2 h-5 w-5' />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className='bg-gradient-to-br from-gray-900 via-emerald-900 to-gray-900 py-16 text-white md:py-20'>
        <div className='mx-auto max-w-7xl px-6'>
          <div className='text-center'>
            <div className='mb-8 flex items-center justify-center'>
              <div className='relative'>
                <div className='absolute inset-0 rounded-full bg-emerald-400/20 blur-lg'></div>
                <Flower2 className='relative mr-4 h-10 w-10 text-emerald-400 md:h-12 md:w-12' />
              </div>
              <div>
                <span className='text-3xl font-extralight tracking-wide md:text-4xl'>
                  LEWA
                </span>
                <span className='-mt-1 block text-base font-light text-emerald-400 md:text-lg'>
                  HEALTH SPA
                </span>
              </div>
            </div>
            <p className='mx-auto mb-10 max-w-3xl text-base leading-relaxed text-emerald-100 md:text-lg'>
              Escape to tranquility and rejuvenation. Experience the perfect
              harmony of wellness and luxury in Zimbabwe's premier spa
              destination.
            </p>
            <div className='mb-12 flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-8 sm:space-y-0'>
              <a
                href='#'
                className='text-base text-emerald-300 transition-colors hover:text-emerald-200'
              >
                Privacy Policy
              </a>
              <a
                href='#'
                className='text-base text-emerald-300 transition-colors hover:text-emerald-200'
              >
                Terms of Service
              </a>
              <a
                href='#contact'
                className='text-base text-emerald-300 transition-colors hover:text-emerald-200'
              >
                Contact
              </a>
              {/* Show button to reveal developer contact form */}
              <div className='mt-0'>
                {!showDeveloperContact ? (
                  <button
                    className='text-base text-emerald-300 underline transition-colors hover:text-emerald-100'
                    onClick={() => setShowDeveloperContact(true)}
                  >
                    Developer Contact
                  </button>
                ) : (
                  <div className='relative z-50'>
                    <button
                      className='absolute right-0 top-0 p-2 text-2xl font-bold text-emerald-700 hover:text-emerald-900'
                      onClick={() => setShowDeveloperContact(false)}
                      title='Close'
                    >
                      ×
                    </button>
                    <DeveloperContact />
                  </div>
                )}
              </div>
            </div>
            <div className='border-t border-emerald-800/50 pt-8'>
              <p className='text-base text-emerald-400 md:text-lg'>
                &copy; {new Date().getFullYear()} LEWA HEALTH Spa. All rights
                reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Feedback Button */}
      <div className='fixed bottom-6 right-6 z-40'>
        <Button
          onClick={() => setShowFeedbackModal(true)}
          className='group h-14 w-14 transform rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:from-emerald-700 hover:to-emerald-800 hover:shadow-emerald-500/25 sm:h-16 sm:w-16'
          title='Share Your Feedback'
        >
          <Heart className='h-6 w-6 transition-transform duration-300 group-hover:scale-110' />
        </Button>
      </div>

      {/* Enhanced Booking Modal */}
      {showBookingModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm'>
          <div className='shadow-3xl max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-emerald-100 bg-white p-4 sm:p-8'>
            <div className='mb-8 text-center'>
              <div className='mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600'>
                <Calendar className='h-8 w-8 text-white' />
              </div>
              <h3 className='mb-3 text-3xl font-light text-gray-800 md:text-4xl'>
                Book Your <span className='text-emerald-600'>Experience</span>
              </h3>
              <div className='mx-auto mb-4 h-px w-16 bg-gradient-to-r from-emerald-400 to-amber-400'></div>
              <p className='text-base text-gray-600 md:text-lg'>
                Fill out the form below and we'll confirm your booking shortly
              </p>
            </div>

            <form
              onSubmit={handleSubmitBooking}
              className='space-y-6 md:space-y-8'
            >
              {/* Enhanced form sections with better styling */}
              <div className='space-y-4 md:space-y-6'>
                <div className='flex items-center space-x-3 border-b border-emerald-100 pb-3'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100'>
                    <Users className='h-4 w-4 text-emerald-600' />
                  </div>
                  <h4 className='text-lg font-medium text-gray-800 md:text-xl'>
                    Contact Information
                  </h4>
                </div>

                <div className='space-y-4'>
                  <div className='grid gap-4 md:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label htmlFor='customer_name'>Full Name *</Label>
                      <Input
                        id='customer_name'
                        name='customer_name'
                        value={formData.customer_name}
                        onChange={handleInputChange}
                        placeholder='Enter your full name'
                        required
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='customer_phone'>Phone Number *</Label>
                      <Input
                        id='customer_phone'
                        name='customer_phone'
                        value={formData.customer_phone}
                        onChange={handleInputChange}
                        placeholder='+263 xxx xxx xxx'
                        required
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='customer_email'>Email Address *</Label>
                    <Input
                      id='customer_email'
                      name='customer_email'
                      type='email'
                      value={formData.customer_email}
                      onChange={handleInputChange}
                      placeholder='your.email@example.com'
                      required
                    />
                  </div>
                </div>
              </div>

              <div className='space-y-4 md:space-y-6'>
                <div className='flex items-center space-x-3 border-b border-emerald-100 pb-3'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100'>
                    <Calendar className='h-4 w-4 text-emerald-600' />
                  </div>
                  <h4 className='text-lg font-medium text-gray-800 md:text-xl'>
                    Booking Details
                  </h4>
                </div>

                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='booking_type'>Experience Type *</Label>
                    <Select
                      value={formData.booking_type}
                      onValueChange={(value) =>
                        handleSelectChange('booking_type', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='spa'>Spa Treatment</SelectItem>
                        <SelectItem value='restaurant'>
                          Restaurant Dining
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.booking_type === 'spa' ? (
                    <div className='space-y-2'>
                      <Label htmlFor='service'>Select Spa Service *</Label>
                      <Select
                        value={formData.service}
                        onValueChange={(value) =>
                          handleSelectChange('service', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Choose your treatment' />
                        </SelectTrigger>
                        <SelectContent>
                          {spaServices.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name} - ${service.price} (
                              {service.duration} min)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className='space-y-2'>
                      <Label htmlFor='party_size'>Party Size *</Label>
                      <Select
                        value={formData.party_size}
                        onValueChange={(value) =>
                          handleSelectChange('party_size', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Number of guests' />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((size) => (
                            <SelectItem key={size} value={size.toString()}>
                              {size} {size === 1 ? 'person' : 'people'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className='grid gap-4 md:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label htmlFor='booking_date'>Preferred Date *</Label>
                      <Input
                        id='booking_date'
                        name='booking_date'
                        type='date'
                        value={formData.booking_date}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='booking_time'>Preferred Time *</Label>
                      <Input
                        id='booking_time'
                        name='booking_time'
                        type='time'
                        value={formData.booking_time}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='notes'>Special Requests (Optional)</Label>
                    <Textarea
                      id='notes'
                      name='notes'
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder='Any special requests, allergies, or preferences...'
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Enhanced action buttons */}
              <div className='flex flex-col gap-4 pt-6 sm:flex-row'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setShowBookingModal(false)}
                  disabled={isSubmitting}
                  className='flex-1 border-2 border-emerald-200 py-3 text-base text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 md:py-4 md:text-lg'
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={isSubmitting}
                  className='flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 py-3 text-base shadow-xl hover:from-emerald-700 hover:to-emerald-800 hover:shadow-emerald-500/25 md:py-4 md:text-lg'
                >
                  {isSubmitting ? (
                    <>
                      <div className='mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-white'></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Booking Request
                      <Sparkles className='ml-2 h-5 w-5' />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW: Feedback Modal */}
      {showFeedbackModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm'>
          <div className='max-h-[90vh] w-full max-w-4xl overflow-y-auto'>
            <FeedbackForm
              onClose={() => setShowFeedbackModal(false)}
              onSuccess={handleFeedbackSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
}
