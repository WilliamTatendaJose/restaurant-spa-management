'use client';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';
import { RecentBookings } from '@/components/dashboard/recent-bookings';
import { UpcomingBookings } from '@/components/dashboard/upcoming-bookings';
import { DailyRevenue } from '@/components/dashboard/daily-revenue';
import { PageHeader } from '@/components/page-header';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading)
    return (
      <div className='flex h-96 items-center justify-center'>Loading...</div>
    );
  if (!user) return null;

  return (
    <div className='container mx-auto px-4 py-6'>
      <PageHeader heading='Dashboard' subheading='Overview of your business' />
      <div className='mt-6 grid gap-6'>
        <DashboardStats />
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          <UpcomingBookings />
          <DailyRevenue />
        </div>
        <RecentBookings />
      </div>
    </div>
  );
}
