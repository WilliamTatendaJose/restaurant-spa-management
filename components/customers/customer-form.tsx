"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useSyncStatus } from "@/components/sync-status-provider"
import { customersApi } from "@/lib/db"

interface Customer {
  id?: string
  name: string
  email: string
  phone: string
  address?: string
  customer_type: string
  notes?: string
}

interface CustomerFormProps {
  customer?: Customer
}

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { isOnline } = useSyncStatus()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState<Customer>({
    name: customer?.name || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    address: customer?.address || "",
    customer_type: customer?.customer_type || "both",
    notes: customer?.notes || "",
  })

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
      if (customer?.id) {
        // Update existing customer
        await customersApi.update(customer.id, formData)
        toast({
          title: "Customer updated",
          description: isOnline
            ? "Customer has been updated successfully."
            : "Customer has been updated offline and will sync when connection is restored.",
        })
      } else {
        // Create new customer
        await customersApi.create({
          ...formData,
          visits: 0,
          last_visit: new Date().toISOString(),
        })
        toast({
          title: "Customer added",
          description: isOnline
            ? "New customer has been added successfully."
            : "Customer has been added offline and will sync when connection is restored.",
        })
      }

      router.push("/customers")
    } catch (error) {
      console.error("Error saving customer:", error)
      toast({
        title: "Error",
        description: "Failed to save customer. Please try again.",
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
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter customer name"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter customer address (optional)"
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="customer_type">Customer Type</Label>
              <Select
                value={formData.customer_type}
                onValueChange={(value) => handleSelectChange("customer_type", value)}
              >
                <SelectTrigger id="customer_type">
                  <SelectValue placeholder="Select customer type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spa">Spa</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Enter any additional notes (optional)"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push("/customers")} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : customer ? "Update Customer" : "Add Customer"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
