"use client"

import type { RefObject } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Printer, X } from "lucide-react"

interface PrintPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPrint: () => void
  receiptRef: RefObject<HTMLDivElement | null>
}

export function PrintPreviewModal({ open, onOpenChange, onPrint, receiptRef }: PrintPreviewModalProps) {
  const handlePrint = () => {
    onPrint()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Print Preview</DialogTitle>
          <DialogDescription>Preview how your receipt will look when printed</DialogDescription>
        </DialogHeader>

        <div className="border rounded-md p-4 bg-white my-4 overflow-auto max-h-[60vh]">
          {/* Clone the receipt content for preview */}
          {receiptRef.current && (
            <div className="receipt-preview" dangerouslySetInnerHTML={{ __html: receiptRef.current.outerHTML }} />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
