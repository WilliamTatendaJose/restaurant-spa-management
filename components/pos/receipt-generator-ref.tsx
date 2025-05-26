"use client"
import { forwardRef, useRef, useImperativeHandle, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Printer, Mail, Share2, Loader2 } from "lucide-react"
import { useReactToPrint } from "react-to-print"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import { useToast } from "@/hooks/use-toast"

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
    const { toast } = useToast()
    const [isPrinting, setIsPrinting] = useState(false)
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

    const handlePrint = useReactToPrint({
      content: () => receiptRef.current,
      documentTitle: `Receipt-${transactionId}`,
      onBeforeGetContent: () => {
        setIsPrinting(true)
        return new Promise((resolve) => {
          setTimeout(resolve, 500)
        })
      },
      onPrintError: (error) => {
        console.error('Print error:', error)
        setIsPrinting(false)
        toast({
          title: "Print error",
          description: "There was an error printing your receipt. Please try again.",
          variant: "destructive",
        })
      },
      pageStyle: `
        @page {
          size: 80mm 297mm;
          margin: 5mm;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          div {
            break-inside: avoid;
          }
        }
      `,
      removeAfterPrint: true,
      onAfterPrint: () => {
        setIsPrinting(false)
        toast({
          title: "Print job sent",
          description: "Your receipt has been sent to the printer",
        })
      },
    })

    const generatePDF = async () => {
      if (!receiptRef.current) return null

      try {
        const element = receiptRef.current
        await Promise.all(
          Array.from(element.getElementsByTagName("img")).map(
            (img) => new Promise((resolve) => {
              if (img.complete) resolve(null)
              else img.onload = () => resolve(null)
            })
          )
        )

        const canvas = await html2canvas(element, {
          scale: 3,
          logging: false,
          useCORS: true,
          backgroundColor: "#ffffff",
          windowWidth: element.offsetWidth,
          windowHeight: element.offsetHeight,
        })

        const imgData = canvas.toDataURL("image/png", 1.0)
        
        const pdfWidth = 80
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width
        
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: [pdfWidth, Math.min(297, pdfHeight + 10)],
          hotfixes: ["px_scaling"],
        })

        pdf.addImage(imgData, "PNG", 5, 5, pdfWidth - 10, pdfHeight)
        return pdf
      } catch (error) {
        console.error("Error generating PDF:", error)
        throw error
      }
    }

    const handleDownloadPDF = async () => {
      setIsGeneratingPDF(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const pdf = await generatePDF()
        if (!pdf) throw new Error("Failed to generate PDF")
        
        pdf.save(`Receipt-${transactionId}.pdf`)
        toast({
          title: "PDF downloaded",
          description: "Your receipt has been downloaded as a PDF",
        })
      } catch (error) {
        console.error("Error downloading PDF:", error)
        toast({
          title: "Download error",
          description: "There was an error downloading your receipt. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsGeneratingPDF(false)
      }
    }

    useImperativeHandle(ref, () => ({
      generatePDF,
      printReceipt: handlePrint,
    }))

    return (
      <div className="space-y-4">
        <div 
          className="bg-white p-4 rounded-lg shadow-sm" 
          ref={receiptRef}
          style={{ width: '80mm', margin: '0 auto' }}
        >
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
          <Button 
            className="flex-1" 
            onClick={() => {
              if (!isPrinting) handlePrint()
            }} 
            disabled={isPrinting}
          >
            {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
            {isPrinting ? "Printing..." : "Print Receipt"}
          </Button>
          <Button 
            className="flex-1" 
            onClick={() => {
              if (!isGeneratingPDF) handleDownloadPDF()
            }} 
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
            {isGeneratingPDF ? "Generating..." : "Download PDF"}
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
