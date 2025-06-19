"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

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
      return timeValue.toLocaleTimeString('en-US', {
        hour: 'numeric',
        hour12: true
      }).toUpperCase();
    } catch (error) {
      console.error('Error formatting time:', error);
      return time;
    }
  };

  if (loading) {
    return (
      <Card className="group text-center border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-amber-50/30 overflow-hidden">
        <CardContent className="p-10">
          <div className="animate-pulse">
            <div className="w-20 h-20 mx-auto mb-8 bg-amber-200 rounded-full"></div>
            <div className="h-6 bg-amber-100 rounded mb-6 w-1/2 mx-auto"></div>
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-4 bg-amber-50 rounded w-2/3 mx-auto"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="group text-center border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-amber-50/30 overflow-hidden">
        <CardContent className="p-10">
          <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-xl">
            <Clock className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-2xl font-light text-gray-800 mb-6">
            Opening Hours
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Temporarily unavailable. Please contact us for current operating hours.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group text-center border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-amber-50/30 overflow-hidden">
      <CardContent className="p-10">
        <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
          <Clock className="h-10 w-10 text-white" />
        </div>
        <h3 className="text-2xl font-light text-gray-800 mb-6 group-hover:text-amber-600 transition-colors">
          Opening Hours
        </h3>
        <div className="space-y-4 text-gray-600 leading-relaxed text-lg">
          <div className="flex justify-between items-center py-1">
            <span className="font-medium">Sunday-Friday</span>
            <span>9AM - 9PM</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="font-medium">Saturday</span>
            <span className="text-red-500">Closed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}