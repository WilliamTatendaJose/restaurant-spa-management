"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CalendarDays } from "lucide-react";

interface OperatingHour {
  id: string;
  day: string;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export function OperatingHoursDisplay() {
  const [hours, setHours] = useState<OperatingHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOperatingHours() {
      try {
        const response = await fetch('/api/settings/operating-hours');
        
        if (!response.ok) {
          throw new Error('Failed to fetch operating hours');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setHours(data.data);
        } else {
          setError(data.error || 'Failed to fetch operating hours');
        }
      } catch (error) {
        console.error('Error fetching operating hours:', error);
        setError('Unable to load operating hours');
      } finally {
        setLoading(false);
      }
    }

    fetchOperatingHours();
  }, []);

  // Format time to 12-hour format
  const formatTime = (time: string) => {
    if (!time) return 'N/A';
    
    try {
      // Handle different time formats
      let timeValue = time;
      if (!time.includes(':')) {
        // If time is just a number, assume it's hours
        timeValue = `${time}:00`;
      }
      
      const [hours, minutes] = timeValue.split(':');
      const hourNum = parseInt(hours, 10);
      const period = hourNum >= 12 ? 'PM' : 'AM';
      const hour12 = hourNum % 12 || 12;
      
      return `${hour12}:${minutes} ${period}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return time; // Return original if parsing fails
    }
  };

  // Get the day number for sorting (0 = Sunday, 1 = Monday, etc.)
  const getDayNumber = (day: string): number => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days.indexOf(day.toLowerCase());
  };

  // Sort days of the week
  const sortedHours = [...hours].sort((a, b) => {
    return getDayNumber(a.day) - getDayNumber(b.day);
  });

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  if (error) {
    // Fallback to default hours if there's an error
    return (
      <Card className="border-emerald-100 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <Clock className="h-5 w-5 text-emerald-700 mr-2" />
            <h3 className="text-xl font-medium text-gray-800">Hours of Operation</h3>
          </div>
          <div className="space-y-2">
            <p className="text-gray-700">Monday - Friday: 9:00 AM - 9:00 PM</p>
            <p className="text-gray-700">Saturday: 10:00 AM - 10:00 PM</p>
            <p className="text-gray-700">Sunday: 10:00 AM - 8:00 PM</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sortedHours.length === 0) {
    // Fallback to default hours if no data
    return (
      <Card className="border-emerald-100 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <Clock className="h-5 w-5 text-emerald-700 mr-2" />
            <h3 className="text-xl font-medium text-gray-800">Hours of Operation</h3>
          </div>
          <div className="space-y-2">
            <p className="text-gray-700">Monday - Friday: 9:00 AM - 9:00 PM</p>
            <p className="text-gray-700">Saturday: 10:00 AM - 10:00 PM</p>
            <p className="text-gray-700">Sunday: 10:00 AM - 8:00 PM</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-emerald-100 shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-800 p-4">
        <div className="flex items-center">
          <div className="bg-white/20 p-2 rounded-full mr-3">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-medium text-white">Hours of Operation</h3>
        </div>
      </div>
      <CardContent className="p-6">
        <div className="space-y-3">
          {sortedHours.map((hour) => (
            <div key={hour.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center">
                <CalendarDays className="h-4 w-4 text-emerald-600 mr-2" />
                <span className="text-gray-800 font-medium capitalize">{hour.day}</span>
              </div>
              <div>
                {hour.is_closed ? (
                  <span className="text-red-600 font-medium">Closed</span>
                ) : (
                  <span className="text-gray-700">{formatTime(hour.open_time)} - {formatTime(hour.close_time)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}