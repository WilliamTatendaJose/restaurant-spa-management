'use client';

import { useState, useEffect, type RefObject } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Printer, X } from 'lucide-react';
import { businessSettingsApi } from '@/lib/db';

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
  const [previewContent, setPreviewContent] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const defaultSettings = {
          businessName: 'Spa & Bistro',
          address: '123 Relaxation Ave, Harare, Zimbabwe',
          phone: '+263 4 123-4567',
          email: 'info@spaandbistro.com',
          website: 'www.spaandbistro.com',
          taxRate: '14', // Zimbabwe VAT rate
          openingHours: 'Monday-Friday: 9am-9pm\nSaturday-Sunday: 10am-8pm',
        };

        const settings = await businessSettingsApi.getSettings(defaultSettings);
        setBusinessSettings(settings as BusinessSettings);
      } catch (error) {
        console.error('Error loading business settings:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (open) {
      loadSettings();
      // Generate preview content when modal opens
      generatePreviewContent();
    }
  }, [open, receiptRef]);

  const generatePreviewContent = () => {
    // Try multiple approaches to get the receipt element
    let receiptElement = null;

    // First, try the passed ref
    if (receiptRef?.current) {
      receiptElement = receiptRef.current;
    }

    // If that fails, try to find by ID
    if (!receiptElement) {
      receiptElement = document.getElementById('receipt-to-print');
    }

    // If still no element, try querySelector
    if (!receiptElement) {
      receiptElement = document.querySelector(
        '[data-receipt="true"] #receipt-to-print'
      );
    }

    if (receiptElement) {
      // Get the innerHTML and apply preview styles
      const content = receiptElement.innerHTML;
      setPreviewContent(content);
    } else {
      console.error('Receipt element not found for preview');
      setPreviewContent('<div>Receipt content not available for preview</div>');
    }
  };

  const handlePrint = () => {
    if (!receiptRef?.current) {
      console.error('Receipt reference is not available');
      return;
    }
    onPrint();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] max-w-[500px] overflow-auto'>
        <DialogHeader>
          <DialogTitle>
            Receipt Preview - {businessSettings?.businessName || 'Spa & Bistro'}
          </DialogTitle>
          <DialogDescription>
            Preview how your receipt will look when printed
          </DialogDescription>
        </DialogHeader>

        <div className='my-4 max-h-[60vh] overflow-auto rounded-md border bg-white p-4'>
          {isLoading ? (
            <div className='py-8 text-center'>Loading preview...</div>
          ) : (
            <div
              className='receipt-preview'
              style={{
                fontFamily: 'Arial, sans-serif',
                color: '#000',
                fontSize: '14px',
                lineHeight: '1.4',
                maxWidth: '350px',
                margin: '0 auto',
              }}
            >
              <style>{`
                .receipt-preview * {
                  color: #000 !important;
                }
                .receipt-preview table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 8px 0;
                }
                .receipt-preview th,
                .receipt-preview td {
                  padding: 4px;
                  text-align: left;
                  color: #000 !important;
                }
                .receipt-preview .text-right {
                  text-align: right !important;
                }
                .receipt-preview .text-center {
                  text-align: center !important;
                }
                .receipt-preview .font-bold {
                  font-weight: 700 !important;
                }
                .receipt-preview .font-medium {
                  font-weight: 500 !important;
                }
                .receipt-preview .text-sm {
                  font-size: 12px !important;
                }
                .receipt-preview .text-xs {
                  font-size: 10px !important;
                }
                .receipt-preview .text-xl {
                  font-size: 18px !important;
                }
                .receipt-preview .mb-4 {
                  margin-bottom: 16px !important;
                }
                .receipt-preview .mt-4 {
                  margin-top: 16px !important;
                }
                .receipt-preview .py-2 {
                  padding-top: 8px !important;
                  padding-bottom: 8px !important;
                }
                .receipt-preview .border-t {
                  border-top: 1px solid #000 !important;
                }
                .receipt-preview .border-b {
                  border-bottom: 1px solid #000 !important;
                }
                .receipt-preview .border-dashed {
                  border-style: dashed !important;
                }
                .receipt-preview img {
                  max-width: 100%;
                  height: auto;
                  display: block;
                  margin: 0 auto;
                }
                .receipt-preview .bg-black {
                  background-color: #000 !important;
                  height: 1px !important;
                }
              `}</style>
              <div dangerouslySetInnerHTML={{ __html: previewContent }} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            <X className='mr-2 h-4 w-4' />
            Cancel
          </Button>
          <Button onClick={handlePrint} disabled={!receiptRef?.current}>
            <Printer className='mr-2 h-4 w-4' />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
