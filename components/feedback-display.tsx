'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

interface Feedback {
  id: string;
  customer_name: string;
  overall_rating: number;
  service_quality: number;
  staff_friendliness: number;
  cleanliness: number;
  value_for_money: number;
  comments: string;
  recommend: string;
  status: string;
  service_type: string;
}

export function FeedbackDisplay() {
  const [publishedFeedback, setPublishedFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [averageRating, setAverageRating] = useState(0);

  const fetchPublishedFeedback = async () => {
    try {
      const response = await fetch('/api/feedback');
      const result = await response.json();

      if (result.success) {
        // Filter for published feedback only
        const published = result.data.filter(
          (f: Feedback) => f.status === 'published'
        );
        setPublishedFeedback(published);

        // Calculate average overall rating
        if (published.length > 0) {
          const totalRating = published.reduce(
            (sum: number, feedback: Feedback) => sum + feedback.overall_rating,
            0
          );
          setAverageRating(
            parseFloat((totalRating / published.length).toFixed(1))
          );
        }
      } else {
        setError(result.error || 'Failed to fetch feedback');
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      setError('Failed to load feedback data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublishedFeedback();
  }, []);

  const goToNext = () => {
    if (publishedFeedback.length > 0) {
      setCurrentIndex(
        (prevIndex) => (prevIndex + 1) % publishedFeedback.length
      );
    }
  };

  const goToPrevious = () => {
    if (publishedFeedback.length > 0) {
      setCurrentIndex((prevIndex) =>
        prevIndex === 0 ? publishedFeedback.length - 1 : prevIndex - 1
      );
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className='flex'>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating ? 'fill-amber-500 text-amber-500' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className='py-8 text-center'>
        <div className='mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-700'></div>
        <p className='mt-4 text-sm text-gray-500'>Loading testimonials...</p>
      </div>
    );
  }

  if (error) {
    return null; // Don't show errors on the public homepage
  }

  if (publishedFeedback.length === 0) {
    return null; // Don't show empty states on the public homepage
  }

  const currentFeedback = publishedFeedback[currentIndex];

  return (
    <div className='relative'>
      <div className='mb-8 text-center'>
        <h3 className='mb-3 text-3xl font-light text-gray-800'>
          Guest Experiences
        </h3>
        <div className='flex items-center justify-center gap-4'>
          {renderStars(averageRating)}
          <span className='text-2xl font-semibold text-amber-600'>
            {averageRating}
          </span>
          <span className='text-gray-500'>
            ({publishedFeedback.length} reviews)
          </span>
        </div>
      </div>

      <div className='relative'>
        <Card className='overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 to-emerald-800 p-12 text-white shadow-2xl'>
          {/* Decorative elements */}
          <div className='absolute left-6 top-6 opacity-20'>
            <Quote className='h-16 w-16 text-emerald-400' />
          </div>
          <div className='absolute bottom-6 right-6 opacity-20'>
            <Quote className='h-16 w-16 rotate-180 text-emerald-400' />
          </div>

          <CardContent className='min-h-[220px] p-0'>
            <blockquote className='relative z-10 mx-auto mb-8 max-w-3xl text-center text-xl font-light italic text-emerald-50'>
              "{currentFeedback.comments}"
            </blockquote>

            <div className='text-center'>
              <div className='mb-2 flex justify-center'>
                {renderStars(currentFeedback.overall_rating)}
              </div>
              <p className='text-lg font-medium text-emerald-100'>
                {currentFeedback.customer_name}
              </p>
              <p className='text-sm text-emerald-300'>
                {currentFeedback.service_type === 'spa' && 'Spa Guest'}
                {currentFeedback.service_type === 'restaurant' &&
                  'Restaurant Guest'}
                {currentFeedback.service_type === 'both' &&
                  'Spa & Restaurant Guest'}
                {(!currentFeedback.service_type ||
                  currentFeedback.service_type === 'other') &&
                  'Guest'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        {publishedFeedback.length > 1 && (
          <div className='pointer-events-none absolute top-1/2 flex w-full -translate-y-1/2 justify-between'>
            <Button
              onClick={goToPrevious}
              variant='ghost'
              size='icon'
              className='pointer-events-auto h-12 w-12 -translate-x-1/2 transform rounded-full bg-white/80 text-emerald-800 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-white'
            >
              <ChevronLeft className='h-6 w-6' />
            </Button>
            <Button
              onClick={goToNext}
              variant='ghost'
              size='icon'
              className='pointer-events-auto h-12 w-12 translate-x-1/2 transform rounded-full bg-white/80 text-emerald-800 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-white'
            >
              <ChevronRight className='h-6 w-6' />
            </Button>
          </div>
        )}

        {/* Pagination dots */}
        {publishedFeedback.length > 1 && (
          <div className='mt-6 flex justify-center gap-2'>
            {publishedFeedback.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-6 bg-emerald-600'
                    : 'w-2 bg-emerald-200'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
