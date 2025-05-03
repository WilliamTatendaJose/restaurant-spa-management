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
import { customersApi, businessSettingsApi } from "@/lib/db"
import type { jsPDF } from "jspdf"

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
}

interface BusinessSettings {
  businessName: string
  address: string
  phone: string
  email: string
  website: string
  taxRate: string
  openingHours: string
}

interface ReceiptItem {
  name: string
  quantity: number
  price: number
}

interface ShareReceiptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactionId: string
  customerName: string
  getPdf: () => Promise<jsPDF | null>
  items?: ReceiptItem[]
  total?: number
  date?: Date
  paymentMethod?: string
}

export function ShareReceiptModal({ 
  open, 
  onOpenChange, 
  transactionId, 
  customerName, 
  getPdf,
  items = [],
  total = 0,
  date = new Date(),
  paymentMethod = "cash"
}: ShareReceiptModalProps) {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [receiptUrl, setReceiptUrl] = useState("")
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [activeTab, setActiveTab] = useState("email")
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    businessName: "Spa & Bistro",
    address: "123 Relaxation Ave, Serenity, CA 90210",
    phone: "(555) 123-4567",
    email: "info@spaandbistro.com",
    website: "www.spaandbistro.com",
    taxRate: "8.5",
    openingHours: "Monday-Friday: 9am-9pm\nSaturday-Sunday: 10am-8pm",
  })

  // Load customer data and business settings when modal opens
  useEffect(() => {
    async function loadData() {
      if (!open) return
      
      setIsLoading(true)
      try {
        // Load business settings
        const defaultSettings = {
          businessName: "Spa & Bistro",
          address: "123 Relaxation Ave, Serenity, CA 90210",
          phone: "(555) 123-4567",
          email: "info@spaandbistro.com",
          website: "www.spaandbistro.com",
          taxRate: "8.5",
          openingHours: "Monday-Friday: 9am-9pm\nSaturday-Sunday: 10am-8pm",
        }
        
        const settings = await businessSettingsApi.getSettings(defaultSettings)
        setBusinessSettings(settings as BusinessSettings)
        
        // Skip customer lookup for guests
        if (!customerName || customerName === "Guest") {
          setIsLoading(false)
          return
        }
        
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
        console.error("Error loading data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [open, customerName])

  // Upload PDF and get a URL
  const uploadReceiptPdf = async (): Promise<string> => {
    try {
      setIsUploading(true)
      
      // Get PDF from parent component
      const pdf = await getPdf()
      if (!pdf) {
        throw new Error("Failed to generate PDF")
      }
      
      // Convert PDF to Blob
      const pdfBlob = await pdf.output('blob')
      
      // Create FormData for upload
      const formData = new FormData()
      formData.append("file", new File([pdfBlob], `receipt-${transactionId.substring(0, 8)}.pdf`, { type: "application/pdf" }))
      formData.append("transactionId", transactionId)
      
      // Upload to our API
      const response = await fetch("/api/receipts/upload", {
        method: "POST",
        body: formData,
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to upload receipt")
      }
      
      const result = await response.json()
      return result.url
    } catch (error) {
      console.error("Error uploading receipt:", error)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  const handleSendEmail = async () => {
    if (!email) return

    setIsSending(true)
    try {
      // Upload receipt and get URL if we don't have one already
      if (!receiptUrl) {
        setReceiptUrl(await uploadReceiptPdf())
      }
      
      // Calculate tax amount
      const taxRate = parseFloat(businessSettings.taxRate) || 8.5
      const subtotal = total || 0
      const tax = subtotal * (taxRate / 100)
      
      // Prepare receipt data for the email API
      const receiptData = {
        id: transactionId,
        date: date.toISOString(),
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        subtotal,
        tax,
        taxRate,
        total: subtotal + tax,
        paymentMethod
      }
      
      // Call our email API
      const response = await fetch("/api/receipts/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email,
          subject: `Your receipt from ${businessSettings.businessName}`,
          customerName,
          receiptId: transactionId,
          receiptUrl,
          receiptData,
          businessName: businessSettings.businessName
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to send email")
      }

      // Save contact information if we have a customer but no email
      if (customer && !customer.email && customerName !== "Guest") {
        await updateCustomerContacts(customer.id)
      }

      toast({
        title: "Receipt sent",
        description: `Receipt has been sent to ${email}`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error sending email:", error)
      toast({
        title: "Error",
        description: `Failed to send receipt: ${(error as Error).message}`,
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
      // Upload receipt and get URL if we don't have one already
      if (!receiptUrl) {
        setReceiptUrl(await uploadReceiptPdf())
      }

      // Call our WhatsApp API
      const response = await fetch("/api/receipts/whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: phone,
          customerName,
          receiptId: transactionId,
          receiptUrl,
          businessName: businessSettings.businessName,
          // Optional custom message
          message: `Hello ${customerName}, thank you for your visit to ${businessSettings.businessName}! Here is your receipt: ${receiptUrl}`
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to prepare WhatsApp message")
      }

      const result = await response.json()

      // Save contact information if we have a customer but no phone
      if (customer && !customer.phone && customerName !== "Guest") {
        await updateCustomerContacts(customer.id)
      }

      // If the API returned a direct link, open it
      if (result.directLink && result.whatsappLink) {
        window.open(result.whatsappLink, "_blank")
      }

      toast({
        title: "WhatsApp opened",
        description: "Send the pre-filled message to share the receipt",
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error sending WhatsApp:", error)
      toast({
        title: "Error",
        description: `Failed to share receipt: ${(error as Error).message}`,
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
        toast({
          title: "Contact updated",
          description: "Customer contact information has been saved",
        })
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

  const handleTabChange = (value: string) => {
    setActiveTab(value)
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

        <Tabs defaultValue="email" value={activeTab} onValueChange={handleTabChange} className="w-full">
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
          <Button 
            onClick={activeTab === "email" ? handleSendEmail : handleSendWhatsApp}
            disabled={(activeTab === "email" && !email) || (activeTab === "whatsapp" && !phone) || isSending || isUploading}
            className="w-full sm:w-auto"
          >
            {isUploading ? (
              "Uploading receipt..."
            ) : isSending ? (
              activeTab === "email" ? "Sending..." : "Preparing..."
            ) : (
              activeTab === "email" ? "Send Email" : "Send WhatsApp"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
