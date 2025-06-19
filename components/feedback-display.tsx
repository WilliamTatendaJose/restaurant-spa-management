"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";

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
        const published = result.data.filter((f: Feedback) => f.status === 'published');
        setPublishedFeedback(published);
        
        // Calculate average overall rating
        if (published.length > 0) {
          const totalRating = published.reduce((sum: number, feedback: Feedback) => sum + feedback.overall_rating, 0);
          setAverageRating(parseFloat((totalRating / published.length).toFixed(1)));
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
      setCurrentIndex((prevIndex) => (prevIndex + 1) % publishedFeedback.length);
    }
  };

  const goToPrevious = () => {
    if (publishedFeedback.length > 0) {
      setCurrentIndex((prevIndex) => prevIndex === 0 ? publishedFeedback.length - 1 : prevIndex - 1);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating ? "text-amber-500 fill-amber-500" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-700 mx-auto"></div>
        <p className="text-sm text-gray-500 mt-4">Loading testimonials...</p>
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
    <div className="relative">
      <div className="text-center mb-8">
        <h3 className="text-3xl font-light text-gray-800 mb-3">
          Guest Experiences
        </h3>
        <div className="flex items-center justify-center gap-4">
          {renderStars(averageRating)}
          <span className="text-2xl font-semibold text-amber-600">{averageRating}</span>
          <span className="text-gray-500">({publishedFeedback.length} reviews)</span>
        </div>
      </div>

      <div className="relative">
        <Card className="bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-3xl p-12 text-white shadow-2xl overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-6 left-6 opacity-20">
            <Quote className="h-16 w-16 text-emerald-400" />
          </div>
          <div className="absolute bottom-6 right-6 opacity-20">
            <Quote className="h-16 w-16 text-emerald-400 rotate-180" />
          </div>

          <CardContent className="p-0 min-h-[220px]">
            <blockquote className="text-xl text-emerald-50 font-light italic text-center mb-8 max-w-3xl mx-auto z-10 relative">
              "{currentFeedback.comments}"
            </blockquote>
            
            <div className="text-center">
              <div className="flex justify-center mb-2">
                {renderStars(currentFeedback.overall_rating)}
              </div>
              <p className="font-medium text-emerald-100 text-lg">{currentFeedback.customer_name}</p>
              <p className="text-emerald-300 text-sm">
                {currentFeedback.service_type === "spa" && "Spa Guest"}
                {currentFeedback.service_type === "restaurant" && "Restaurant Guest"}
                {currentFeedback.service_type === "both" && "Spa & Restaurant Guest"}
                {(!currentFeedback.service_type || currentFeedback.service_type === "other") && "Guest"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        {publishedFeedback.length > 1 && (
          <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between pointer-events-none">
            <Button 
              onClick={goToPrevious} 
              variant="ghost" 
              size="icon" 
              className="h-12 w-12 rounded-full bg-white/80 hover:bg-white text-emerald-800 shadow-lg backdrop-blur-sm transform -translate-x-1/2 transition-all duration-200 hover:scale-110 pointer-events-auto"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button 
              onClick={goToNext} 
              variant="ghost" 
              size="icon" 
              className="h-12 w-12 rounded-full bg-white/80 hover:bg-white text-emerald-800 shadow-lg backdrop-blur-sm transform translate-x-1/2 transition-all duration-200 hover:scale-110 pointer-events-auto"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        )}

        {/* Pagination dots */}
        {publishedFeedback.length > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            {publishedFeedback.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex ? "bg-emerald-600 w-6" : "bg-emerald-200 w-2"
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