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
      businessSettings = {
        businessName: "Spa & Bistro",
        address: "123 Relaxation Ave, Serenity, CA 90210",
        phone: "(555) 123-4567",
        email: "info@spaandbistro.com",
        website: "www.spaandbistro.com",
        taxRate: "8.5",
        openingHours: "Monday-Friday: 9am-9pm\nSaturday-Sunday: 10am-8pm",
      },
    },
    ref
  ) => {
    const [date] = useState(new Date());
    const [fiscalCode, setFiscalCode] = useState<string>("");
    const [zimraReference, setZimraReference] = useState<string>("");
    const [isSubmittingToZimra, setIsSubmittingToZimra] = useState(false);
    const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [qrCodes, setQrCodes] = useState<{
      verification: string;
      paymentLink: string;
    }>({
      verification: "",
      paymentLink: "",
    });
    const { toast } = useToast();

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

    // Custom print function that doesn't rely on react-to-print
    const handlePrintReceipt = () => {
      if (ref && "current" in ref && ref.current) {
        const printContent = ref.current.innerHTML;

        // Create a new window with just the receipt content
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

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
        `);

        printWindow.document.close();
      }
    };

    // Generate PDF from the receipt
    const handleDownloadPDF = async () => {
      setIsDownloading(true);
      try {
        const pdf = await generatePDF();
        if (pdf) {
          pdf.save(`Receipt-${transactionId.substring(0, 8)}.pdf`);
        }
      } catch (error) {
        console.error("Error downloading PDF:", error);
      } finally {
        setIsDownloading(false);
      }
    };

    const generatePDF = async () => {
      if (!ref || !("current" in ref) || !ref.current) return null;

      // Wait for any pending renders to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      try {
        const canvas = await html2canvas(ref.current, {
          scale: 2,
          logging: false,
          useCORS: true,
          backgroundColor: "#ffffff",
          windowWidth: ref.current.offsetWidth,
          windowHeight: ref.current.offsetHeight,
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: [80, 200], // Receipt-sized paper
        });

        const imgWidth = 70;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 5, 5, imgWidth, imgHeight);

        return pdf;
      } catch (error) {
        console.error("Error generating PDF:", error);
        return null;
      }
    };

    const handlePrintPreview = () => {
      setIsPrintPreviewOpen(true);
    };

    return (
      <div className="space-y-4">
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
