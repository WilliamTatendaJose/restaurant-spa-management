"use client"
import { forwardRef, useState, useEffect } from "react"
import { Separator } from "@/components/ui/separator"
import { businessSettingsApi } from "@/lib/db"
import { ZIMRAApiClient, calculateZimbabweVAT } from "@/lib/zimra-api"
import QRCode from 'qrcode'

interface BusinessSettings {
  businessName: string
  address: string
  phone: string
  email: string
  website: string
  taxRate: string
  openingHours: string
  // ZIMRA specific fields
  zimraTaxNumber?: string
  zimraBusinessType?: string
  zimraRegistrationNumber?: string
}

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  category?: 'spa' | 'restaurant' // For ZIMRA service categorization
}

interface ComponentToPrintProps {
  transactionId: string
  customerName: string
  items: CartItem[]
  total: number
  date: Date
  paymentMethod: string
  businessSettings?: BusinessSettings
  // ZIMRA specific props
  fiscalCode?: string
  zimraReference?: string
  transactionType?: 'spa' | 'restaurant'
  verificationQrCode?: string // Added prop to accept verification QR code from parent
}

// Using a named constant before exporting to ensure proper referencing
export const ComponentToPrint = forwardRef<HTMLDivElement, ComponentToPrintProps>(
  ({ 
    transactionId, 
    customerName, 
    items, 
    total, 
    date, 
    paymentMethod, 
    businessSettings: propBusinessSettings,
    fiscalCode,
    zimraReference,
    transactionType = 'restaurant',
    verificationQrCode
  }, ref) => {
    const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
      businessName: "Spa & Bistro",
      address: "123 Relaxation Ave, Harare, Zimbabwe",
      phone: "+263 4 123-4567",
      email: "info@spaandbistro.com",
      website: "www.spaandbistro.com",
      taxRate: "14", // Zimbabwe VAT rate
      openingHours: "Monday-Friday: 9am-9pm\nSaturday-Sunday: 10am-8pm",
      zimraTaxNumber: process.env.NEXT_PUBLIC_ZIMRA_TAX_NUMBER || "1234567890",
      zimraBusinessType: "HOSPITALITY",
      zimraRegistrationNumber: "REG/2024/001"
    })

    // Generate fiscal code if not provided
    const [generatedFiscalCode, setGeneratedFiscalCode] = useState<string>("")
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("")

    useEffect(() => {
      // If business settings are provided as a prop, use those
      if (propBusinessSettings) {
        // Merge with ZIMRA defaults to ensure all required fields are present
        setBusinessSettings({
          ...propBusinessSettings,
          zimraTaxNumber: propBusinessSettings.zimraTaxNumber || process.env.NEXT_PUBLIC_ZIMRA_TAX_NUMBER || "1234567890",
          zimraBusinessType: propBusinessSettings.zimraBusinessType || "HOSPITALITY",
          zimraRegistrationNumber: propBusinessSettings.zimraRegistrationNumber || "REG/2024/001"
        } as BusinessSettings)
        return
      }

      // Otherwise, load from the database
      async function loadSettings() {
        try {
          const defaultSettings = {
            businessName: "Spa & Bistro",
            address: "123 Relaxation Ave, Harare, Zimbabwe",
            phone: "+263 4 123-4567",
            email: "info@spaandbistro.com",
            website: "www.spaandbistro.com",
            taxRate: "14", // Zimbabwe VAT rate
            openingHours: "Monday-Friday: 9am-9pm\nSaturday-Sunday: 10am-8pm",
            zimraTaxNumber: process.env.NEXT_PUBLIC_ZIMRA_TAX_NUMBER || "1234567890",
            zimraBusinessType: "HOSPITALITY",
            zimraRegistrationNumber: "REG/2024/001"
          }
          const settings = await businessSettingsApi.getSettings(defaultSettings)
          
          // Ensure ZIMRA fields are present
          const enhancedSettings = {
            ...settings,
            zimraTaxNumber: settings.zimraTaxNumber || process.env.NEXT_PUBLIC_ZIMRA_TAX_NUMBER || "1234567890",
            zimraBusinessType: settings.zimraBusinessType || "HOSPITALITY",
            zimraRegistrationNumber: settings.zimraRegistrationNumber || "REG/2024/001"
          }
          
          setBusinessSettings(enhancedSettings as BusinessSettings)
        } catch (error) {
          console.error("Error loading business settings:", error)
        }
      }
      loadSettings()
    }, [propBusinessSettings])

    // Generate fiscal code if not provided
    useEffect(() => {
      if (!fiscalCode && businessSettings.zimraTaxNumber) {
        const generated = ZIMRAApiClient.generateFiscalCode(
          businessSettings.zimraTaxNumber,
          transactionId,
          date
        )
        setGeneratedFiscalCode(generated)
      }
    }, [fiscalCode, businessSettings.zimraTaxNumber, transactionId, date])

    // Calculate VAT using Zimbabwe's 14% rate
    const vatRate = 14 // Zimbabwe VAT rate
    const vatCalculation = calculateZimbabweVAT(total, vatRate)
    const displayFiscalCode = fiscalCode || generatedFiscalCode

    // Generate QR code with receipt verification data if not provided as prop
    useEffect(() => {
      // Only generate QR code if no verification QR is provided via props
      if (!verificationQrCode && businessSettings.zimraTaxNumber && displayFiscalCode) {
        const generateQRCode = async () => {
          try {
            const receiptData = {
              transactionId: transactionId.substring(0, 8),
              fiscalCode: displayFiscalCode,
              zimraReference: zimraReference,
              total: total.toFixed(2),
              date: date.toISOString().split('T')[0],
              businessTaxNumber: businessSettings.zimraTaxNumber,
              verificationUrl: `${businessSettings.website}/verify/${transactionId}`
            }
            
            const qrData = JSON.stringify(receiptData)
            const dataUrl = await QRCode.toDataURL(qrData, {
              width: 64,
              margin: 1,
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              }
            })
            setQrCodeDataUrl(dataUrl)
          } catch (error) {
            console.error('Error generating QR code:', error)
          }
        }
        generateQRCode()
      }
    }, [transactionId, displayFiscalCode, zimraReference, total, date, businessSettings, verificationQrCode])

    // Determine which QR code to use - either from props or generated locally
    const displayQrCode = verificationQrCode || qrCodeDataUrl

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
          <p className="text-sm text-black print:text-black">{businessSettings.email}</p>
        </div>

        {/* ZIMRA Registration Information */}
        <div className="text-center mb-4 border-t border-b border-dashed py-2">
          <p className="text-xs text-black print:text-black font-medium">ZIMRA TAX INVOICE</p>
          {businessSettings.zimraTaxNumber && (
            <p className="text-xs text-black print:text-black">
              Tax Number: {businessSettings.zimraTaxNumber}
            </p>
          )}
          {businessSettings.zimraRegistrationNumber && (
            <p className="text-xs text-black print:text-black">
              Reg. No: {businessSettings.zimraRegistrationNumber}
            </p>
          )}
          <p className="text-xs text-black print:text-black">
            VAT Registration: {businessSettings.zimraTaxNumber}
          </p>
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
          {displayFiscalCode && (
            <p className="text-xs">
              <span className="font-medium">Fiscal Code:</span> {displayFiscalCode}
            </p>
          )}
          {zimraReference && (
            <p className="text-xs">
              <span className="font-medium">ZIMRA Ref:</span> {zimraReference}
            </p>
          )}
          <p className="text-xs">
            <span className="font-medium">Service Type:</span> {transactionType.toUpperCase()} SERVICES
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
                  Rate
                </th>
                <th className="text-right py-1 text-black print:text-black" style={{ textAlign: "right", padding: "4px 0" }}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const itemTotal = item.price * item.quantity
                const itemVAT = calculateZimbabweVAT(itemTotal, vatRate)
                return (
                  <tr key={item.id} className="border-b border-dashed" style={{ borderBottom: "1px dashed #000" }}>
                    <td className="py-1 text-black print:text-black" style={{ padding: "4px 0" }}>
                      <div>{item.name}</div>
                    </td>
                    <td className="text-center py-1 text-black print:text-black" style={{ textAlign: "center", padding: "4px 0" }}>
                      {item.quantity}
                    </td>
                    <td className="text-right py-1 text-black print:text-black" style={{ textAlign: "right", padding: "4px 0" }}>
                      ${item.price.toFixed(2)}
                    </td>
                    <td className="text-right py-1 text-black print:text-black" style={{ textAlign: "right", padding: "4px 0" }}>
                      ${itemTotal.toFixed(2)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {/* VAT Summary Section - ZIMRA Compliant */}
        <div className="mt-4 text-black print:text-black">
          <div className="text-sm mb-2 font-medium border-t pt-2">
            TAX SUMMARY:
          </div>
          
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>Taxable Amount:</span>
              <span>${vatCalculation.netAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT @ {vatRate}%:</span>
              <span>${vatCalculation.vatAmount.toFixed(2)}</span>
            </div>
          </div>
          
          <Separator className="my-2 bg-black" />
          
          <div
            className="flex justify-between font-bold text-lg text-black print:text-black"
            style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}
          >
            <span>TOTAL (Incl. VAT):</span>
            <span>${total.toFixed(2)}</span>
          </div>
          
          <div className="text-xs mt-2 text-center">
            <p>Amount in Words: {numberToWords(total)} Dollars Only</p>
          </div>
        </div>

        {/* ZIMRA Compliance Footer */}
        <div className="mt-4 text-center border-t pt-2">
          <p className="text-xs text-black print:text-black">
            This is a VAT invoice issued in compliance with ZIMRA regulations
          </p>
          <p className="text-xs text-black print:text-black">
            For any queries, contact ZIMRA on +263 4 758 601-19
          </p>
        </div>
        
        {/* Business Footer */}
        <div className="mt-4 text-center">
          <p className="text-sm text-black print:text-black">Thank you for your business!</p>
          <p className="text-xs text-black print:text-black mt-1">{businessSettings.website}</p>
          <p className="text-xs text-black print:text-black">{businessSettings.openingHours}</p>
        </div>

        {/* Verification QR Code - Enhanced to ensure it shows up properly */}
        <div className="mt-4 text-center border-t pt-2">
          <p className="text-xs font-medium text-black print:text-black mb-1">
            Scan QR code for digital receipt verification
          </p>
          {displayQrCode ? (
            <div className="flex justify-center">
              <img 
                src={displayQrCode} 
                alt="Receipt Verification QR Code"
                className="w-24 h-24 mb-2"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          ) : (
            <div className="mx-auto my-2 w-24 h-24 border border-dashed border-gray-400 flex items-center justify-center">
              <span className="text-xs">QR</span>
            </div>
          )}
          
          <div className="text-xs text-black print:text-black mt-1">
            <p>Transaction: {transactionId.substring(0, 8)}</p>
            {zimraReference && <p>ZIMRA Verified - Ref: {zimraReference.substring(0, 8)}</p>}
          </div>
        </div>
      </div>
    )
  },
)

// Helper function to convert numbers to words (simplified version)
function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  
  if (num === 0) return 'Zero'
  
  const integerPart = Math.floor(num)
  let result = ''
  
  if (integerPart >= 1000) {
    const thousands = Math.floor(integerPart / 1000)
    result += convertHundreds(thousands) + ' Thousand '
  }
  
  result += convertHundreds(integerPart % 1000)
  
  return result.trim()
  
  function convertHundreds(n: number): string {
    let str = ''
    
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred '
      n %= 100
    }
    
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' '
      n %= 10
    } else if (n >= 10) {
      str += teens[n - 10] + ' '
      return str
    }
    
    if (n > 0) {
      str += ones[n] + ' '
    }
    
    return str
  }
}

ComponentToPrint.displayName = "ComponentToPrint"
