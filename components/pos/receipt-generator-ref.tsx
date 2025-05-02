"use client"

import { forwardRef, useRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Printer, Mail, Share2 } from "lucide-react"
import ReactToPrint from "react-to-print"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

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
  onShare: () => void
  onEmail: () => void
}

export const ReceiptGenerator = forwardRef<any, ReceiptGeneratorProps>(
  ({ transactionId, customerName, items, total, date, onShare, onEmail }, ref) => {
    const receiptRef = useRef<HTMLDivElement>(null)

    const handlePrint = ReactToPrint.useReactToPrint({
      content: () => receiptRef.current,
      documentTitle: `Receipt-${transactionId}`,
    })

    const generatePDF = async () => {
      if (!receiptRef.current) return null

      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
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
    }

    const handleDownloadPDF = async () => {
      const pdf = await generatePDF()
      if (pdf) {
        pdf.save(`Receipt-${transactionId}.pdf`)
      }
    }

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      generatePDF,
    }))

    return (
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg shadow-sm" ref={receiptRef}>
          <div className="text-center mb-4">
            <h2 className="font-bold text-xl">Spa & Bistro</h2>
            <p className="text-sm text-muted-foreground">123 Relaxation Ave, Serenity, CA 90210</p>
            <p className="text-sm text-muted-foreground">(555) 123-4567</p>
          </div>

          <div className="mb-4">
            <p className="text-sm">
              <span className="font-medium">Receipt #:</span> {transactionId.substring(0, 8)}
            </p>
            <p className="text-sm">
              <span className="font-medium">Date:</span> {date.toLocaleDateString()}
            </p>
            <p className="text-sm">
              <span className="font-medium">Time:</span> {date.toLocaleTimeString()}
            </p>
            {customerName && (
              <p className="text-sm">
                <span className="font-medium">Customer:</span> {customerName}
              </p>
            )}
          </div>

          <Separator className="my-2" />

          <div className="mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1">Item</th>
                  <th className="text-center py-1">Qty</th>
                  <th className="text-right py-1">Price</th>
                  <th className="text-right py-1">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-dashed">
                    <td className="py-1">{item.name}</td>
                    <td className="text-center py-1">{item.quantity}</td>
                    <td className="text-right py-1">${item.price.toFixed(2)}</td>
                    <td className="text-right py-1">${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <div className="flex justify-between font-medium">
              <span>Subtotal:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax (8.5%):</span>
              <span>${(total * 0.085).toFixed(2)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>${(total * 1.085).toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm">Thank you for your business!</p>
            <p className="text-xs text-muted-foreground mt-1">www.spaandbistro.com</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button className="flex-1" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Receipt
          </Button>
          <Button className="flex-1" onClick={handleDownloadPDF}>
            <Share2 className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button className="flex-1" onClick={onEmail}>
            <Mail className="mr-2 h-4 w-4" />
            Email Receipt
          </Button>
        </div>
      </div>
    )
  },
)

ReceiptGenerator.displayName = "ReceiptGenerator"
