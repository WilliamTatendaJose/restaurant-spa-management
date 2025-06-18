"use client";

import { useState, useEffect } from "react";
import { BookingCalendar } from "@/components/bookings/booking-calendar";
import { BookingFilters } from "@/components/bookings/booking-filters";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import Link from "next/link";
import { bookingsApi, spaServicesApi, customersApi } from "@/lib/db";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface Booking {
  id: string;
  customer_name: string;
  customer_id?: string;
  booking_date: string;
  booking_time: string;
  booking_type: string;
  service: string;
  status: string;
  staff?: string;
  party_size?: string;
  updated_at?: string;
  created_at?: string;
}

interface SpaService {
  id: string;
  name: string;
}

interface BookingFilters {
  bookingType: string;
  status: string;
  staffId: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<BookingFilters>({
    bookingType: "all",
    status: "all",
    staffId: "all",
  });
  const [serviceMap, setServiceMap] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Fetch all bookings and services
  useEffect(() => {
    async function fetchData() {
      try {
        // First fetch services to build the lookup map
        const services = (await spaServicesApi.list()) as SpaService[];
        const servicesById: Record<string, string> = {};
        services.forEach((service) => {
          servicesById[service.id] = service.name;
        });
        setServiceMap(servicesById);

        // Then fetch bookings
        const data = (await bookingsApi.list()) as Booking[];

        // Deduplicate bookings by customer_name, booking_date, and booking_time
        const deduplicatedBookings = data.reduce(
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
                current.updated_at || current.created_at || 0
              );
              const existingDate = new Date(
                existing.updated_at || existing.created_at || 0
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
        setFilteredBookings(deduplicatedBookings);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    let result = [...bookings];

    // Filter by booking type
    if (filters.bookingType !== "all") {
      result = result.filter(
        (booking) => booking.booking_type === filters.bookingType
      );
    }

    // Filter by status
    if (filters.status !== "all") {
      result = result.filter((booking) => booking.status === filters.status);
    }

    // Filter by staff member
    if (filters.staffId !== "all") {
      result = result.filter((booking) => booking.staff === filters.staffId);
    }

    // Sort by date and time
    result.sort((a, b) => {
      const dateA = new Date(`${a.booking_date}T${a.booking_time}`);
      const dateB = new Date(`${b.booking_date}T${b.booking_time}`);
      return dateA.getTime() - dateB.getTime();
    });

    setFilteredBookings(result);
  }, [filters, bookings]);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    if (!timeString) return "";
    try {
      const [hours, minutes] = timeString.split(":");
      const time = new Date();
      time.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      return time.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return timeString;
    }
  };

  // Get service or table display
  const getServiceDisplay = (booking: Booking) => {
    if (booking.booking_type === "spa") {
      // Look up service name from the service map
      return serviceMap[booking.service] || "Unknown Service";
    } else {
      return `Table for ${booking.party_size || "?"}`;
    }
  };

  // Handle filter changes from the BookingFilters component
  const handleFilterChange = (newFilters: BookingFilters) => {
    setFilters(newFilters);
  };

  // Handle status change
  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    setUpdatingStatus(bookingId);
    try {
      await bookingsApi.update(bookingId, { status: newStatus });

      // Update local state to reflect the change
      const updatedBookings = bookings.map((booking) =>
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      );
      setBookings(updatedBookings);

      // Send confirmation notification if status changed to "confirmed"
      if (newStatus === "confirmed") {
        const booking = bookings.find((b) => b.id === bookingId);
        if (booking) {
          try {
            // Get customer details
            let customerEmail = "";
            let customerPhone = "";

            if (booking.customer_id) {
              const customer = await customersApi.get(booking.customer_id);
              if (customer) {
                customerEmail = customer.email || "";
                customerPhone = customer.phone || "";
              }
            }

            // Get service name for spa bookings
            let serviceName = "";
            if (booking.booking_type === "spa") {
              serviceName = serviceMap[booking.service] || "Spa Service";
            } else {
              serviceName = `Table for ${booking.party_size || "?"} - Restaurant`;
            }

            // Send confirmation notification
            const confirmationResponse = await fetch("/api/bookings/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                bookingId: booking.id,
                customerName: booking.customer_name,
                customerEmail,
                customerPhone,
                serviceName,
                bookingDate: booking.booking_date,
                bookingTime: booking.booking_time,
                notificationType: "both", // Send both email and WhatsApp if available
              }),
            });

            const confirmationResult = await confirmationResponse.json();

            if (confirmationResult.success) {
              const notifications = [];
              const manualActions = [];

              if (confirmationResult.results?.email?.success)
                notifications.push("email");
              if (confirmationResult.results?.whatsapp?.success) {
                if (
                  confirmationResult.results.whatsapp.method === "deep_link"
                ) {
                  manualActions.push("WhatsApp (click to send)");
                } else {
                  notifications.push("WhatsApp");
                }
              }

              let description = "";
              if (notifications.length > 0) {
                description += `Confirmation sent via ${notifications.join(" and ")} to ${booking.customer_name}`;
              }
              if (manualActions.length > 0) {
                if (description) description += ". ";
                description += `${manualActions.join(" and ")} ready for manual sending`;
              }

              toast({
                title: "Booking confirmed & customer notified",
                description,
              });
            } else {
              toast({
                title: "Booking confirmed",
                description:
                  "Customer notification failed, but booking status updated",
                variant: "default",
              });
            }
          } catch (notificationError) {
            console.error(
              "Error sending confirmation notification:",
              notificationError
            );
            toast({
              title: "Booking confirmed",
              description:
                "Status updated successfully, but notification failed",
              variant: "default",
            });
          }
        }
      } else {
        toast({
          title: "Status updated",
          description: `Booking status has been updated to ${newStatus}`,
        });
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default";
      case "cancelled":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between">
        <PageHeader
          heading="Bookings"
          subheading="Manage spa and restaurant reservations"
        />
        <Button asChild>
          <Link href="/bookings/new">
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="calendar" className="mt-6">
        <TabsList>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        <TabsContent value="calendar" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6 h-[600px]">
            <BookingFilters onFilterChange={handleFilterChange} />
            <BookingCalendar />
          </div>
        </TabsContent>
        <TabsContent value="list" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
            <BookingFilters onFilterChange={handleFilterChange} />
            <div className="bg-card rounded-lg border shadow-sm">
              <h3 className="text-lg font-medium p-4 border-b">Bookings</h3>

              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <p>Loading bookings...</p>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground">
                    No bookings found matching the filters.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Service/Table</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div className="font-medium">
                              {formatDate(booking.booking_date)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatTime(booking.booking_time)}
                            </div>
                          </TableCell>
                          <TableCell>{booking.customer_name}</TableCell>
                          <TableCell>{getServiceDisplay(booking)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                booking.booking_type === "spa"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {booking.booking_type === "spa"
                                ? "Spa"
                                : "Restaurant"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={booking.status}
                              onValueChange={(value) =>
                                handleStatusChange(booking.id, value)
                              }
                              disabled={updatingStatus === booking.id}
                            >
                              <SelectTrigger className="w-[110px] h-8">
                                <SelectValue>
                                  <Badge
                                    variant={
                                      getStatusColor(booking.status) as any
                                    }
                                  >
                                    {booking.status}
                                  </Badge>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">
                                  Confirmed
                                </SelectItem>
                                <SelectItem value="cancelled">
                                  Cancelled
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-8 px-2 py-0"
                            >
                              <Link href={`/bookings/edit/${booking.id}`}>
                                Edit
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
