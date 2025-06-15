"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { bookingsApi, spaServicesApi, customersApi } from "@/lib/db"

interface BookingFormProps {
  bookingId?: string
}

interface Booking {
  id?: string
  customer_name: string
  customer_id?: string
  booking_date: string
  booking_time: string
  booking_type: "spa" | "restaurant"
  service: string
  status: "pending" | "confirmed" | "cancelled"
  staff?: string
  party_size?: string
  notes?: string
}

interface Customer {
  id: string
  name: string
  email: string
  phone: string
}

interface SpaService {
  id: string
  name: string
  duration: number
  price: number
}

export function BookingForm({ bookingId }: BookingFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(!!bookingId)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [spaServices, setSpaServices] = useState<SpaService[]>([])
  
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
    notes: ""
  })

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch customers and spa services
        const [customersData, servicesData] = await Promise.all([
          customersApi.list(),
          spaServicesApi.list()
        ])
        
        setCustomers(customersData as Customer[])
        setSpaServices(servicesData as SpaService[])

        // If editing, fetch the booking data
        if (bookingId) {
          const booking = await bookingsApi.get(bookingId)
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
              notes: booking.notes || ""
            })
          } else {
            toast({
              title: "Error",
              description: "Booking not found",
              variant: "destructive"
            })
            router.push("/bookings")
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [bookingId, toast, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Update customer name when customer is selected
    if (name === "customer_id") {
      const selectedCustomer = customers.find(c => c.id === value)
      if (selectedCustomer) {
        setFormData(prev => ({ ...prev, customer_name: selectedCustomer.name }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validation
      if (!formData.customer_name || !formData.booking_date || !formData.booking_time) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        })
        return
      }

      if (formData.booking_type === "spa" && !formData.service) {
        toast({
          title: "Error",
          description: "Please select a spa service",
          variant: "destructive"
        })
        return
      }

      if (formData.booking_type === "restaurant" && !formData.party_size) {
        toast({
          title: "Error",
          description: "Please specify party size for restaurant booking",
          variant: "destructive"
        })
        return
      }

      if (bookingId) {
        // Update existing booking
        await bookingsApi.update(bookingId, formData)
        toast({
          title: "Success",
          description: "Booking updated successfully"
        })
      } else {
        // Create new booking
        await bookingsApi.create(formData)
        toast({
          title: "Success",
          description: "Booking created successfully"
        })
      }

      router.push("/bookings")
    } catch (error) {
      console.error("Error saving booking:", error)
      toast({
        title: "Error",
        description: "Failed to save booking",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center p-8">
            <p>Loading booking data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{bookingId ? "Edit Booking" : "New Booking"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Selection */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customer_id">Customer</Label>
              <Select value={formData.customer_id} onValueChange={(value) => handleSelectChange("customer_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Select value={formData.booking_type} onValueChange={(value) => handleSelectChange("booking_type", value)}>
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
              <Select value={formData.service} onValueChange={(value) => handleSelectChange("service", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {spaServices.map(service => (
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

          {/* Status and Staff */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
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
              <Label htmlFor="staff">Assigned Staff (Optional)</Label>
              <Input
                id="staff"
                name="staff"
                value={formData.staff}
                onChange={handleInputChange}
                placeholder="Staff member name"
              />
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
              {isSubmitting ? "Saving..." : bookingId ? "Update Booking" : "Create Booking"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
