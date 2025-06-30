'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface OperatingHour {
  day: string;
  opens_at: string;
  closes_at: string;
  is_closed: boolean;
  day_order: number;
}

export function OperatingHoursDisplay() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(false);
  }, []);

  const formatTime = (time: string) => {
    if (!time) return '';
    try {
      const [hours, minutes] = time.split(':');
      const timeValue = new Date();
      timeValue.setHours(parseInt(hours), parseInt(minutes));
      return timeValue
        .toLocaleTimeString('en-US', {
          hour: 'numeric',
          hour12: true,
        })
        .toUpperCase();
    } catch (error) {
      console.error('Error formatting time:', error);
      return time;
    }
  };

  if (loading) {
    return (
      <Card className='group overflow-hidden border-0 bg-gradient-to-br from-white to-amber-50/30 text-center shadow-xl transition-all duration-500 hover:shadow-2xl'>
        <CardContent className='p-10'>
          <div className='animate-pulse'>
            <div className='mx-auto mb-8 h-20 w-20 rounded-full bg-amber-200'></div>
            <div className='mx-auto mb-6 h-6 w-1/2 rounded bg-amber-100'></div>
            <div className='space-y-3'>
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className='mx-auto h-4 w-2/3 rounded bg-amber-50'
                ></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className='group overflow-hidden border-0 bg-gradient-to-br from-white to-amber-50/30 text-center shadow-xl transition-all duration-500 hover:shadow-2xl'>
        <CardContent className='p-10'>
          <div className='mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600 shadow-xl'>
            <Clock className='h-10 w-10 text-white' />
          </div>
          <h3 className='mb-6 text-2xl font-light text-gray-800'>
            Opening Hours
          </h3>
          <p className='leading-relaxed text-gray-600'>
            Temporarily unavailable. Please contact us for current operating
            hours.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='group overflow-hidden border-0 bg-gradient-to-br from-white to-amber-50/30 text-center shadow-xl transition-all duration-500 hover:shadow-2xl'>
      <CardContent className='p-10'>
        <div className='mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600 shadow-xl transition-transform duration-300 group-hover:scale-110'>
          <Clock className='h-10 w-10 text-white' />
        </div>
        <h3 className='mb-6 text-2xl font-light text-gray-800 transition-colors group-hover:text-amber-600'>
          Opening Hours
        </h3>
        <div className='space-y-4 text-lg leading-relaxed text-gray-600'>
          <div className='flex items-center justify-between py-1'>
            <span className='font-medium'>Sunday-Friday</span>
            <span>9AM - 9PM</span>
          </div>
          <div className='flex items-center justify-between py-1'>
            <span className='font-medium'>Saturday</span>
            <span className='text-red-500'>Closed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
