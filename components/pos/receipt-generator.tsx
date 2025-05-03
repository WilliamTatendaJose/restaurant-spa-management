"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Mail, Share2, Eye, Download, Printer } from "lucide-react"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import { ComponentToPrint } from "@/components/pos/component-to-print"
import { PrintPreviewModal } from "@/components/pos/print-preview-modal"

interface BusinessSettings {
  businessName: string
  address: string
  phone: string
  email: string
  website: string
  taxRate: string
  openingHours: string
}

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

interface ReceiptGeneratorProps {
  transactionId: string
  customerName: string
  items: CartItem[]
  total: number
  date: Date
  paymentMethod: string
  onShare: () => void
  onEmail: () => void
  businessSettings?: BusinessSettings
}

export function ReceiptGenerator({
  transactionId,
  customerName,
  items,
  total,
  date,
  paymentMethod,
  onShare,
  onEmail,
  businessSettings = {
    businessName: "Spa & Bistro",
    address: "123 Relaxation Ave, Serenity, CA 90210",
    phone: "(555) 123-4567",
    email: "info@spaandbistro.com",
    website: "www.spaandbistro.com",
    taxRate: "8.5",
    openingHours: "Monday-Friday: 9am-9pm\nSaturday-Sunday: 10am-8pm",
  },
}: ReceiptGeneratorProps) {
  const componentRef = useRef<HTMLDivElement>(null)
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  // Custom print function that doesn't rely on react-to-print
  const handlePrintReceipt = () => {
    if (componentRef.current) {
      const printContent = componentRef.current.innerHTML
      
      // Create a new window with just the receipt content
      const printWindow = window.open('', '_blank')
      if (!printWindow) return
      
      // Add necessary styles
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt-${transactionId}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 20px; 
                color: #000;
                background-color: #fff;
              }
              .receipt-content { 
                max-width: 350px; 
                margin: 0 auto; 
              }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 4px 0; }
              th { text-align: left; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .border-bottom { border-bottom: 1px solid #e2e8f0; }
              .border-dashed { border-bottom: 1px dashed #e2e8f0; }
              .font-medium { font-weight: 500; }
              .font-bold { font-weight: 700; }
              .text-sm { font-size: 0.875rem; }
              .text-xs { font-size: 0.75rem; }
              .text-lg { font-size: 1.125rem; }
              .mb-2 { margin-bottom: 0.5rem; }
              .mb-4 { margin-bottom: 1rem; }
              .mt-2 { margin-top: 0.5rem; }
              .mt-4 { margin-top: 1rem; }
              .mt-6 { margin-top: 1.5rem; }
              .p-4 { padding: 1rem; }
              .text-muted { color: #6b7280; }
              .text-center { text-align: center; }
            </style>
          </head>
          <body>
            <div class="receipt-content">${printContent}</div>
            <script>
              window.onload = function() { 
                window.print();
                window.setTimeout(function() { window.close(); }, 500);
              }
            </script>
          </body>
        </html>
      `)
      
      printWindow.document.close()
    }
  }

  // Generate PDF from the receipt
  const handleDownloadPDF = async () => {
    setIsDownloading(true)
    try {
      const pdf = await generatePDF()
      if (pdf) {
        pdf.save(`Receipt-${transactionId.substring(0, 8)}.pdf`)
      }
    } catch (error) {
      console.error("Error downloading PDF:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  const generatePDF = async () => {
    if (!componentRef.current) return null

    // Wait for any pending renders to complete
    await new Promise((resolve) => setTimeout(resolve, 100))

    try {
      const canvas = await html2canvas(componentRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: componentRef.current.offsetWidth,
        windowHeight: componentRef.current.offsetHeight,
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 200], // Receipt-sized paper
      })

      const imgWidth = 70
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      pdf.addImage(imgData, "PNG", 5, 5, imgWidth, imgHeight)

      return pdf
    } catch (error) {
      console.error("Error generating PDF:", error)
      return null
    }
  }

  const handlePrintPreview = () => {
    setIsPrintPreviewOpen(true)
  }

  return (
    <div className="space-y-4">
      <ComponentToPrint
        ref={componentRef}
        transactionId={transactionId}
        customerName={customerName}
        items={items}
        total={total}
        date={date}
        paymentMethod={paymentMethod}
        businessSettings={businessSettings}
      />

      <div className="grid grid-cols-2 gap-2">
        <Button 
          className="flex-1" 
          variant="outline" 
          onClick={handlePrintPreview}
        >
          <Eye className="mr-2 h-4 w-4" />
          Print Preview
        </Button>
        <Button 
          className="flex-1" 
          variant="outline" 
          onClick={handlePrintReceipt}
        >
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
        <Button 
          className="flex-1" 
          variant="outline" 
          onClick={handleDownloadPDF}
          disabled={isDownloading}
        >
          <Download className="mr-2 h-4 w-4" />
          {isDownloading ? "Downloading..." : "Download PDF"}
        </Button>
        <Button 
          className="flex-1" 
          variant="outline" 
          onClick={onEmail}
        >
          <Mail className="mr-2 h-4 w-4" />
          Email Receipt
        </Button>
      </div>

      <PrintPreviewModal
        open={isPrintPreviewOpen}
        onOpenChange={setIsPrintPreviewOpen}
        onPrint={handlePrintReceipt}
        receiptRef={componentRef}
      />
    </div>
  )
}
