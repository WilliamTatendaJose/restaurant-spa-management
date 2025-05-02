"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { bookingsApi, customersApi, spaServicesApi, staffApi } from "@/lib/db"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Customer {
  id: string
  name: string
  email: string
  phone: string
}

interface StaffMember {
  id: string
  name: string
  department: string
  status: string
}

interface SpaService {
  id: string
  name: string
  duration: number
  price: number
  category: string
}

export function BookingForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { isOnline } = useSyncStatus()

  // State for loading data
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [loadingStaff, setLoadingStaff] = useState(true)
  const [loadingServices, setLoadingServices] = useState(true)
  
  // State for database content
  const [customers, setCustomers] = useState<Customer[]>([])
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [spaServices, setSpaServices] = useState<SpaService[]>([])
  
  // Form state
  const [bookingType, setBookingType] = useState("spa")
  const [customerMode, setCustomerMode] = useState("existing")
  const [selectedCustomerId, setSelectedCustomerId] = useState("")
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

  // Fetch customers, staff and services data
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch customers
        const customersData = await customersApi.list() as Customer[]
        setCustomers(customersData)
        setLoadingCustomers(false)
        
        // Fetch staff members who are active
        const staffData = await staffApi.list({ status: "active" }) as StaffMember[]
        setStaffMembers(staffData)
        setLoadingStaff(false)
        
        // Fetch spa services
        const servicesData = await spaServicesApi.listActive() as SpaService[]
        setSpaServices(servicesData)
        setLoadingServices(false)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load necessary data. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchData()
  }, [toast])

  // When a customer is selected, populate the form fields
  useEffect(() => {
    if (customerMode === "existing" && selectedCustomerId) {
      const selectedCustomer = customers.find(customer => customer.id === selectedCustomerId)
      if (selectedCustomer) {
        setFormData(prev => ({
          ...prev,
          customer_name: selectedCustomer.name,
          customer_phone: selectedCustomer.phone,
          customer_email: selectedCustomer.email
        }))
      }
    } else if (customerMode === "new") {
      // Clear customer fields when switching to new customer mode
      setFormData(prev => ({
        ...prev,
        customer_name: "",
        customer_phone: "",
        customer_email: ""
      }))
    }
  }, [customerMode, selectedCustomerId, customers])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let customerId = selectedCustomerId
      
      // If this is a new customer or we're in new customer mode, create a customer record
      if (customerMode === "new" && formData.customer_name) {
        const newCustomer = await customersApi.create({
          name: formData.customer_name,
          phone: formData.customer_phone,
          email: formData.customer_email,
          customer_type: bookingType === "spa" ? "spa" : "restaurant",
          visits: 1,
          last_visit: new Date().toISOString()
        })
        customerId = newCustomer.id
      }

      // Save booking to database
      await bookingsApi.create({
        ...formData,
        customer_id: customerId, // Link to the customer
        booking_type: bookingType,
        status: "pending",
        created_at: new Date().toISOString(),
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

  // Filter staff members based on department
  const filteredStaff = staffMembers.filter(staff => 
    staff.department === bookingType || staff.department === "both"
  )

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label>Booking Type</Label>
              <RadioGroup defaultValue="spa" className="flex gap-4 mt-2" onValueChange={setBookingType} value={bookingType}>
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

            <div className="grid gap-4">
              <Label>Customer Information</Label>
              <Tabs defaultValue="existing" onValueChange={setCustomerMode} value={customerMode}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="existing">Existing Customer</TabsTrigger>
                  <TabsTrigger value="new">New Customer</TabsTrigger>
                </TabsList>
                
                <TabsContent value="existing" className="mt-2">
                  {loadingCustomers ? (
                    <div className="text-center py-4">Loading customers...</div>
                  ) : (
                    <Select value={selectedCustomerId} onValueChange={handleCustomerSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.length === 0 ? (
                          <SelectItem value="none" disabled>No customers found</SelectItem>
                        ) : (
                          customers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name} - {customer.phone}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {selectedCustomerId && (
                    <div className="mt-4 p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">{formData.customer_name}</p>
                      <p className="text-sm">{formData.customer_phone}</p>
                      <p className="text-sm text-muted-foreground">{formData.customer_email}</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="new" className="mt-2 space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="customer_name">Customer Name</Label>
                    <Input
                      id="customer_name"
                      name="customer_name"
                      value={formData.customer_name}
                      onChange={handleChange}
                      required={customerMode === "new"}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="customer_phone">Phone Number</Label>
                    <Input
                      id="customer_phone"
                      name="customer_phone"
                      value={formData.customer_phone}
                      onChange={handleChange}
                      required={customerMode === "new"}
                    />
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
                </TabsContent>
              </Tabs>
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
                      {loadingServices ? (
                        <SelectItem value="loading" disabled>Loading services...</SelectItem>
                      ) : (
                        spaServices.map(service => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} ({service.duration} min)
                          </SelectItem>
                        ))
                      )}
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
                      {loadingStaff ? (
                        <SelectItem value="loading" disabled>Loading staff...</SelectItem>
                      ) : (
                        filteredStaff.map(staff => (
                          <SelectItem key={staff.id} value={staff.id}>{staff.name}</SelectItem>
                        ))
                      )}
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
            <Button type="submit" disabled={isSubmitting || (customerMode === "existing" && !selectedCustomerId)}>
              {isSubmitting ? "Saving..." : isOnline ? "Create Booking" : "Save Offline"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
