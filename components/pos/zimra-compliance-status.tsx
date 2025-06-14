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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Submitted
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Not Attempted
          </Badge>
        );
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          ZIMRA Compliance Status
          <Button
            variant="ghost"
            size="sm"
            onClick={checkComplianceStatus}
            disabled={isChecking}
          >
            <RefreshCw className={`h-4 w-4 ${isChecking ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Fiscal Code Generated</span>
          {getStatusIcon(status.fiscalCodeGenerated)}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">ZIMRA Submission</span>
          {getStatusBadge(status.submissionStatus)}
        </div>
        
        {status.zimraReference && (
          <div className="p-3 bg-green-50 rounded-md">
            <p className="text-sm font-medium text-green-800">ZIMRA Reference</p>
            <p className="text-xs text-green-600 font-mono">{status.zimraReference}</p>
          </div>
        )}
        
        {status.lastSubmissionAttempt && (
          <div className="text-xs text-muted-foreground">
            Last attempt: {new Date(status.lastSubmissionAttempt).toLocaleString()}
          </div>
        )}
        
        {status.errors && status.errors.length > 0 && (
          <div className="p-3 bg-red-50 rounded-md">
            <p className="text-sm font-medium text-red-800 mb-2">Submission Errors</p>
            <ul className="text-xs text-red-600 space-y-1">
              {status.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
        
        {status.submissionStatus === "failed" && onRetrySubmission && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetrySubmission}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry ZIMRA Submission
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
