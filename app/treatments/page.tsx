'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  Tag,
  DollarSign,
  Search,
  Calendar,
  Flower2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { HeroBookingModal } from '@/components/bookings/hero-booking-modal';
import { useToast } from '@/components/ui/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase';

interface SpaService {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  category?: string;
  status?: string;
  isActive?: boolean;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

const placeholderImage = '/placeholder.svg';

export default function TreatmentsPage() {
  const [services, setServices] = useState<SpaService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState<SpaService | null>(
    null
  );
  const { toast } = useToast();

  useEffect(() => {
    async function loadServices() {
      try {
        setIsLoading(true);
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from('spa_services')
          .select('*')
          .eq('status', 'active');

        if (error) {
          throw error;
        }

        console.log('[TREATMENTS] Loaded active services:', data);
        setServices(data || []);
      } catch (error) {
        console.error('Failed to load active spa services:', error);
        toast({
          title: 'Error',
          description: 'Could not load treatments. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadServices();
  }, [toast]);

  const handleBookNow = (service: SpaService) => {
    setSelectedService(service);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingModal(false);
    toast({
      title: 'Booking Submitted! 🎉',
      description:
        'Your request has been sent. We will contact you shortly to confirm.',
    });
  };

  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (!selectedCategory || service.category === selectedCategory)
  );

  const categories = Array.from(
    new Set(services.map((s) => s.category).filter(Boolean))
  );

  return (
    <>
      {/* Hero Section */}
      <section className='relative mb-8 bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-16 md:py-24'>
        <div className='mx-auto max-w-4xl px-4 text-center'>
          <div className='mb-6 flex justify-center'>
            <span className='inline-flex items-center rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700'>
              <Flower2 className='mr-2 h-5 w-5' />
              Discover Our Treatments
            </span>
          </div>
          <h1 className='mb-4 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl'>
            Spa Treatments Menu
          </h1>
          <p className='mx-auto max-w-2xl text-lg text-gray-600 md:text-xl'>
            Indulge in our curated selection of treatments designed to
            rejuvenate your body and soul. Book your experience today.
          </p>
        </div>
      </section>

      {/* Search & Filter */}
      <div className='container mx-auto mb-10 px-4'>
        <div className='mb-8 flex flex-col items-center gap-4 md:flex-row'>
          <div className='relative w-full flex-1'>
            <Search className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400' />
            <Input
              placeholder='Search treatments...'
              className='pl-10'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className='flex w-full gap-2 overflow-x-auto pb-2 md:w-auto'>
            <Button
              variant={!selectedCategory ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category || null)}
                className='capitalize'
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Treatments Grid */}
        {isLoading ? (
          <div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
            {[...Array(6)].map((_, i) => (
              <Card
                key={i}
                className='animate-pulse overflow-hidden border border-emerald-100 bg-white shadow-lg'
              >
                <div className='h-48 w-full bg-gray-200'></div>
                <CardContent className='p-6'>
                  <div className='mb-2 h-6 w-3/4 rounded bg-gray-200'></div>
                  <div className='mb-4 h-4 w-1/2 rounded bg-gray-200'></div>
                  <div className='h-4 w-full rounded bg-gray-200'></div>
                  <div className='mt-2 h-4 w-full rounded bg-gray-200'></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
            {filteredServices.length > 0 ? (
              filteredServices.map((service) => (
                <Card
                  key={service.id}
                  className='group flex flex-col overflow-hidden border border-emerald-100 bg-white shadow-lg transition-shadow duration-300 hover:shadow-xl'
                >
                  <div className='relative h-48 w-full bg-emerald-50'>
                    <Image
                      src={service.image_url || placeholderImage}
                      alt={service.name}
                      fill
                      sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                      className='object-cover'
                    />
                  </div>
                  <CardContent className='flex flex-grow flex-col p-6'>
                    <h2 className='mb-2 text-2xl font-semibold text-gray-800'>
                      {service.name}
                    </h2>
                    <p className='mb-4 flex-grow text-sm text-gray-600'>
                      {service.description}
                    </p>
                    <div className='mt-auto flex flex-wrap gap-4 border-t pt-4 text-sm text-gray-700'>
                      <div className='flex items-center'>
                        <Clock className='mr-2 h-4 w-4 text-emerald-600' />
                        <span>{service.duration} min</span>
                      </div>
                      <div className='flex items-center'>
                        <DollarSign className='mr-2 h-4 w-4 text-emerald-600' />
                        <span>{Number(service.price).toFixed(2)}</span>
                      </div>
                      {service.category && (
                        <div className='flex items-center'>
                          <Tag className='mr-2 h-4 w-4 text-emerald-600' />
                          <Badge variant='secondary' className='capitalize'>
                            {service.category}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => handleBookNow(service)}
                      className='mt-4 w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white'
                    >
                      <Calendar className='mr-2 h-4 w-4' /> Book Now
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className='col-span-full py-16 text-center text-gray-500'>
                <Flower2 className='mx-auto mb-4 h-16 w-16 text-gray-300' />
                No treatments match your search criteria.
              </p>
            )}
          </div>
        )}
      </div>
      <HeroBookingModal
        showModal={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onSuccess={handleBookingSuccess}
        preselectedService={selectedService}
      />
    </>
  );
}
