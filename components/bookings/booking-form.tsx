"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { bookingsApi, spaServicesApi, customersApi, staffApi } from "@/lib/db";
import { Plus } from "lucide-react";

interface BookingFormProps {
  bookingId?: string;
}

interface Booking {
  id?: string;
  customer_name: string;
  customer_id?: string;
  booking_date: string;
  booking_time: string;
  booking_type: "spa" | "restaurant";
  service: string;
  status: "pending" | "confirmed" | "cancelled";
  staff?: string;
  party_size?: string;
  notes?: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface SpaService {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  status: string;
}

export function BookingForm({ bookingId }: BookingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(!!bookingId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [spaServices, setSpaServices] = useState<SpaService[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);

  // Customer creation dialog state
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [formData, setFormData] = useState<Booking>({
    customer_name: "",
    customer_id: "",
    booking_date: "",
    booking_time: "",
    booking_type: "spa",
    service: "",
    status: "pending",
    staff: "",
    party_size: "",
    notes: "",
  });

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch customers, spa services, and staff
        const [customersData, servicesData, staffData] = await Promise.all([
          customersApi.list(),
          spaServicesApi.list(),
          staffApi.list({ status: "active" }),
        ]);

        setCustomers(customersData as Customer[]);
        setSpaServices(servicesData as SpaService[]);
        setStaff(staffData as StaffMember[]);

        // If editing, fetch the booking data
        if (bookingId) {
          const booking = await bookingsApi.get(bookingId);
          if (booking) {
            setFormData({
              customer_name: booking.customer_name || "",
              customer_id: booking.customer_id || "",
              booking_date: booking.booking_date || "",
              booking_time: booking.booking_time || "",
              booking_type: booking.booking_type || "spa",
              service: booking.service || "",
              status: booking.status || "pending",
              staff: booking.staff || "",
              party_size: booking.party_size || "",
              notes: booking.notes || "",
            });
          } else {
            toast({
              title: "Error",
              description: "Booking not found",
              variant: "destructive",
            });
            router.push("/bookings");
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [bookingId, toast, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    // Convert "none" back to empty string for staff field
    const actualValue = name === "staff" && value === "none" ? "" : value;
    setFormData((prev) => ({ ...prev, [name]: actualValue }));

    // Update customer name when customer is selected
    if (name === "customer_id") {
      const selectedCustomer = customers.find((c) => c.id === value);
      if (selectedCustomer) {
        setFormData((prev) => ({
          ...prev,
          customer_name: selectedCustomer.name,
        }));
      }
    }
  };

  // Handle creating new customer
  const handleCreateCustomer = async () => {
    try {
      if (
        !newCustomerData.name ||
        !newCustomerData.email ||
        !newCustomerData.phone
      ) {
        toast({
          title: "Error",
          description: "Please fill in all customer fields",
          variant: "destructive",
        });
        return;
      }

      const newCustomer = await customersApi.create({
        ...newCustomerData,
        visits: 0,
        last_visit: new Date().toISOString(),
      });

      // Update customers list and select the new customer
      const updatedCustomers = [...customers, newCustomer];
      setCustomers(updatedCustomers);

      setFormData((prev) => ({
        ...prev,
        customer_id: newCustomer.id,
        customer_name: newCustomer.name,
      }));

      setShowCreateCustomer(false);
      setNewCustomerData({ name: "", email: "", phone: "" });

      toast({
        title: "Success",
        description: "Customer created and selected successfully",
      });
    } catch (error) {
      console.error("Error creating customer:", error);
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive",
      });
    }
  };

  // Send confirmation email when booking is confirmed
  const sendConfirmationEmail = async (booking: any) => {
    try {
      const customer = customers.find((c) => c.id === booking.customer_id);
      if (!customer?.email) {
        console.log("No customer email found, skipping email notification");
        return;
      }

      const serviceName =
        booking.booking_type === "spa"
          ? spaServices.find((s) => s.id === booking.service)?.name ||
            "Spa Service"
          : `Table for ${booking.party_size || "?"} - Restaurant`;

      const response = await fetch("/api/bookings/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          customerName: booking.customer_name,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          serviceName,
          bookingDate: booking.booking_date,
          bookingTime: booking.booking_time,
          notificationType: "email",
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Confirmation sent",
          description: "Booking confirmation email sent successfully",
        });
      } else {
        console.error("Failed to send confirmation email:", result.error);
        toast({
          title: "Email not sent",
          description: "Booking saved but confirmation email failed to send",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending confirmation email:", error);
      toast({
        title: "Email error",
        description: "Failed to send confirmation email",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation
      if (
        !formData.customer_name ||
        !formData.booking_date ||
        !formData.booking_time
      ) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      if (formData.booking_type === "spa" && !formData.service) {
        toast({
          title: "Error",
          description: "Please select a spa service",
          variant: "destructive",
        });
        return;
      }

      if (formData.booking_type === "restaurant" && !formData.party_size) {
        toast({
          title: "Error",
          description: "Please specify party size for restaurant booking",
          variant: "destructive",
        });
        return;
      }

      let savedBooking;
      const wasConfirmed = formData.status === "confirmed";

      if (bookingId) {
        // Update existing booking
        savedBooking = await bookingsApi.update(bookingId, formData);
        toast({
          title: "Success",
          description: "Booking updated successfully",
        });
      } else {
        // Create new booking
        savedBooking = await bookingsApi.create(formData);
        toast({
          title: "Success",
          description: "Booking created successfully",
        });
      }

      // Send confirmation email if booking status is confirmed
      if (wasConfirmed && savedBooking) {
        await sendConfirmationEmail({ ...formData, id: savedBooking.id });
      }

      router.push("/bookings");
    } catch (error) {
      console.error("Error saving booking:", error);
      toast({
        title: "Error",
        description: "Failed to save booking",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter staff based on booking type
  const filteredStaff = staff.filter(
    (member) =>
      member.department === "both" ||
      member.department === formData.booking_type ||
      (formData.booking_type === "spa" && member.department === "spa") ||
      (formData.booking_type === "restaurant" &&
        member.department === "restaurant")
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center p-8">
            <p>Loading booking data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{bookingId ? "Edit Booking" : "New Booking"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Selection with Create Option */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer_id">Customer</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.customer_id}
                    onValueChange={(value) =>
                      handleSelectChange("customer_id", value)
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} - {customer.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowCreateCustomer(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name</Label>
                <Input
                  id="customer_name"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleInputChange}
                  placeholder="Enter customer name"
                  required
                />
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="booking_date">Date</Label>
                <Input
                  id="booking_date"
                  name="booking_date"
                  type="date"
                  value={formData.booking_date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="booking_time">Time</Label>
                <Input
                  id="booking_time"
                  name="booking_time"
                  type="time"
                  value={formData.booking_time}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* Booking Type */}
            <div className="space-y-2">
              <Label htmlFor="booking_type">Booking Type</Label>
              <Select
                value={formData.booking_type}
                onValueChange={(value) =>
                  handleSelectChange("booking_type", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spa">Spa</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conditional Fields */}
            {formData.booking_type === "spa" ? (
              <div className="space-y-2">
                <Label htmlFor="service">Spa Service</Label>
                <Select
                  value={formData.service}
                  onValueChange={(value) =>
                    handleSelectChange("service", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {spaServices.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - ${service.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="party_size">Party Size</Label>
                <Input
                  id="party_size"
                  name="party_size"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.party_size}
                  onChange={handleInputChange}
                  placeholder="Number of people"
                  required
                />
              </div>
            )}

            {/* Status, Staff and Notes */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff">Assigned Staff</Label>
                <Select
                  value={formData.staff || "none"}
                  onValueChange={(value) => handleSelectChange("staff", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No staff assigned</SelectItem>
                    {filteredStaff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} - {member.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Any special requests or notes..."
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/bookings")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : bookingId
                    ? "Update Booking"
                    : "Create Booking"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Create Customer Dialog */}
      <Dialog open={showCreateCustomer} onOpenChange={setShowCreateCustomer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Customer</DialogTitle>
            <DialogDescription>
              Add a new customer to the database and select them for this
              booking.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_customer_name">Name</Label>
              <Input
                id="new_customer_name"
                value={newCustomerData.name}
                onChange={(e) =>
                  setNewCustomerData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Enter customer name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_customer_email">Email</Label>
              <Input
                id="new_customer_email"
                type="email"
                value={newCustomerData.email}
                onChange={(e) =>
                  setNewCustomerData((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder="Enter email address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_customer_phone">Phone</Label>
              <Input
                id="new_customer_phone"
                value={newCustomerData.phone}
                onChange={(e) =>
                  setNewCustomerData((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                placeholder="Enter phone number"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateCustomer(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCustomer}>Create Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
