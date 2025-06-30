'use client';

import { Button } from '@/components/ui/button';
import {
  Play,
  ArrowRight,
} from 'lucide-react';
import Image from 'next/image';
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
import hero from '@/public/candles.jpg';

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

export function HeroSection() {
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [scrollY, setScrollY] = useState(0);
    const { toast } = useToast();
  
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
  
    const handleInputChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };
  
    const handleSelectChange = (name: string, value: string) => {
      setFormData((prev) => ({ ...prev, [name]: value }));
    };
  
    const handleSubmitBooking = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
  
      try {
        // Validation and booking logic here...
  
        toast({
          title: 'Booking Confirmed! ✅',
          description: 'We look forward to seeing you.',
        });
        setShowBookingModal(false);
      } catch (error) {
        toast({
          title: 'Booking Failed',
          description: 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsSubmitting(false);
      }
    };
    
    return (
        <section className='relative h-screen w-full overflow-hidden'>
          <Image
            src={hero}
            alt='Serene spa setting with candles and flowers'
            layout='fill'
            objectFit='cover'
            className='absolute z-0'
            style={{
              transform: `translateY(${scrollY * 0.3}px)`,
            }}
            priority
          />
          <div className='relative z-10 flex h-full flex-col items-center justify-center bg-black/60 text-center text-white'>
            <div className='container px-4'>
              <h1 className='text-4xl font-extrabold tracking-tight md:text-6xl lg:text-7xl'>
                Experience Unmatched Relaxation & Exquisite Dining
              </h1>
              <p className='mt-4 max-w-2xl text-lg text-gray-200 md:text-xl'>
                Your sanctuary for wellness and a haven for culinary connoisseurs.
                Escape the everyday and indulge your senses.
              </p>
              <div className='mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row'>
                <Button
                  size='lg'
                  className='bg-primary text-white hover:bg-primary/90'
                  onClick={handleBookNow}
                >
                  Book Your Escape
                  <ArrowRight className='ml-2 h-5 w-5' />
                </Button>
                <Button
                  size='lg'
                  variant='outline'
                  className='border-white text-white hover:bg-white hover:text-gray-900'
                  onClick={handleWatchStory}
                >
                  <Play className='mr-2 h-5 w-5' />
                  Watch Our Story
                </Button>
              </div>
            </div>
          </div>
        </section>
    );
} 