"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, Users, Utensils } from "lucide-react";
import {
  bookingsApi,
  customersApi,
  spaServicesApi,
  transactionsApi,
} from "@/lib/db";
import { useAuth } from "@/lib/auth-context";

interface Transaction {
  status: string;
  total_amount: number;
  transaction_type: string;
  transaction_date: string;
}

interface Booking {
  booking_date: string;
}

interface Customer {
  last_visit: string | null;
}

export function DashboardStats() {
  const { hasPermission } = useAuth();

  // Only managers and admins can see revenue data
  const canViewRevenue = hasPermission("manager") || hasPermission("admin");

  const [stats, setStats] = useState({
    totalRevenue: 0,
    bookingsCount: 0,
    restaurantOrdersCount: 0,
    spaOrdersCount: 0,
    activeCustomers: 0,
    revenueChange: 0,
    bookingsChange: 0,
    ordersChange: 0,
    spaOrdersChange: 0,
    customersChange: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Get all transactions
        const allTransactions = (await transactionsApi.list()) as Transaction[];
        const completedTransactions = allTransactions.filter(
          (tx: Transaction) => tx.status === "completed" || tx.status === "paid"
        );

        // Calculate total revenue
        const totalRevenue = completedTransactions.reduce(
          (sum: number, tx: Transaction) => sum + (tx.total_amount || 0),
          0
        );

        // Get restaurant orders count
        const restaurantOrders = completedTransactions.filter(
          (tx: Transaction) => tx.transaction_type === "restaurant"
        );

        const spaOrders = completedTransactions.filter(
          (tx: Transaction) => tx.transaction_type === "spa"
        );

        // Get all bookings
        const allBookings = (await bookingsApi.list()) as Booking[];

        // Get active customers (with at least one booking or transaction)
        const customers = (await customersApi.list()) as Customer[];

        // Get dates for comparison
        const today = new Date();
        const lastMonthDate = new Date();
        lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);

        const lastWeekDate = new Date();
        lastWeekDate.setDate(lastWeekDate.getDate() - 7);

        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);

        // Filter transactions for current and previous periods
        const thisMonthTransactions = completedTransactions.filter((tx: Transaction) => {
          const txDate = new Date(tx.transaction_date);
          return txDate >= lastMonthDate;
        });

        const prevMonthTransactions = completedTransactions.filter((tx: Transaction) => {
          const txDate = new Date(tx.transaction_date);
          return (
            txDate < lastMonthDate &&
            txDate >=
              new Date(lastMonthDate.getTime() - 30 * 24 * 60 * 60 * 1000)
          );
        });

        // Calculate revenue for current and previous month
        const thisMonthRevenue = thisMonthTransactions.reduce(
          (sum: number, tx: Transaction) => sum + (tx.total_amount || 0),
          0
        );

        const prevMonthRevenue = prevMonthTransactions.reduce(
          (sum: number, tx: Transaction) => sum + (tx.total_amount || 0),
          0
        );

        // Calculate revenue change percentage
        const revenueChange =
          prevMonthRevenue === 0
            ? 100
            : ((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100;

        // Filter bookings for current and previous week
        const thisWeekBookings = allBookings.filter((booking: Booking) => {
          const bookingDate = new Date(booking.booking_date);
          return bookingDate >= lastWeekDate;
        });

        const prevWeekBookings = allBookings.filter((booking: Booking) => {
          const bookingDate = new Date(booking.booking_date);
          return (
            bookingDate < lastWeekDate &&
            bookingDate >=
              new Date(lastWeekDate.getTime() - 7 * 24 * 60 * 60 * 1000)
          );
        });

        // Calculate booking change percentage
        const bookingsChange =
          prevWeekBookings.length === 0
            ? 100
            : ((thisWeekBookings.length - prevWeekBookings.length) /
                prevWeekBookings.length) *
              100;

        // Filter orders for today and yesterday
        const todayOrders = restaurantOrders.filter((tx: Transaction) => {
          const txDate = new Date(tx.transaction_date);
          return txDate.toDateString() === today.toDateString();
        });

        const yesterdayOrders = restaurantOrders.filter((tx: Transaction) => {
          const txDate = new Date(tx.transaction_date);
          return txDate.toDateString() === yesterdayDate.toDateString();
        });

        // Calculate orders change percentage
        const ordersChange =
          yesterdayOrders.length === 0
            ? 100
            : ((todayOrders.length - yesterdayOrders.length) /
                yesterdayOrders.length) *
              100;

        const todaySpaOrders = spaOrders.filter((tx: Transaction) => {
          const txDate = new Date(tx.transaction_date);
          return txDate.toDateString() === today.toDateString();
        });

        const yesterdaySpaOrders = spaOrders.filter((tx: Transaction) => {
          const txDate = new Date(tx.transaction_date);
          return txDate.toDateString() === yesterdayDate.toDateString();
        });
        // Calculate orders change percentage
        const spaOrdersChange =
          yesterdaySpaOrders.length === 0
            ? 100
            : ((todaySpaOrders.length - yesterdaySpaOrders.length) /
                yesterdaySpaOrders.length) *
              100;

        // Calculate new customers this month
        const newCustomersThisMonth = customers.filter((customer: Customer) => {
          const lastVisitDate = customer.last_visit
            ? new Date(customer.last_visit)
            : null;
          return lastVisitDate && lastVisitDate >= lastMonthDate;
        });

        // Set all stats
        setStats({
          totalRevenue,
          bookingsCount: allBookings.length,
          restaurantOrdersCount: restaurantOrders.length,
          spaOrdersCount: spaOrders.length,
          activeCustomers: customers.length,
          revenueChange,
          bookingsChange,
          ordersChange,
          spaOrdersChange,
          customersChange: newCustomersThisMonth.length,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format change percentage
  const formatChange = (change: number) => {
    return change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {canViewRevenue && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-2xl font-bold">Loading...</div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.totalRevenue)}
                </div>
                <p
                  className={`text-xs ${
                    stats.revenueChange >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {formatChange(stats.revenueChange)} from last month
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bookings</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-2xl font-bold">Loading...</div>
          ) : (
            <>
              <div className="text-2xl font-bold">+{stats.bookingsCount}</div>
              <p
                className={`text-xs ${
                  stats.bookingsChange >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {formatChange(stats.bookingsChange)} from last week
              </p>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Restaurant Orders
          </CardTitle>
          <Utensils className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-2xl font-bold">Loading...</div>
          ) : (
            <>
              <div className="text-2xl font-bold">
                +{stats.restaurantOrdersCount}
              </div>
              <p
                className={`text-xs ${
                  stats.ordersChange >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {formatChange(stats.ordersChange)} from yesterday
              </p>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Spar Orders</CardTitle>
          <Utensils className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-2xl font-bold">Loading...</div>
          ) : (
            <>
              <div className="text-2xl font-bold">+{stats.spaOrdersCount}</div>
              <p
                className={`text-xs ${
                  stats.spaOrdersChange >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {formatChange(stats.ordersChange)} from yesterday
              </p>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Active Customers
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-2xl font-bold">Loading...</div>
          ) : (
            <>
              <div className="text-2xl font-bold">+{stats.activeCustomers}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.customersChange} new this month
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
