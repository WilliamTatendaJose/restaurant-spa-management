"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Calendar,
  FileText,
  Send,
  CheckCircle,
  AlertCircle,
  Eye,
  Receipt,
  Upload,
} from "lucide-react";
import { formatZWLCurrency } from "@/lib/zimra-api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DailyReturnPreview {
  date: string;
  summary: {
    totalTransactions: number;
    grossSales: number;
    vatAmount: number;
    netSales: number;
    breakdown: {
      spa: {
        transactions: number;
        sales: number;
        vat: number;
        net: number;
      };
      restaurant: {
        transactions: number;
        sales: number;
        vat: number;
        net: number;
      };
    };
  };
  transactions: Array<{
    id: string;
    time: string;
    customer: string;
    type: string;
    amount: number;
    payment: string;
  }>;
}

interface SubmissionRecord {
  date: string;
  referenceNumber: string;
  status: "pending" | "processed" | "failed";
  submittedAt: string;
}

export function ZIMRASettings() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingReceipts, setIsSubmittingReceipts] = useState(false);
  const [receiptSubmissionType, setReceiptSubmissionType] = useState<
    "individual" | "batch"
  >("batch");
  const [preview, setPreview] = useState<DailyReturnPreview | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [statusChecking, setStatusChecking] = useState<string | null>(null);

  // Load recent submissions from localStorage (in production, this would come from a database)
  useEffect(() => {
    const savedSubmissions = localStorage.getItem("zimra_submissions");
    if (savedSubmissions) {
      setSubmissions(JSON.parse(savedSubmissions));
    }
  }, []);

  // Save submissions to localStorage
  const saveSubmissions = (newSubmissions: SubmissionRecord[]) => {
    setSubmissions(newSubmissions);
    localStorage.setItem("zimra_submissions", JSON.stringify(newSubmissions));
  };

  const loadDailyReturnPreview = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/zimra/daily-return?date=${selectedDate}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load daily return preview");
      }

      setPreview(data);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error("Error loading preview:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to load daily return preview",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const submitDailyReturn = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/zimra/daily-return", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ date: selectedDate }),
      });

      const data = await response.json();

      if (data.success) {
        // Add to submissions record
        const newSubmission: SubmissionRecord = {
          date: selectedDate,
          referenceNumber: data.referenceNumber,
          status: "pending",
          submittedAt: new Date().toISOString(),
        };

        const updatedSubmissions = [newSubmission, ...submissions];
        saveSubmissions(updatedSubmissions);

        toast({
          title: "Success",
          description: `Daily return submitted successfully. Reference: ${data.referenceNumber}`,
        });

        setIsPreviewOpen(false);
      } else {
        toast({
          title: "Submission Failed",
          description: data.message || "Failed to submit daily return to ZIMRA",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting daily return:", error);
      toast({
        title: "Error",
        description: "Failed to submit daily return. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitReceipts = async () => {
    setIsSubmittingReceipts(true);
    try {
      if (receiptSubmissionType === "batch") {
        // Submit all receipts for the selected date
        const response = await fetch("/api/zimra/receipts/batch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date: selectedDate,
            operatorId: "system", // You might want to get this from user context
          }),
        });

        const data = await response.json();

        if (data.success) {
          const newSubmission: SubmissionRecord = {
            date: selectedDate,
            referenceNumber: data.referenceNumber,
            status: "pending",
            submittedAt: new Date().toISOString(),
          };

          const updatedSubmissions = [newSubmission, ...submissions];
          saveSubmissions(updatedSubmissions);

          toast({
            title: "Receipts Submitted",
            description: `${data.receiptsSubmitted} receipts submitted successfully. Reference: ${data.referenceNumber}`,
          });

          if (data.validationErrors && data.validationErrors.length > 0) {
            toast({
              title: "Warning",
              description: `${data.validationErrors.length} transactions had validation errors and were skipped.`,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Submission Failed",
            description: data.message || "Failed to submit receipts to ZIMRA",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error submitting receipts:", error);
      toast({
        title: "Error",
        description: "Failed to submit receipts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingReceipts(false);
    }
  };

  const checkSubmissionStatus = async (referenceNumber: string) => {
    setStatusChecking(referenceNumber);
    try {
      const response = await fetch(`/api/zimra/status/${referenceNumber}`);
      const data = await response.json();

      if (response.ok) {
        // Update the submission status
        const updatedSubmissions = submissions.map((sub) =>
          sub.referenceNumber === referenceNumber
            ? { ...sub, status: data.status }
            : sub
        );
        saveSubmissions(updatedSubmissions);

        toast({
          title: "Status Updated",
          description: `Submission ${referenceNumber}: ${data.status}`,
        });
      } else {
        throw new Error(data.error || "Failed to check status");
      }
    } catch (error) {
      console.error("Error checking status:", error);
      toast({
        title: "Error",
        description: "Failed to check submission status",
        variant: "destructive",
      });
    } finally {
      setStatusChecking(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "processed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            ZIMRA Daily Returns
          </CardTitle>
          <CardDescription>
            Submit daily tax returns to Zimbabwe Revenue Authority (ZIMRA)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="date">Select Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="flex gap-2 items-end">
              <Button
                onClick={loadDailyReturnPreview}
                disabled={isLoading}
                variant="outline"
              >
                <Eye className="mr-2 h-4 w-4" />
                {isLoading ? "Loading..." : "Preview"}
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>• VAT Rate: 14% (Zimbabwe standard rate)</p>
            <p>• Currency: USD (commonly used in Zimbabwe)</p>
            <p>• Submission deadline: Daily by end of business day</p>
          </div>
        </CardContent>
      </Card>

      {/* New Receipt Submission Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            ZIMRA Receipt Submission
          </CardTitle>
          <CardDescription>
            Submit individual transaction receipts to ZIMRA for compliance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="receipt-date">Date for Receipt Submission</Label>
              <Input
                id="receipt-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="flex gap-2 items-end">
              <Button
                onClick={submitReceipts}
                disabled={isSubmittingReceipts}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="mr-2 h-4 w-4" />
                {isSubmittingReceipts ? "Submitting..." : "Submit Receipts"}
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              • Individual receipts are required for each completed transaction
            </p>
            <p>• Receipts include detailed line items and fiscal codes</p>
            <p>
              • Batch submission processes all transactions for the selected
              date
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Recent Submissions
          </CardTitle>
          <CardDescription>
            Track your ZIMRA submission history and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No submissions yet. Submit your first daily return or receipts
              above.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reference Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.referenceNumber}>
                    <TableCell>
                      {new Date(submission.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {submission.referenceNumber}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {submission.referenceNumber.includes("BATCH")
                          ? "Receipts"
                          : "Daily Return"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(submission.status)}>
                        {submission.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(submission.submittedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          checkSubmissionStatus(submission.referenceNumber)
                        }
                        disabled={statusChecking === submission.referenceNumber}
                      >
                        {statusChecking === submission.referenceNumber ? (
                          "Checking..."
                        ) : (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Check Status
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog - same as before but with additional info */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Daily Return Preview</DialogTitle>
            <DialogDescription>
              Review the daily return for {preview?.date} before submitting to
              ZIMRA. This includes both summary returns and individual receipt
              submissions.
            </DialogDescription>
          </DialogHeader>

          {preview && (
            <div className="space-y-4">
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Transactions
                      </p>
                      <p className="text-lg font-semibold">
                        {preview.summary.totalTransactions}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Gross Sales
                      </p>
                      <p className="text-lg font-semibold">
                        {formatZWLCurrency(preview.summary.grossSales)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        VAT Amount (14%)
                      </p>
                      <p className="text-lg font-semibold">
                        {formatZWLCurrency(preview.summary.vatAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Net Sales</p>
                      <p className="text-lg font-semibold">
                        {formatZWLCurrency(preview.summary.netSales)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Service Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Spa Services</h4>
                      <div className="text-sm space-y-1">
                        <p>
                          Transactions:{" "}
                          {preview.summary.breakdown.spa.transactions}
                        </p>
                        <p>
                          Sales:{" "}
                          {formatZWLCurrency(
                            preview.summary.breakdown.spa.sales
                          )}
                        </p>
                        <p>
                          VAT:{" "}
                          {formatZWLCurrency(preview.summary.breakdown.spa.vat)}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Restaurant</h4>
                      <div className="text-sm space-y-1">
                        <p>
                          Transactions:{" "}
                          {preview.summary.breakdown.restaurant.transactions}
                        </p>
                        <p>
                          Sales:{" "}
                          {formatZWLCurrency(
                            preview.summary.breakdown.restaurant.sales
                          )}
                        </p>
                        <p>
                          VAT:{" "}
                          {formatZWLCurrency(
                            preview.summary.breakdown.restaurant.vat
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transaction Details */}
              {preview.transactions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Transaction Details
                    </CardTitle>
                    <CardDescription>
                      These transactions will be submitted as individual
                      receipts to ZIMRA
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-48 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {preview.transactions.map((tx) => (
                            <TableRow key={tx.id}>
                              <TableCell>{tx.time}</TableCell>
                              <TableCell>{tx.customer}</TableCell>
                              <TableCell className="capitalize">
                                {tx.type}
                              </TableCell>
                              <TableCell>
                                {formatZWLCurrency(tx.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitReceipts}
              disabled={
                isSubmittingReceipts ||
                !preview ||
                preview.summary.totalTransactions === 0
              }
              variant="outline"
            >
              {isSubmittingReceipts ? (
                "Submitting Receipts..."
              ) : (
                <>
                  <Receipt className="mr-2 h-4 w-4" />
                  Submit Receipts
                </>
              )}
            </Button>
            <Button
              onClick={submitDailyReturn}
              disabled={
                isSubmitting ||
                !preview ||
                preview.summary.totalTransactions === 0
              }
            >
              {isSubmitting ? (
                "Submitting Return..."
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Daily Return
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
