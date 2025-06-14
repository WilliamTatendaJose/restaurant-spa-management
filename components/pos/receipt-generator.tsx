"use client";

import React, { forwardRef, useState, useEffect } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Mail, Share2, Eye, Download, Printer } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { ComponentToPrint } from "@/components/pos/component-to-print";
import { PrintPreviewModal } from "@/components/pos/print-preview-modal";
import { ZIMRAApiClient } from "@/lib/zimra-api";
import { useToast } from "@/hooks/use-toast";
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

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: "spa" | "restaurant";
}

interface ReceiptGeneratorProps {
  transactionId: string;
  customerName: string;
  items: CartItem[];
  total: number;
  paymentMethod: string;
  transactionType?: "spa" | "restaurant";
  onShare: () => void;
  onEmail: () => void;
  onZimraSubmission?: (success: boolean, reference?: string) => void;
  businessSettings?: BusinessSettings;
}

interface Receipt {
  fiscalCode: string;
  deviceId: string;
  receiptNumber: string;
  hash: string;
}

const generateQRCodes = async (
  receipt: Receipt
): Promise<{
  verification: string;
  paymentLink: string;
}> => {
  try {
    // Generate verification QR code with receipt hash
    const verificationData = JSON.stringify({
      fiscalCode: receipt.fiscalCode,
      deviceId: receipt.deviceId,
      receiptNumber: receipt.receiptNumber,
      hash: receipt.hash,
    });

    const verificationQR = await QRCode.toDataURL(verificationData, {
      errorCorrectionLevel: "M",
      type: "image/png",
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    // Generate payment link QR code
    const paymentLinkData = `https://pay.zimra.co.zw/verify/${receipt.fiscalCode}`;
    const paymentLinkQR = await QRCode.toDataURL(paymentLinkData, {
      errorCorrectionLevel: "M",
      type: "image/png",
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    return {
      verification: verificationQR,
      paymentLink: paymentLinkQR,
    };
  } catch (error) {
    console.error("Error generating QR codes:", error);
    return {
      verification: "",
      paymentLink: "",
    };
  }
};

export const ReceiptGenerator = forwardRef<
  HTMLDivElement,
  ReceiptGeneratorProps
>(
  (
    {
      transactionId,
      customerName,
      items,
      total,
      paymentMethod,
      transactionType = "restaurant",
      onShare,
      onEmail,
      onZimraSubmission,
      businessSettings: propBusinessSettings,
    },
    ref
  ) => {
    const [date] = useState(new Date());
    const [fiscalCode, setFiscalCode] = useState<string>("");
    const [zimraReference, setZimraReference] = useState<string>("");
    const [isSubmittingToZimra, setIsSubmittingToZimra] = useState(false);
    const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
      businessName: "Spa & Bistro",
      address: "123 Relaxation Ave, Serenity, CA 90210",
      phone: "(555) 123-4567",
      email: "info@spaandbistro.com",
      website: "www.spaandbistro.com",
      taxRate: "8.5",
      openingHours: "Monday-Friday: 9am-9pm\nSaturday-Sunday: 10am-8pm",
    });
    const [qrCodes, setQrCodes] = useState<{
      verification: string;
      paymentLink: string;
    }>({
      verification: "",
      paymentLink: "",
    });
    const { toast } = useToast();

    // Load business settings from database
    useEffect(() => {
      async function loadBusinessSettings() {
        if (propBusinessSettings) {
          setBusinessSettings(propBusinessSettings);
          return;
        }

        try {
          const defaultSettings = {
            businessName: "Spa & Bistro",
            address: "123 Relaxation Ave, Harare, Zimbabwe",
            phone: "+263 4 123-4567",
            email: "info@spaandbistro.com",
            website: "www.spaandbistro.com",
            taxRate: "14", // Zimbabwe VAT rate
            openingHours: "Monday-Friday: 9am-9pm\nSaturday-Sunday: 10am-8pm",
          };

          const settings = await businessSettingsApi.getSettings(
            defaultSettings
          );
          setBusinessSettings(settings as BusinessSettings);
        } catch (error) {
          console.error("Error loading business settings:", error);
          toast({
            title: "Settings Load Error",
            description: "Failed to load business settings. Using defaults.",
            variant: "destructive",
          });
        }
      }

      loadBusinessSettings();
    }, [propBusinessSettings, toast]);

    // Generate fiscal code on component mount
    useEffect(() => {
      const taxNumber =
        process.env.NEXT_PUBLIC_ZIMRA_TAX_NUMBER || "1234567890";
      const generated = ZIMRAApiClient.generateFiscalCode(
        taxNumber,
        transactionId,
        date
      );
      setFiscalCode(generated);
    }, [transactionId, date]);

    // Auto-submit to ZIMRA when receipt is generated (optional)
    useEffect(() => {
      const autoSubmitToZimra = async () => {
        if (process.env.NEXT_PUBLIC_AUTO_SUBMIT_ZIMRA === "true") {
          await submitToZimra();
        }
      };

      // Only auto-submit if the transaction is completed
      if (transactionId && items.length > 0) {
        autoSubmitToZimra();
      }
    }, [transactionId, items]);

    useEffect(() => {
      const receipt = {
        fiscalCode,
        deviceId: "POS123",
        receiptNumber: transactionId,
        hash: "hash_placeholder",
      };
      generateQRCodes(receipt).then(setQrCodes);
    }, [transactionId, items, total, fiscalCode, zimraReference]);

    // Enhanced ZIMRA submission with retry logic
    const submitToZimra = async (retryCount = 0) => {
      if (isSubmittingToZimra) return;

      setIsSubmittingToZimra(true);
      try {
        const response = await fetch("/api/zimra/receipts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transactionId: transactionId,
            operatorId: "pos_system",
          }),
        });

        const data = await response.json();

        if (data.success && data.referenceNumber) {
          setZimraReference(data.referenceNumber);
          onZimraSubmission?.(true, data.referenceNumber);
        } else {
          // Retry logic for network issues
          if (
            retryCount < 2 &&
            (response.status >= 500 || response.status === 408)
          ) {
            console.log(
              `ZIMRA submission failed, retrying... (${retryCount + 1}/3)`
            );
            setTimeout(
              () => submitToZimra(retryCount + 1),
              2000 * (retryCount + 1)
            );
            return;
          }

          console.error("ZIMRA submission failed:", data.message);
          onZimraSubmission?.(false);
        }
      } catch (error) {
        // Retry for network errors
        if (retryCount < 2) {
          console.log(
            `ZIMRA submission error, retrying... (${retryCount + 1}/3)`
          );
          setTimeout(
            () => submitToZimra(retryCount + 1),
            2000 * (retryCount + 1)
          );
          return;
        }

        console.error("Error submitting to ZIMRA:", error);
        onZimraSubmission?.(false);
      } finally {
        setIsSubmittingToZimra(false);
      }
    };

    // Improved print function with better debugging
    const handlePrintReceipt = () => {
      // Add debugging to understand what's happening
      console.log("Print function called");
      console.log("Ref object:", ref);
      console.log(
        "Ref current:",
        ref && "current" in ref ? ref.current : "No current property"
      );

      // Try multiple approaches to get the receipt content
      let receiptElement = null;

      // First, try the passed ref
      if (ref && "current" in ref && ref.current) {
        receiptElement = ref.current;
        console.log("Using passed ref");
      }

      // If that fails, try to find the element by ID
      if (!receiptElement) {
        receiptElement = document.getElementById("receipt-to-print");
        console.log("Using getElementById, found:", receiptElement);
      }

      // If still no element, try querySelector
      if (!receiptElement) {
        receiptElement = document.querySelector('[data-receipt="true"]');
        console.log("Using querySelector, found:", receiptElement);
      }

      if (!receiptElement) {
        console.error("No receipt element found");
        toast({
          title: "Print Error",
          description: "Receipt content not found. Please try again.",
          variant: "destructive",
        });
        return;
      }

      try {
        const printContent = receiptElement.innerHTML;
        console.log("Receipt content length:", printContent.length);

        if (!printContent || printContent.trim().length === 0) {
          throw new Error("Receipt content is empty");
        }

        const printWindow = window.open("", "_blank");

        if (!printWindow) {
          toast({
            title: "Print Error",
            description:
              "Unable to open print window. Please check your browser's popup settings.",
            variant: "destructive",
          });
          return;
        }

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Receipt-${transactionId}</title>
              <meta charset="utf-8">
              <style>
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                
                body { 
                  font-family: 'Courier New', monospace; 
                  margin: 0; 
                  padding: 10px; 
                  color: #000 !important;
                  background-color: #fff;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                  font-size: 12px;
                  line-height: 1.2;
                }
                
                .receipt-content { 
                  max-width: 350px; 
                  margin: 0 auto; 
                  color: #000 !important;
                }
                
                table { 
                  width: 100%; 
                  border-collapse: collapse; 
                  color: #000 !important;
                  margin: 8px 0;
                }
                
                th, td { 
                  padding: 2px 4px; 
                  color: #000 !important;
                  vertical-align: top;
                }
                
                th { 
                  text-align: left; 
                  font-weight: bold;
                  border-bottom: 1px solid #000;
                }
                
                .text-right { 
                  text-align: right !important; 
                }
                
                .text-center { 
                  text-align: center !important; 
                }
                
                .border-bottom { 
                  border-bottom: 1px solid #000; 
                }
                
                .border-dashed { 
                  border-bottom: 1px dashed #000; 
                }
                
                .font-medium { 
                  font-weight: 500; 
                }
                
                .font-bold { 
                  font-weight: 700; 
                }
                
                .text-sm { 
                  font-size: 11px; 
                }
                
                .text-xs { 
                  font-size: 10px; 
                }
                
                .text-lg { 
                  font-size: 14px; 
                }
                
                .mb-2 { 
                  margin-bottom: 8px; 
                }
                
                .mb-4 { 
                  margin-bottom: 16px; 
                }
                
                .mt-2 { 
                  margin-top: 8px; 
                }
                
                .mt-4 { 
                  margin-top: 16px; 
                }
                
                .mt-6 { 
                  margin-top: 24px; 
                }
                
                .p-4 { 
                  padding: 16px; 
                }
                
                .py-1 {
                  padding-top: 4px;
                  padding-bottom: 4px;
                }
                
                .py-2 {
                  padding-top: 8px;
                  padding-bottom: 8px;
                }
                
                .pt-2 {
                  padding-top: 8px;
                }
                
                .border-t {
                  border-top: 1px solid #000;
                }
                
                .text-muted { 
                  color: #666 !important; 
                }
                
                img {
                  max-width: 100%;
                  height: auto;
                  display: block;
                  margin: 0 auto;
                }
                
                /* Print-specific styles */
                @page {
                  size: 80mm auto;
                  margin: 2mm;
                }
                
                @media print {
                  body {
                    margin: 0;
                    padding: 5px;
                    color: #000 !important;
                    font-size: 11px;
                  }
                  
                  * {
                    color: #000 !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }
                  
                  .no-print {
                    display: none !important;
                  }
                }
                
                /* Ensure all text is black */
                h1, h2, h3, h4, h5, h6, p, span, div, td, th {
                  color: #000 !important;
                }
              </style>
            </head>
            <body onload="window.print(); setTimeout(() => window.close(), 1000);">
              <div class="receipt-content">${printContent}</div>
            </body>
          </html>
        `);

        printWindow.document.close();

        // Focus the print window to ensure print dialog appears
        printWindow.focus();

        toast({
          title: "Print Started",
          description: "Receipt has been sent to printer.",
        });
      } catch (error) {
        console.error("Print error:", error);
        toast({
          title: "Print Error",
          description: "Failed to print receipt. Please try again.",
          variant: "destructive",
        });
      }
    };

    // Improved PDF generation
    const generatePDF = async () => {
      // Try multiple approaches to get the receipt element
      let receiptElement = null;

      // First, try the passed ref
      if (ref && "current" in ref && ref.current) {
        receiptElement = ref.current;
      }

      // If that fails, try to find the element by ID
      if (!receiptElement) {
        receiptElement = document.getElementById("receipt-to-print");
      }

      // If still no element, try querySelector
      if (!receiptElement) {
        receiptElement = document.querySelector(
          '[data-receipt="true"] #receipt-to-print'
        );
      }

      if (!receiptElement) {
        console.error("Receipt element not found for PDF generation");
        toast({
          title: "Error",
          description: "Receipt content not found for PDF generation",
          variant: "destructive",
        });
        return null;
      }

      try {
        // Create a simple text-based PDF as the primary method
        const doc = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: [80, 200],
        });

        // Header
        doc.setFontSize(14);
        doc.text(businessSettings.businessName, 40, 10, { align: "center" });

        doc.setFontSize(8);
        doc.text(businessSettings.address, 40, 16, { align: "center" });
        doc.text(businessSettings.phone, 40, 20, { align: "center" });
        doc.text(businessSettings.email, 40, 24, { align: "center" });

        // Receipt details
        doc.setFontSize(10);
        let yPos = 35;
        doc.text(`Receipt #: ${transactionId.substring(0, 8)}`, 5, yPos);
        yPos += 4;
        doc.text(`Date: ${date.toLocaleDateString()}`, 5, yPos);
        yPos += 4;
        doc.text(`Time: ${date.toLocaleTimeString()}`, 5, yPos);
        yPos += 4;
        if (customerName) {
          doc.text(`Customer: ${customerName}`, 5, yPos);
          yPos += 4;
        }
        doc.text(`Payment: ${paymentMethod}`, 5, yPos);
        yPos += 4;
        if (fiscalCode) {
          doc.text(`Fiscal Code: ${fiscalCode}`, 5, yPos);
          yPos += 4;
        }
        if (zimraReference) {
          doc.text(`ZIMRA Ref: ${zimraReference}`, 5, yPos);
          yPos += 4;
        }

        // Items header
        yPos += 5;
        doc.line(5, yPos, 75, yPos); // Horizontal line
        yPos += 5;
        doc.text("Item", 5, yPos);
        doc.text("Qty", 45, yPos);
        doc.text("Rate", 55, yPos);
        doc.text("Amount", 65, yPos);
        yPos += 3;
        doc.line(5, yPos, 75, yPos); // Horizontal line
        yPos += 3;

        // Items
        items.forEach((item) => {
          const itemName =
            item.name.length > 25
              ? item.name.substring(0, 25) + "..."
              : item.name;
          const itemTotal = item.price * item.quantity;

          doc.text(itemName, 5, yPos);
          doc.text(item.quantity.toString(), 45, yPos);
          doc.text(`$${item.price.toFixed(2)}`, 55, yPos);
          doc.text(`$${itemTotal.toFixed(2)}`, 65, yPos);
          yPos += 4;
        });

        // Tax summary
        yPos += 3;
        doc.line(5, yPos, 75, yPos); // Horizontal line
        yPos += 5;

        const vatRate = 14; // Zimbabwe VAT rate
        const netAmount = total / 1.14;
        const vatAmount = total - netAmount;

        doc.text(`Taxable Amount: $${netAmount.toFixed(2)}`, 5, yPos);
        yPos += 4;
        doc.text(`VAT @ ${vatRate}%: $${vatAmount.toFixed(2)}`, 5, yPos);
        yPos += 4;

        doc.line(5, yPos, 75, yPos); // Horizontal line
        yPos += 5;

        doc.setFontSize(12);
        doc.text(`TOTAL: $${total.toFixed(2)}`, 40, yPos, { align: "center" });
        yPos += 8;

        // Footer
        doc.setFontSize(8);
        doc.text("Thank you for your business!", 40, yPos, { align: "center" });
        yPos += 4;
        doc.text(businessSettings.website, 40, yPos, { align: "center" });
        yPos += 4;
        doc.text("ZIMRA Compliant Tax Invoice", 40, yPos, { align: "center" });

        return doc;
      } catch (error) {
        console.error("Error generating text-based PDF:", error);

        // Fallback: Try html2canvas approach
        try {
          console.log("Attempting html2canvas fallback...");

          // Wait for images to load
          const images = receiptElement.getElementsByTagName("img");
          const imagePromises = Array.from(images).map((img) => {
            return new Promise<void>((resolve) => {
              if (img.complete) {
                resolve();
              } else {
                img.onload = () => resolve();
                img.onerror = () => resolve();
                setTimeout(() => resolve(), 1000); // Shorter timeout
              }
            });
          });

          await Promise.all(imagePromises);
          await new Promise((resolve) => setTimeout(resolve, 300));

          const canvas = await html2canvas(receiptElement, {
            scale: 1,
            logging: false,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            width: receiptElement.offsetWidth,
            height: receiptElement.offsetHeight,
          });

          const imgData = canvas.toDataURL("image/jpeg", 0.8);
          const imgWidth = 70;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: [80, Math.max(120, imgHeight + 20)],
          });

          doc.addImage(imgData, "JPEG", 5, 10, imgWidth, imgHeight);
          return doc;
        } catch (canvasError) {
          console.error("html2canvas fallback also failed:", canvasError);
          throw error; // Re-throw original error
        }
      }
    };

    const handleDownloadPDF = async () => {
      setIsDownloading(true);
      try {
        const pdf = await generatePDF();
        if (pdf) {
          pdf.save(`Receipt-${transactionId.substring(0, 8)}.pdf`);
          toast({
            title: "PDF Downloaded",
            description: "Receipt has been downloaded successfully.",
          });
        } else {
          throw new Error("Failed to generate PDF");
        }
      } catch (error) {
        console.error("Error downloading PDF:", error);
        toast({
          title: "Download Error",
          description: "Failed to download PDF. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsDownloading(false);
      }
    };

    const handlePrintPreview = () => {
      setIsPrintPreviewOpen(true);
    };

    return (
      <div className="space-y-4">
        <div data-receipt="true">
          <ComponentToPrint
            ref={ref}
            transactionId={transactionId}
            customerName={customerName}
            items={items}
            total={total}
            date={date}
            paymentMethod={paymentMethod}
            fiscalCode={fiscalCode}
            zimraReference={zimraReference}
            transactionType={transactionType}
            businessSettings={businessSettings}
            verificationQrCode={qrCodes.verification}
          />
        </div>

        {/* QR Code Section */}
        <div className="qr-section border-t pt-4 mt-4">
          <div className="flex justify-between items-start gap-4">
            {/* Verification QR Code */}
            <div className="text-center flex-1">
              <p className="text-xs font-medium mb-2">Receipt Verification</p>
              {qrCodes.verification ? (
                <img
                  src={qrCodes.verification}
                  alt="Receipt Verification QR"
                  className="mx-auto mb-1"
                  style={{ width: "80px", height: "80px" }}
                />
              ) : (
                <div className="w-20 h-20 mx-auto mb-1 bg-gray-100 flex items-center justify-center">
                  <span className="text-xs text-gray-400">Loading...</span>
                </div>
              )}
              <p className="text-[8px] text-gray-600">Scan to verify receipt</p>
            </div>

            {/* Payment/Feedback QR Code */}
            <div className="text-center flex-1">
              <p className="text-xs font-medium mb-2">Feedback & Payment</p>
              {qrCodes.paymentLink ? (
                <img
                  src={qrCodes.paymentLink}
                  alt="Payment Link QR"
                  className="mx-auto mb-1"
                  style={{ width: "80px", height: "80px" }}
                />
              ) : (
                <div className="w-20 h-20 mx-auto mb-1 bg-gray-100 flex items-center justify-center">
                  <span className="text-xs text-gray-400">Loading...</span>
                </div>
              )}
              <p className="text-[8px] text-gray-600">
                Scan for online services
              </p>
            </div>
          </div>
        </div>

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
          <Button className="flex-1" variant="outline" onClick={onEmail}>
            <Mail className="mr-2 h-4 w-4" />
            Email Receipt
          </Button>
        </div>

        {/* ZIMRA Submission Status */}
        <div className="border-t pt-2">
          {zimraReference ? (
            <div className="text-sm text-green-600 text-center">
              ✓ ZIMRA Submitted - Ref: {zimraReference}
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => submitToZimra()}
              disabled={isSubmittingToZimra}
              className="w-full"
            >
              {isSubmittingToZimra
                ? "Submitting to ZIMRA..."
                : "Submit to ZIMRA"}
            </Button>
          )}
        </div>

        <PrintPreviewModal
          open={isPrintPreviewOpen}
          onOpenChange={setIsPrintPreviewOpen}
          onPrint={handlePrintReceipt}
          receiptRef={ref as React.RefObject<HTMLDivElement>}
        />
      </div>
    );
  }
);

ReceiptGenerator.displayName = "ReceiptGenerator";
