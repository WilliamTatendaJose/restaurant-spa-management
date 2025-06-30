'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { staffApi } from '@/lib/db';

interface StaffMember {
  id: string;
  name: string;
  department: string;
  status: string;
}

interface BookingFiltersProps {
  onFilterChange?: (filters: BookingFilters) => void;
}

interface BookingFilters {
  bookingType: string;
  status: string;
  staffId: string;
}

export function BookingFilters({ onFilterChange }: BookingFiltersProps) {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<BookingFilters>({
    bookingType: 'all',
    status: 'all',
    staffId: 'all',
  });

  // Fetch staff data
  useEffect(() => {
    async function fetchStaff() {
      try {
        // Only fetch active staff members
        const data = (await staffApi.list({
          status: 'active',
        })) as StaffMember[];
        setStaffMembers(data);
      } catch (error) {
        console.error('Error fetching staff:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStaff();
  }, []);

  // Update filters and notify parent component
  const updateFilters = (key: keyof BookingFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className='grid gap-6'>
        <div className='grid gap-2'>
          <Label htmlFor='booking-type'>Booking Type</Label>
          <RadioGroup
            value={filters.bookingType}
            onValueChange={(value) => updateFilters('bookingType', value)}
            id='booking-type'
          >
            <div className='flex items-center space-x-2'>
              <RadioGroupItem value='all' id='all' />
              <Label htmlFor='all'>All</Label>
            </div>
            <div className='flex items-center space-x-2'>
              <RadioGroupItem value='spa' id='spa' />
              <Label htmlFor='spa'>Spa</Label>
            </div>
            <div className='flex items-center space-x-2'>
              <RadioGroupItem value='restaurant' id='restaurant' />
              <Label htmlFor='restaurant'>Restaurant</Label>
            </div>
          </RadioGroup>
        </div>

        <div className='grid gap-2'>
          <Label htmlFor='status'>Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => updateFilters('status', value)}
          >
            <SelectTrigger id='status'>
              <SelectValue placeholder='Select status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Statuses</SelectItem>
              <SelectItem value='confirmed'>Confirmed</SelectItem>
              <SelectItem value='pending'>Pending</SelectItem>
              <SelectItem value='cancelled'>Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='grid gap-2'>
          <Label htmlFor='staff'>Staff Member</Label>
          <Select
            value={filters.staffId}
            onValueChange={(value) => updateFilters('staffId', value)}
          >
            <SelectTrigger id='staff'>
              <SelectValue placeholder='Select staff' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Staff</SelectItem>
              {isLoading ? (
                <SelectItem value='loading' disabled>
                  Loading staff...
                </SelectItem>
              ) : staffMembers.length === 0 ? (
                <SelectItem value='none' disabled>
                  No staff available
                </SelectItem>
              ) : (
                staffMembers.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
