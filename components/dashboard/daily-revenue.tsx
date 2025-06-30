'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { transactionsApi } from '@/lib/db';
import { useAuth } from '@/lib/auth-context';

interface DailyRevenueData {
  name: string;
  spa: number;
  restaurant: number;
  date: string;
}

export function DailyRevenue() {
  const [data, setData] = useState<DailyRevenueData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hasPermission } = useAuth();

  // Only managers and admins can see revenue data
  const canViewRevenue = hasPermission('manager') || hasPermission('admin');

  useEffect(() => {
    async function fetchRevenueData() {
      try {
        // Get daily revenue data using new API method (last 7 days)
        const revenueData = await transactionsApi.getDailyRevenue(7);
        setData(revenueData);
      } catch (error) {
        console.error('Error fetching revenue data:', error);

        // Fallback to sample data if there's an error or no data
        setData([
          { name: 'Sun', spa: 1900, restaurant: 1600, date: '' },
          { name: 'Mon', spa: 1200, restaurant: 900, date: '' },
          { name: 'Tue', spa: 800, restaurant: 1100, date: '' },
          { name: 'Wed', spa: 1500, restaurant: 1300, date: '' },
          { name: 'Thu', spa: 1800, restaurant: 1400, date: '' },
          { name: 'Fri', spa: 2200, restaurant: 1800, date: '' },
          { name: 'Sat', spa: 2500, restaurant: 2100, date: '' },
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRevenueData();
  }, []);

  // Format currency for the tooltip
  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  if (!canViewRevenue) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Revenue</CardTitle>
        <CardDescription>Revenue breakdown by service type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='h-[200px]'>
          {isLoading ? (
            <div className='flex h-full items-center justify-center'>
              <p className='text-sm text-muted-foreground'>
                Loading revenue data...
              </p>
            </div>
          ) : (
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={data}>
                <XAxis dataKey='name' />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip formatter={formatCurrency} />
                <Legend />
                <Bar dataKey='spa' fill='#8884d8' name='Spa' />
                <Bar dataKey='restaurant' fill='#82ca9d' name='Restaurant' />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
