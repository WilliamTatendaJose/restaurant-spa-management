"use client"
import { forwardRef, useState, useEffect } from "react"
import { Separator } from "@/components/ui/separator"
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

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

interface ComponentToPrintProps {
  transactionId: string
  customerName: string
  items: CartItem[]
  total: number
  date: Date
  paymentMethod: string
  businessSettings?: BusinessSettings
}

// Using a named constant before exporting to ensure proper referencing
export const ComponentToPrint = forwardRef<HTMLDivElement, ComponentToPrintProps>(
  ({ transactionId, customerName, items, total, date, paymentMethod, businessSettings: propBusinessSettings }, ref) => {
    const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
      businessName: "Spa & Bistro",
      address: "123 Relaxation Ave, Serenity, CA 90210",
      phone: "(555) 123-4567",
      email: "info@spaandbistro.com",
      website: "www.spaandbistro.com",
      taxRate: "8.5",
      openingHours: "Monday-Friday: 9am-9pm\nSaturday-Sunday: 10am-8pm",
    })

    useEffect(() => {
      // If business settings are provided as a prop, use those
      if (propBusinessSettings) {
        setBusinessSettings(propBusinessSettings)
        return
      }

      // Otherwise, load from the database
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
        }
      }

      loadSettings()
    }, [propBusinessSettings])

    // Calculate tax amount and total with tax
    const taxRate = parseFloat(businessSettings.taxRate) || 8.5
    const taxAmount = (total * (taxRate / 100)).toFixed(2)
    const totalWithTax = (total * (1 + taxRate / 100)).toFixed(2)

    return (
      <div
        className="bg-white p-4 rounded-lg shadow-sm text-black print:text-black"
        ref={ref}
        style={{ width: "100%", maxWidth: "350px", margin: "0 auto", color: "black" }}
        id="receipt-to-print"
      >
        {/* Company Header */}
        <div className="text-center mb-4">
          <h2 className="font-bold text-xl text-black print:text-black">{businessSettings.businessName}</h2>
          <p className="text-sm text-black print:text-black">{businessSettings.address}</p>
          <p className="text-sm text-black print:text-black">{businessSettings.phone}</p>
        </div>
        
        {/* Receipt Details */}
        <div className="mb-4 text-black print:text-black">
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
          <p className="text-sm">
            <span className="font-medium">Payment:</span> <span className="capitalize">{paymentMethod}</span>
          </p>
        </div>
        
        <Separator className="my-2 bg-black print:bg-black" />
        
        {/* Items Table */}
        <div className="mb-4 text-black print:text-black">
          <table className="w-full text-sm text-black print:text-black" style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr className="border-b" style={{ borderBottom: "1px solid #000" }}>
                <th className="text-left py-1 text-black print:text-black" style={{ textAlign: "left", padding: "4px 0" }}>
                  Item
                </th>
                <th className="text-center py-1 text-black print:text-black" style={{ textAlign: "center", padding: "4px 0" }}>
                  Qty
                </th>
                <th className="text-right py-1 text-black print:text-black" style={{ textAlign: "right", padding: "4px 0" }}>
                  Price
                </th>
                <th className="text-right py-1 text-black print:text-black" style={{ textAlign: "right", padding: "4px 0" }}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-dashed" style={{ borderBottom: "1px dashed #000" }}>
                  <td className="py-1 text-black print:text-black" style={{ padding: "4px 0" }}>
                    {item.name}
                  </td>
                  <td className="text-center py-1 text-black print:text-black" style={{ textAlign: "center", padding: "4px 0" }}>
                    {item.quantity}
                  </td>
                  <td className="text-right py-1 text-black print:text-black" style={{ textAlign: "right", padding: "4px 0" }}>
                    ${item.price.toFixed(2)}
                  </td>
                  <td className="text-right py-1 text-black print:text-black" style={{ textAlign: "right", padding: "4px 0" }}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Totals Section */}
        <div className="mt-4 text-black print:text-black">
          <div
            className="flex justify-between font-medium text-black print:text-black"
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            <span>Subtotal:</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-black print:text-black" style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Tax ({taxRate}%):</span>
            <span>${taxAmount}</span>
          </div>
          <Separator className="my-2 bg-black" />
          <div
            className="flex justify-between font-bold text-lg text-black print:text-black"
            style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}
          >
            <span>Total:</span>
            <span>${totalWithTax}</span>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-black print:text-black">Thank you for your business!</p>
          <p className="text-xs text-black print:text-black mt-1">{businessSettings.website}</p>
        </div>
      </div>
    )
  },
)
ComponentToPrint.displayName = "ComponentToPrint"
