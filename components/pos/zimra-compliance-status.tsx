import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ZIMRAComplianceStatusProps {
  transactionId?: string;
  onRetrySubmission?: () => void;
}

interface ComplianceStatus {
  isCompliant: boolean;
  fiscalCodeGenerated: boolean;
  zimraSubmitted: boolean;
  zimraReference?: string;
  lastSubmissionAttempt?: string;
  submissionStatus: "pending" | "success" | "failed" | "not_attempted";
  errors?: string[];
}

export const ZIMRAComplianceStatus: React.FC<ZIMRAComplianceStatusProps> = ({
  transactionId,
  onRetrySubmission,
}) => {
  const [status, setStatus] = useState<ComplianceStatus>({
    isCompliant: false,
    fiscalCodeGenerated: false,
    zimraSubmitted: false,
    submissionStatus: "not_attempted",
  });
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();
  const [lastKnownStatus, setLastKnownStatus] =
    useState<string>("not_attempted");

  useEffect(() => {
    if (transactionId) {
      checkComplianceStatus();
    }
  }, [transactionId]);

  useEffect(() => {
    if (
      status.submissionStatus !== lastKnownStatus &&
      lastKnownStatus !== "not_attempted"
    ) {
      switch (status.submissionStatus) {
        case "success":
          toast({
            title: "✅ ZIMRA Submission Successful",
            description: `Transaction successfully submitted to ZIMRA. Reference: ${status.zimraReference?.substring(
              0,
              12
            )}...`,
            duration: 5000,
          });
          break;
        case "failed":
          toast({
            title: "❌ ZIMRA Submission Failed",
            description:
              status.errors?.[0] ||
              "Failed to submit transaction to ZIMRA. Please retry.",
            variant: "destructive",
            duration: 7000,
          });
          break;
        case "pending":
          toast({
            title: "⏳ Submitting to ZIMRA",
            description:
              "Transaction is being submitted to ZIMRA for compliance...",
            duration: 3000,
          });
          break;
      }
    }
    setLastKnownStatus(status.submissionStatus);
  }, [
    status.submissionStatus,
    status.zimraReference,
    status.errors,
    toast,
    lastKnownStatus,
  ]);

  const checkComplianceStatus = async () => {
    if (!transactionId) return;

    setIsChecking(true);
    try {
      const response = await fetch(`/api/zimra/status/${transactionId}`);
      const data = await response.json();

      setStatus({
        isCompliant: data.isCompliant || false,
        fiscalCodeGenerated: data.fiscalCodeGenerated || false,
        zimraSubmitted: data.zimraSubmitted || false,
        zimraReference: data.zimraReference,
        lastSubmissionAttempt: data.lastSubmissionAttempt,
        submissionStatus: data.submissionStatus || "not_attempted",
        errors: data.errors,
      });
    } catch (error) {
      console.error("Error checking ZIMRA compliance status:", error);
      toast({
        title: "⚠️ Status Check Failed",
        description:
          "Unable to check ZIMRA compliance status. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleRetrySubmission = async () => {
    if (onRetrySubmission) {
      toast({
        title: "🔄 Retrying ZIMRA Submission",
        description: "Attempting to resubmit transaction to ZIMRA...",
        duration: 3000,
      });
      onRetrySubmission();
    }
  };

  const getStatusIcon = (success: boolean, pending: boolean = false) => {
    if (pending) return <Clock className="h-4 w-4 text-yellow-500" />;
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = () => {
    switch (status.submissionStatus) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-500">
            ZIMRA Compliant
          </Badge>
        );
      case "failed":
        return <Badge variant="destructive">Submission Failed</Badge>;
      case "pending":
        return <Badge variant="secondary">Submitting...</Badge>;
      default:
        return <Badge variant="outline">Not Submitted</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          ZIMRA Compliance Status
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={checkComplianceStatus}
          disabled={isChecking}
        >
          <RefreshCw
            className={`h-4 w-4 ${isChecking ? "animate-spin" : ""}`}
          />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Overall Status</span>
          {getStatusBadge()}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              {getStatusIcon(status.fiscalCodeGenerated)}
              Fiscal Code Generated
            </span>
            {status.fiscalCodeGenerated && (
              <Badge variant="outline" className="text-xs">
                ✓
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              {getStatusIcon(
                status.zimraSubmitted,
                status.submissionStatus === "pending"
              )}
              ZIMRA Submission
            </span>
            {status.zimraReference && (
              <Badge variant="outline" className="text-xs">
                {status.zimraReference.substring(0, 8)}...
              </Badge>
            )}
          </div>

          {status.lastSubmissionAttempt && (
            <div className="text-xs text-muted-foreground">
              Last attempt:{" "}
              {new Date(status.lastSubmissionAttempt).toLocaleString()}
            </div>
          )}
        </div>

        {status.errors && status.errors.length > 0 && (
          <div className="rounded-md bg-yellow-50 p-3 border border-yellow-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 mb-1">
                  Compliance Issues:
                </p>
                <ul className="text-yellow-700 space-y-1">
                  {status.errors.map((error, index) => (
                    <li key={index} className="text-xs">
                      • {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {status.submissionStatus === "failed" && onRetrySubmission && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetrySubmission}
            className="w-full"
          >
            Retry ZIMRA Submission
          </Button>
        )}

        {!status.isCompliant && (
          <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
            💡 Tip: Ensure all required ZIMRA fields are complete for automatic
            compliance
          </div>
        )}
      </CardContent>
    </Card>
  );
};
