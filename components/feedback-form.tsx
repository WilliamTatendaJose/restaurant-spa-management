'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { X, Star, ThumbsUp, ThumbsDown, Flower2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FeedbackFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function FeedbackForm({ onClose, onSuccess }: FeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overallRating, setOverallRating] = useState(0);
  const [serviceQuality, setServiceQuality] = useState(0);
  const [staffFriendliness, setStaffFriendliness] = useState(0);
  const [cleanliness, setCleanliness] = useState(0);
  const [valueForMoney, setValueForMoney] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    service_type: '',
    comments: '',
    improvements: '',
    recommend: '',
    visit_date: '',
  });
  const { toast } = useToast();

  const handleStarClick = (rating: number, ratingType: string) => {
    switch (ratingType) {
      case 'overall':
        setOverallRating(rating);
        break;
      case 'service':
        setServiceQuality(rating);
        break;
      case 'staff':
        setStaffFriendliness(rating);
        break;
      case 'cleanliness':
        setCleanliness(rating);
        break;
      case 'value':
        setValueForMoney(rating);
        break;
      default:
        break;
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (
        !formData.customer_name ||
        !formData.customer_email ||
        !overallRating
      ) {
        toast({
          title: 'Error',
          description:
            'Please fill in all required fields and provide an overall rating',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Submit to API
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          service_type: formData.service_type,
          overall_rating: overallRating,
          service_quality: serviceQuality,
          staff_friendliness: staffFriendliness,
          cleanliness: cleanliness,
          value_for_money: valueForMoney,
          comments: formData.comments,
          recommend: formData.recommend,
          visit_date: formData.visit_date,
          improvements: formData.improvements,
          status: 'pending', // Default status
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Thank You!',
          description: 'Your feedback has been submitted successfully.',
        });
        onSuccess();
        onClose();
      } else {
        toast({
          title: 'Error',
          description:
            result.error || 'Failed to submit feedback. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (
    rating: number,
    hoverRating: number,
    onRatingChange: (rating: number) => void,
    onHover?: (rating: number) => void,
    onLeave?: () => void
  ) => {
    return (
      <div className='flex gap-1 md:gap-2'>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type='button'
            onClick={() => onRatingChange(star)}
            onMouseEnter={onHover ? () => onHover(star) : undefined}
            onMouseLeave={onLeave ? onLeave : undefined}
            className='rounded-sm p-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-700 md:p-1'
            aria-label={`Rate ${star} out of 5 stars`}
          >
            <Star
              className={`h-6 w-6 md:h-8 md:w-8 ${
                star <= (hoverRating || rating)
                  ? 'fill-amber-600 text-amber-600'
                  : 'text-gray-400'
              } transition-colors`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Card className='overflow-hidden rounded-3xl border-emerald-100 bg-white shadow-2xl'>
      <div className='relative'>
        <div className='absolute right-6 top-6 z-10'>
          <Button
            variant='outline'
            size='icon'
            onClick={onClose}
            className='h-10 w-10 rounded-full border border-gray-300 bg-white shadow-md hover:bg-gray-100'
            aria-label='Close feedback form'
          >
            <X className='h-5 w-5 text-gray-700' />
          </Button>
        </div>
        <div className='bg-gradient-to-r from-emerald-700 to-emerald-900 px-8 py-12 text-center text-white'>
          <div className='mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm'>
            <Flower2 className='h-10 w-10 text-white' />
          </div>
          <h2 className='mb-3 text-4xl font-light'>Share Your Experience</h2>
          <div className='mx-auto mb-4 h-px w-16 bg-emerald-300'></div>
          <p className='mx-auto max-w-2xl text-white'>
            Your feedback helps us create better experiences for all our guests.
            Thank you for taking the time to share your thoughts.
          </p>
        </div>
      </div>

      <CardContent className='bg-gray-50 p-4 md:p-8'>
        <form onSubmit={handleSubmit} className='space-y-6 md:space-y-8'>
          {/* Contact Information */}
          <div className='space-y-4 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm md:space-y-6 md:px-6 md:py-4'>
            <h3 className='border-b border-emerald-200 pb-2 text-lg font-medium text-gray-800 md:text-xl'>
              Your Information
            </h3>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6'>
              <div className='space-y-2'>
                <Label
                  htmlFor='customer_name'
                  className='font-medium text-gray-800'
                >
                  Full Name *
                </Label>
                <Input
                  id='customer_name'
                  name='customer_name'
                  value={formData.customer_name}
                  onChange={handleInputChange}
                  placeholder='Enter your name'
                  required
                  className='border-gray-300 bg-white text-gray-800 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20'
                />
              </div>
              <div className='space-y-2'>
                <Label
                  htmlFor='customer_email'
                  className='font-medium text-gray-800'
                >
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
                  className='border-gray-300 bg-white text-gray-800 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20'
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label
                htmlFor='service_type'
                className='font-medium text-gray-800'
              >
                Which service did you experience? *
              </Label>
              <Select
                value={formData.service_type}
                onValueChange={(value) =>
                  handleSelectChange('service_type', value)
                }
              >
                <SelectTrigger className='border-gray-300 bg-white text-gray-800 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20'>
                  <SelectValue placeholder='Select service type' />
                </SelectTrigger>
                <SelectContent className='border border-gray-200 bg-white'>
                  <SelectItem value='spa'>Spa Treatment</SelectItem>
                  <SelectItem value='restaurant'>Restaurant Dining</SelectItem>
                  <SelectItem value='both'>Both Spa & Restaurant</SelectItem>
                  <SelectItem value='other'>Other Services</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='visit_date' className='font-medium text-gray-800'>
                Visit Date (Optional)
              </Label>
              <Input
                id='visit_date'
                name='visit_date'
                type='date'
                value={formData.visit_date}
                onChange={handleInputChange}
                max={new Date().toISOString().split('T')[0]}
                className='border-gray-300 bg-white text-gray-800 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20'
              />
            </div>
          </div>

          {/* Ratings */}
          <div className='space-y-4 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm md:space-y-6 md:px-6 md:py-4'>
            <h3 className='border-b border-emerald-200 pb-2 text-lg font-medium text-gray-800 md:text-xl'>
              Your Ratings
            </h3>
            <div className='space-y-6 md:space-y-8'>
              <div className='space-y-2'>
                <Label className='text-base font-medium text-gray-800'>
                  Overall Experience *
                </Label>
                <div className='flex flex-col gap-2 rounded-md bg-gray-50 p-2 sm:flex-row sm:items-center sm:gap-4 md:p-3'>
                  {renderStars(
                    overallRating,
                    hoveredRating,
                    (rating) => handleStarClick(rating, 'overall'),
                    (rating) => setHoveredRating(rating),
                    () => setHoveredRating(0)
                  )}
                  <span className='rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 md:px-3 md:py-1 md:text-sm'>
                    {hoveredRating || overallRating
                      ? ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][
                          (hoveredRating || overallRating) - 1
                        ]
                      : ''}
                  </span>
                </div>
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6'>
                <div className='space-y-2 rounded-md bg-gray-50 p-2 md:p-3'>
                  <Label className='text-base font-medium text-gray-800'>
                    Service Quality
                  </Label>
                  {renderStars(serviceQuality, 0, (rating) =>
                    handleStarClick(rating, 'service')
                  )}
                </div>
                <div className='space-y-2 rounded-md bg-gray-50 p-2 md:p-3'>
                  <Label className='text-base font-medium text-gray-800'>
                    Staff Friendliness
                  </Label>
                  {renderStars(staffFriendliness, 0, (rating) =>
                    handleStarClick(rating, 'staff')
                  )}
                </div>
                <div className='space-y-2 rounded-md bg-gray-50 p-2 md:p-3'>
                  <Label className='text-base font-medium text-gray-800'>
                    Cleanliness
                  </Label>
                  {renderStars(cleanliness, 0, (rating) =>
                    handleStarClick(rating, 'cleanliness')
                  )}
                </div>
                <div className='space-y-2 rounded-md bg-gray-50 p-2 md:p-3'>
                  <Label className='text-base font-medium text-gray-800'>
                    Value for Money
                  </Label>
                  {renderStars(valueForMoney, 0, (rating) =>
                    handleStarClick(rating, 'value')
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className='space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm'>
            <h3 className='border-b border-emerald-200 pb-2 text-xl font-medium text-gray-800'>
              Your Comments
            </h3>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='comments' className='font-medium text-gray-800'>
                  Please share your experience with us
                </Label>
                <Textarea
                  id='comments'
                  name='comments'
                  value={formData.comments}
                  onChange={handleInputChange}
                  placeholder='What did you enjoy most about your experience?'
                  rows={4}
                  className='resize-none border-gray-300 bg-white text-gray-800 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20'
                />
              </div>
              <div className='space-y-2'>
                <Label
                  htmlFor='improvements'
                  className='font-medium text-gray-800'
                >
                  Any suggestions for improvement?
                </Label>
                <Textarea
                  id='improvements'
                  name='improvements'
                  value={formData.improvements}
                  onChange={handleInputChange}
                  placeholder='How could we make your experience even better?'
                  rows={4}
                  className='resize-none border-gray-300 bg-white text-gray-800 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20'
                />
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className='space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm'>
            <Label className='text-base font-medium text-gray-800'>
              Would you recommend us to friends and family?
            </Label>
            <RadioGroup
              value={formData.recommend}
              onValueChange={(value) => handleSelectChange('recommend', value)}
              className='flex flex-col space-y-2'
            >
              <div className='flex items-center space-x-2 rounded-md p-2 transition-colors hover:bg-emerald-50'>
                <RadioGroupItem
                  value='definitely'
                  id='recommend-definitely'
                  className='border-gray-400 text-emerald-700'
                />
                <Label
                  htmlFor='recommend-definitely'
                  className='flex cursor-pointer items-center gap-2 text-gray-800'
                >
                  <ThumbsUp className='h-4 w-4 text-emerald-700' />
                  Definitely
                </Label>
              </div>
              <div className='flex items-center space-x-2 rounded-md p-2 transition-colors hover:bg-emerald-50'>
                <RadioGroupItem
                  value='probably'
                  id='recommend-probably'
                  className='border-gray-400 text-emerald-700'
                />
                <Label
                  htmlFor='recommend-probably'
                  className='cursor-pointer text-gray-800'
                >
                  Probably
                </Label>
              </div>
              <div className='flex items-center space-x-2 rounded-md p-2 transition-colors hover:bg-emerald-50'>
                <RadioGroupItem
                  value='maybe'
                  id='recommend-maybe'
                  className='border-gray-400 text-emerald-700'
                />
                <Label
                  htmlFor='recommend-maybe'
                  className='cursor-pointer text-gray-800'
                >
                  Maybe
                </Label>
              </div>
              <div className='flex items-center space-x-2 rounded-md p-2 transition-colors hover:bg-emerald-50'>
                <RadioGroupItem
                  value='probably_not'
                  id='recommend-probably-not'
                  className='border-gray-400 text-emerald-700'
                />
                <Label
                  htmlFor='recommend-probably-not'
                  className='cursor-pointer text-gray-800'
                >
                  Probably Not
                </Label>
              </div>
              <div className='flex items-center space-x-2 rounded-md p-2 transition-colors hover:bg-emerald-50'>
                <RadioGroupItem
                  value='definitely_not'
                  id='recommend-definitely-not'
                  className='border-gray-400 text-emerald-700'
                />
                <Label
                  htmlFor='recommend-definitely-not'
                  className='flex cursor-pointer items-center gap-2 text-gray-800'
                >
                  <ThumbsDown className='h-4 w-4 text-red-700' />
                  Definitely Not
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className='flex flex-col gap-3 pt-4 md:flex-row md:gap-4'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={isSubmitting}
              className='w-full border-2 border-gray-300 py-4 text-base font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900 md:flex-1 md:py-6 md:text-lg'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isSubmitting}
              className='w-full bg-gradient-to-r from-emerald-700 to-emerald-800 py-4 text-base font-medium text-white shadow-xl hover:from-emerald-800 hover:to-emerald-900 hover:shadow-emerald-600/25 md:flex-1 md:py-6 md:text-lg'
            >
              {isSubmitting ? (
                <>
                  <div className='mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-white'></div>
                  Submitting...
                </>
              ) : (
                'Submit Feedback'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
