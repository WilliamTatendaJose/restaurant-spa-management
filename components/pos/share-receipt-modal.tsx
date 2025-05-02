"use client"

import { useState } from "react"
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
import type { jsPDF } from "jspdf"

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

      // Mock API call to upload PDF and get a URL
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const mockPdfUrl = `https://example.com/receipts/Receipt-${transactionId}.pdf`

      // Format phone number (remove non-digits)
      const formattedPhone = phone.replace(/\D/g, "")

      // Create WhatsApp link with message
      const message = encodeURIComponent(`Hello ${customerName}, here is your receipt from Spa & Bistro: ${mockPdfUrl}`)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Receipt</DialogTitle>
          <DialogDescription>Send the receipt to the customer via email or WhatsApp.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="mt-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="customer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="whatsapp" className="mt-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 555 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">Include country code (e.g., +1 for US, +44 for UK)</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Cancel
          </Button>
          <Tabs defaultValue="email">
            <TabsContent value="email">
              <Button onClick={handleSendEmail} disabled={!email || isSending}>
                {isSending ? "Sending..." : "Send Email"}
              </Button>
            </TabsContent>
            <TabsContent value="whatsapp">
              <Button onClick={handleSendWhatsApp} disabled={!phone || isSending}>
                {isSending ? "Preparing..." : "Share via WhatsApp"}
              </Button>
            </TabsContent>
          </Tabs>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
