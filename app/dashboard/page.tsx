"use client";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { RecentBookings } from "@/components/dashboard/recent-bookings";
import { UpcomingBookings } from "@/components/dashboard/upcoming-bookings";
import { DailyRevenue } from "@/components/dashboard/daily-revenue";
import { PageHeader } from "@/components/page-header";

export default function Dashboard() {
  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader heading="Dashboard" subheading="Overview of your business" />
      <div className="grid gap-6 mt-6">
        <DashboardStats />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UpcomingBookings />
          <DailyRevenue />
        </div>
        <RecentBookings />
      </div>
    </div>
  );
}
