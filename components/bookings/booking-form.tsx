"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useSyncStatus } from "@/components/sync-status-provider"
import { bookingsApi } from "@/lib/db"

export function BookingForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { isOnline } = useSyncStatus()

  const [bookingType, setBookingType] = useState("spa")
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    booking_date: "",
    booking_time: "",
    service: "",
    staff: "",
    notes: "",
    party_size: "1",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Save to database
      await bookingsApi.create({
        ...formData,
        booking_type: bookingType,
        status: "pending",
      })

      toast({
        title: "Booking created",
        description: isOnline
          ? "The booking has been successfully created."
          : "The booking has been saved offline and will sync when connection is restored.",
      })

      router.push("/bookings")
    } catch (error) {
      console.error("Error creating booking:", error)
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label>Booking Type</Label>
              <RadioGroup defaultValue="spa" className="flex gap-4 mt-2" onValueChange={setBookingType}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="spa" id="spa-type" />
                  <Label htmlFor="spa-type">Spa Service</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="restaurant" id="restaurant-type" />
                  <Label htmlFor="restaurant-type">Restaurant</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="customer_name">Customer Name</Label>
                <Input
                  id="customer_name"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="customer_phone">Phone Number</Label>
                <Input
                  id="customer_phone"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="customer_email">Email</Label>
              <Input
                id="customer_email"
                name="customer_email"
                type="email"
                value={formData.customer_email}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="booking_date">Date</Label>
                <Input
                  id="booking_date"
                  name="booking_date"
                  type="date"
                  value={formData.booking_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="booking_time">Time</Label>
                <Input
                  id="booking_time"
                  name="booking_time"
                  type="time"
                  value={formData.booking_time}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {bookingType === "spa" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="service">Service</Label>
                  <Select
                    value={formData.service}
                    onValueChange={(value) => handleSelectChange("service", value)}
                    required
                  >
                    <SelectTrigger id="service">
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="massage">Deep Tissue Massage</SelectItem>
                      <SelectItem value="facial">Facial Treatment</SelectItem>
                      <SelectItem value="stone">Hot Stone Massage</SelectItem>
                      <SelectItem value="manicure">Manicure & Pedicure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="staff">Staff Member</Label>
                  <Select value={formData.staff} onValueChange={(value) => handleSelectChange("staff", value)}>
                    <SelectTrigger id="staff">
                      <SelectValue placeholder="Select staff (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="john">John Smith</SelectItem>
                      <SelectItem value="maria">Maria Garcia</SelectItem>
                      <SelectItem value="david">David Kim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="party_size">Party Size</Label>
                  <Select
                    value={formData.party_size}
                    onValueChange={(value) => handleSelectChange("party_size", value)}
                    required
                  >
                    <SelectTrigger id="party_size">
                      <SelectValue placeholder="Select party size" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size} {size === 1 ? "person" : "people"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="service">Table Preference</Label>
                  <Select value={formData.service} onValueChange={(value) => handleSelectChange("service", value)}>
                    <SelectTrigger id="service">
                      <SelectValue placeholder="Select preference (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="window">Window Seat</SelectItem>
                      <SelectItem value="booth">Booth</SelectItem>
                      <SelectItem value="patio">Patio/Outdoor</SelectItem>
                      <SelectItem value="private">Private Room</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="notes">Special Requests/Notes</Label>
              <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push("/bookings")} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isOnline ? "Create Booking" : "Save Offline"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
