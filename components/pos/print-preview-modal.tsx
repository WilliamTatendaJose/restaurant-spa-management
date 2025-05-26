"use client";

import { useState, useEffect, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Printer, X } from "lucide-react";
import { businessSettingsApi } from "@/lib/db";

interface BusinessSettings {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxRate: string;
  openingHours: string;
}

interface PrintPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrint: () => void;
  receiptRef: RefObject<HTMLDivElement | null>;
}

export function PrintPreviewModal({
  open,
  onOpenChange,
  onPrint,
  receiptRef,
}: PrintPreviewModalProps) {
  const [businessSettings, setBusinessSettings] =
    useState<BusinessSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        };

        const settings = await businessSettingsApi.getSettings(defaultSettings);
        setBusinessSettings(settings as BusinessSettings);
      } catch (error) {
        console.error("Error loading business settings:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (open) {
      loadSettings();
    }
  }, [open]);

  const handlePrint = () => {
    if (!receiptRef?.current) {
      console.error('Receipt reference is not available');
      return;
    }
    onPrint();
    onOpenChange(false);
  };

  // Safely get the receipt HTML content
  const getReceiptHTML = () => {
    if (!receiptRef?.current) return '';
    
    // Clone the node to avoid modifying the original
    const clone = receiptRef.current.cloneNode(true) as HTMLElement;
    
    // Preserve the styling
    const styles = window.getComputedStyle(receiptRef.current);
    clone.style.cssText = styles.cssText;
    
    // Ensure print-specific styling
    clone.style.width = '100%';
    clone.style.margin = '0';
    clone.style.padding = '1rem';
    
    return clone.outerHTML;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            Receipt Preview - {businessSettings?.businessName || "Spa & Bistro"}
          </DialogTitle>
          <DialogDescription>
            Preview how your receipt will look when printed
          </DialogDescription>
        </DialogHeader>

        <div className="border rounded-md p-4 bg-white my-4 overflow-auto max-h-[60vh]">
          {isLoading ? (
            <div className="text-center py-8">Loading preview...</div>
          ) : (
            <div 
              className="receipt-preview print:w-full print:m-0 print:p-4" 
              dangerouslySetInnerHTML={{ __html: getReceiptHTML() }}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button 
            onClick={handlePrint}
            disabled={!receiptRef?.current}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
