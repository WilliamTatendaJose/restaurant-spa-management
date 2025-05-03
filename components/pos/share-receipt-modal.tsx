"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { customersApi } from "@/lib/db"
import type { jsPDF } from "jspdf"

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
}

interface ShareReceiptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactionId: string
  customerName: string
  getPdf: () => Promise<jsPDF | null>
}

export function ShareReceiptModal({ open, onOpenChange, transactionId, customerName, getPdf }: ShareReceiptModalProps) {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [customer, setCustomer] = useState<Customer | null>(null)

  // Load customer data when modal opens
  useEffect(() => {
    async function loadCustomerData() {
      if (!open || !customerName || customerName === "Guest") return
      
      setIsLoading(true)
      try {
        // Search for customer by name
        const customers = await customersApi.list({ name: customerName })
        
        if (customers && customers.length > 0) {
          const matchingCustomer = customers.find(c => c.name === customerName)
          if (matchingCustomer) {
            setCustomer(matchingCustomer as Customer)
            setEmail(matchingCustomer.email || "")
            setPhone(matchingCustomer.phone || "")
          }
        }
      } catch (error) {
        console.error("Error loading customer data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCustomerData()
  }, [open, customerName])

  const handleSendEmail = async () => {
    if (!email) return

    setIsSending(true)
    try {
      // In a real app, you would send the PDF to your backend
      // which would then email it to the customer
      const pdf = await getPdf()
      if (!pdf) {
        throw new Error("Failed to generate PDF")
      }

      // Save contact information if we have a customer but no email
      if (customer && !customer.email && customerName !== "Guest") {
        await updateCustomerContacts(customer.id)
      }

      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Receipt sent",
        description: `Receipt has been sent to ${email}`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error sending email:", error)
      toast({
        title: "Error",
        description: "Failed to send receipt. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleSendWhatsApp = async () => {
    if (!phone) return

    setIsSending(true)
    try {
      // For WhatsApp, we'll generate a PDF and then create a link
      // In a real app, you would upload the PDF to your server and get a URL
      const pdf = await getPdf()
      if (!pdf) {
        throw new Error("Failed to generate PDF")
      }

      // Save contact information if we have a customer but no phone
      if (customer && !customer.phone && customerName !== "Guest") {
        await updateCustomerContacts(customer.id)
      }

      // Mock API call to upload PDF and get a URL
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const mockPdfUrl = `https://example.com/receipts/Receipt-${transactionId.substring(0, 8)}.pdf`

      // Format phone number (remove non-digits)
      const formattedPhone = phone.replace(/\D/g, "")

      // Create WhatsApp link with message
      const message = encodeURIComponent(`Hello ${customerName}, here is your receipt: ${mockPdfUrl}`)
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${message}`

      // Open WhatsApp in a new tab
      window.open(whatsappUrl, "_blank")

      toast({
        title: "WhatsApp opened",
        description: "Send the pre-filled message to share the receipt",
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error sending WhatsApp:", error)
      toast({
        title: "Error",
        description: "Failed to share receipt. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  // Helper to update customer contact information in the database
  const updateCustomerContacts = async (customerId: string) => {
    try {
      const updateData: { email?: string; phone?: string } = {}
      if (email) updateData.email = email
      if (phone) updateData.phone = phone
      
      if (Object.keys(updateData).length > 0) {
        await customersApi.update(customerId, updateData)
      }
    } catch (error) {
      console.error("Error updating customer contact info:", error)
    }
  }

  // Create new customer if needed
  const createNewCustomer = async () => {
    if (customerName === "Guest" || !customerName) return

    try {
      setIsSending(true)
      
      // Check if we should create a new customer
      if (!customer) {
        const newCustomer = await customersApi.create({
          name: customerName,
          email: email,
          phone: phone,
          visits: 1,
          last_visit: new Date().toISOString(),
        })
        
        setCustomer(newCustomer as Customer)
        
        toast({
          title: "Customer created",
          description: "Customer information has been saved",
        })
      }
    } catch (error) {
      console.error("Error creating customer:", error)
      toast({
        title: "Error",
        description: "Failed to save customer information",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Receipt</DialogTitle>
          <DialogDescription>
            Send receipt to {customerName || "customer"} via email or WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="mt-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="email">Email Address</Label>
                  {isLoading && <span className="text-xs text-muted-foreground">Loading...</span>}
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="customer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {customer ? (
                  <p className="text-xs text-muted-foreground">
                    Customer found in database
                    {!customer.email && (
                      <span className="ml-1">but no email on record. This will be saved.</span>
                    )}
                  </p>
                ) : customerName && customerName !== "Guest" ? (
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">Customer not found in database.</p>
                    <Button variant="link" size="sm" className="text-xs p-0 h-auto" onClick={createNewCustomer}>
                      Save as new
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="whatsapp" className="mt-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="phone">Phone Number</Label>
                  {isLoading && <span className="text-xs text-muted-foreground">Loading...</span>}
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 555 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Include country code (e.g., +1 for US)</p>
                {customer ? (
                  <p className="text-xs text-muted-foreground">
                    Customer found in database
                    {!customer.phone && (
                      <span className="ml-1">but no phone on record. This will be saved.</span>
                    )}
                  </p>
                ) : customerName && customerName !== "Guest" ? (
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">Customer not found in database.</p>
                    <Button variant="link" size="sm" className="text-xs p-0 h-auto" onClick={createNewCustomer}>
                      Save as new
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="sm:w-auto w-full">
            Cancel
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Tabs defaultValue="email">
              <TabsContent value="email" className="m-0 p-0">
                <Button 
                  onClick={handleSendEmail} 
                  disabled={!email || isSending}
                  className="w-full"
                >
                  {isSending ? "Sending..." : "Send Email"}
                </Button>
              </TabsContent>
              <TabsContent value="whatsapp" className="m-0 p-0">
                <Button 
                  onClick={handleSendWhatsApp} 
                  disabled={!phone || isSending}
                  className="w-full"
                >
                  {isSending ? "Preparing..." : "Send WhatsApp"}
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
