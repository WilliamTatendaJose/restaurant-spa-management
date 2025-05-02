"use client"

import { forwardRef } from "react"
import { Separator } from "@/components/ui/separator"

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
}

// Using a named constant before exporting to ensure proper referencing
export const ComponentToPrint = forwardRef<HTMLDivElement, ComponentToPrintProps>(
  ({ transactionId, customerName, items, total, date, paymentMethod }, ref) => {
    return (
      <div
        className="bg-white p-4 rounded-lg shadow-sm"
        ref={ref}
        style={{ width: "100%", maxWidth: "350px", margin: "0 auto" }}
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
          <p className="text-sm">
            <span className="font-medium">Payment:</span> <span className="capitalize">{paymentMethod}</span>
          </p>
        </div>

        <Separator className="my-2" />

        <div className="mb-4">
          <table className="w-full text-sm" style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr className="border-b" style={{ borderBottom: "1px solid #e2e8f0" }}>
                <th className="text-left py-1" style={{ textAlign: "left", padding: "4px 0" }}>
                  Item
                </th>
                <th className="text-center py-1" style={{ textAlign: "center", padding: "4px 0" }}>
                  Qty
                </th>
                <th className="text-right py-1" style={{ textAlign: "right", padding: "4px 0" }}>
                  Price
                </th>
                <th className="text-right py-1" style={{ textAlign: "right", padding: "4px 0" }}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-dashed" style={{ borderBottom: "1px dashed #e2e8f0" }}>
                  <td className="py-1" style={{ padding: "4px 0" }}>
                    {item.name}
                  </td>
                  <td className="text-center py-1" style={{ textAlign: "center", padding: "4px 0" }}>
                    {item.quantity}
                  </td>
                  <td className="text-right py-1" style={{ textAlign: "right", padding: "4px 0" }}>
                    ${item.price.toFixed(2)}
                  </td>
                  <td className="text-right py-1" style={{ textAlign: "right", padding: "4px 0" }}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <div
            className="flex justify-between font-medium"
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            <span>Subtotal:</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm" style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Tax (8.5%):</span>
            <span>${(total * 0.085).toFixed(2)}</span>
          </div>
          <Separator className="my-2" />
          <div
            className="flex justify-between font-bold text-lg"
            style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}
          >
            <span>Total:</span>
            <span>${(total * 1.085).toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm">Thank you for your business!</p>
          <p className="text-xs text-muted-foreground mt-1">www.spaandbistro.com</p>
        </div>
      </div>
    )
  },
)

ComponentToPrint.displayName = "ComponentToPrint"
