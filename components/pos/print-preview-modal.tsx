"use client"

import { useState, useEffect, type RefObject } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Printer, X } from "lucide-react"
import { businessSettingsApi } from "@/lib/db"

interface BusinessSettings {
  businessName: string
  address: string
  phone: string
  email: string
  website: string
  taxRate: string
  openingHours: string
}

interface PrintPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPrint: () => void
  receiptRef: RefObject<HTMLDivElement | null>
}

export function PrintPreviewModal({ open, onOpenChange, onPrint, receiptRef }: PrintPreviewModalProps) {
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadSettings() {
      try {
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
      } catch (error) {
        console.error("Error loading business settings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (open) {
      loadSettings()
    }
  }, [open])

  const handlePrint = () => {
    onPrint()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Receipt Preview - {businessSettings?.businessName || "Spa & Bistro"}</DialogTitle>
          <DialogDescription>Preview how your receipt will look when printed</DialogDescription>
        </DialogHeader>

        <div className="border rounded-md p-4 bg-white my-4 overflow-auto max-h-[60vh]">
          {/* Clone the receipt content for preview */}
          {receiptRef.current && (
            <div className="receipt-preview" dangerouslySetInnerHTML={{ __html: receiptRef.current.outerHTML }} />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
