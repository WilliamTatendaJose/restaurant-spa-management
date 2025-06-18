"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { bookingsApi, spaServicesApi } from "@/lib/db";

interface Booking {
  id: string;
  customer_name: string;
  booking_date: string;
  booking_time: string;
  booking_type: string;
  service: string;
  status: string;
  staff?: string;
  party_size?: string;
  amount?: number;
}

interface SpaService {
  id: string;
  name: string;
  price: number;
  duration: number;
}

export function RecentBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [serviceMap, setServiceMap] = useState<Record<string, string>>({});
  const [servicePrices, setServicePrices] = useState<Record<string, number>>(
    {}
  );

  useEffect(() => {
    async function fetchRecentBookings() {
      try {
        // Get spa services for mapping service IDs to names and prices
        const services = (await spaServicesApi.list()) as SpaService[];
        const servicesById: Record<string, string> = {};
        const servicesPriceById: Record<string, number> = {};

        services.forEach((service) => {
          servicesById[service.id] = service.name;
          servicesPriceById[service.id] = service.price;
        });

        setServiceMap(servicesById);
        setServicePrices(servicesPriceById);

        // Get recent bookings using the new API method
        const recentBookingsData = await bookingsApi.getRecent(5);

        // Deduplicate bookings by customer_name, booking_date, booking_time, and booking_type
        const deduplicatedBookings = (recentBookingsData as Booking[]).reduce(
          (acc: Booking[], current: Booking) => {
            const existingIndex = acc.findIndex(
              (booking) =>
                booking.customer_name?.toLowerCase() ===
                  current.customer_name?.toLowerCase() &&
                booking.booking_date === current.booking_date &&
                booking.booking_time === current.booking_time &&
                booking.booking_type === current.booking_type
            );

            if (existingIndex === -1) {
              // Booking doesn't exist, add it
              acc.push(current);
            } else {
              // Booking exists, keep the one with more recent updated_at or created_at
              const existing = acc[existingIndex];
              const currentDate = new Date(
                (current as any).updated_at || (current as any).created_at || 0
              );
              const existingDate = new Date(
                (existing as any).updated_at ||
                  (existing as any).created_at ||
                  0
              );

              if (currentDate > existingDate) {
                acc[existingIndex] = current; // Replace with newer booking
              }
            }

            return acc;
          },
          []
        );

        setBookings(deduplicatedBookings);
      } catch (error) {
        console.error("Error fetching recent bookings:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRecentBookings();
  }, []);

  // Format date and time for display
  const formatDateTime = (dateString: string, timeString: string) => {
    if (!dateString || !timeString) return "N/A";
    try {
      const date = new Date(dateString);
      const formattedDate = date.toLocaleDateString();

      const [hours, minutes] = timeString.split(":");
      const time = new Date();
      time.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      const formattedTime = time.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      return `${formattedDate}, ${formattedTime}`;
    } catch (e) {
      return `${dateString}, ${timeString}`;
    }
  };

  // Get service description
  const getServiceDescription = (booking: Booking) => {
    if (booking.booking_type === "spa") {
      return serviceMap[booking.service] || "Unknown Service";
    } else {
      return `Reservation (${booking.party_size || "?"} people)`;
    }
  };

  // Get amount display
  const getAmountDisplay = (booking: Booking) => {
    if (booking.amount) {
      return `$${booking.amount.toFixed(2)}`;
    }

    // If booking is spa type, show the price from the service
    if (booking.booking_type === "spa" && booking.service) {
      const price = servicePrices[booking.service];
      if (price) {
        return `$${price.toFixed(2)}`;
      }
    }

    return "$0.00";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Bookings</CardTitle>
        <CardDescription>Recent bookings across all services</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-4">
            <p className="text-sm text-muted-foreground">Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground">
              No recent bookings found
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">
                    {booking.customer_name}
                  </TableCell>
                  <TableCell>{getServiceDescription(booking)}</TableCell>
                  <TableCell>
                    {formatDateTime(booking.booking_date, booking.booking_time)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        booking.booking_type === "spa" ? "secondary" : "outline"
                      }
                    >
                      {booking.booking_type === "spa" ? "Spa" : "Restaurant"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        booking.status === "confirmed"
                          ? "success"
                          : booking.status === "pending"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {getAmountDisplay(booking)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
