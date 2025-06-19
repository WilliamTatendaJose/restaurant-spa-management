"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  Eye,
  CheckCircle,
  XCircle,
  MessageSquare,
  Calendar,
  User,
} from "lucide-react";

interface Feedback {
  id: string;
  customer_name: string;
  customer_email: string;
  service_type: string;
  overall_rating: number;
  service_quality: number;
  staff_friendliness: number;
  cleanliness: number;
  value_for_money: number;
  comments: string;
  recommend: string;
  visit_date: string;
  improvements: string;
  status: "pending" | "published" | "rejected";
  created_at: string;
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null
  );
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/feedback");
      const result = await response.json();

      if (result.success) {
        setFeedbacks(result.data);
      } else {
        setError(result.error || "Failed to fetch feedback");
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
      setError("Failed to load feedback data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const updateFeedbackStatus = async (
    id: string,
    status: "published" | "rejected"
  ) => {
    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (result.success) {
        setFeedbacks(
          feedbacks.map((feedback) =>
            feedback.id === id ? { ...feedback, status } : feedback
          )
        );

        toast({
          title: `Feedback ${status === "published" ? "Published" : "Rejected"}`,
          description: `The feedback has been successfully ${status === "published" ? "published" : "rejected"}.`,
        });

        if (selectedFeedback?.id === id) {
          setSelectedFeedback({ ...selectedFeedback, status });
        }
      } else {
        toast({
          title: "Action Failed",
          description: result.error || `Failed to ${status} feedback.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`Error updating feedback status:`, error);
      toast({
        title: "Error",
        description: `Failed to update feedback status.`,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRecommendText = (recommend: string) => {
    switch (recommend) {
      case "definitely":
        return "Definitely";
      case "probably":
        return "Probably";
      case "maybe":
        return "Maybe";
      case "probably_not":
        return "Probably Not";
      case "definitely_not":
        return "Definitely Not";
      default:
        return "N/A";
    }
  };

  const getServiceTypeText = (type: string) => {
    switch (type) {
      case "spa":
        return "Spa Treatment";
      case "restaurant":
        return "Restaurant Dining";
      case "both":
        return "Spa & Restaurant";
      case "other":
        return "Other Services";
      default:
        return type || "N/A";
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "text-amber-500 fill-amber-500" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const pendingFeedbacks = feedbacks.filter((f) => f.status === "pending");
  const publishedFeedbacks = feedbacks.filter((f) => f.status === "published");
  const rejectedFeedbacks = feedbacks.filter((f) => f.status === "rejected");

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader
        heading="Customer Feedback"
        subheading="Review and manage customer feedback submissions"
      />

      <Tabs defaultValue="pending" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">
            Pending{" "}
            <Badge variant="outline" className="ml-2">
              {pendingFeedbacks.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="published">
            Published{" "}
            <Badge variant="outline" className="ml-2">
              {publishedFeedbacks.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected{" "}
            <Badge variant="outline" className="ml-2">
              {rejectedFeedbacks.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <Card>
            <CardContent className="flex justify-center items-center h-64">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div>
                <p className="text-muted-foreground">
                  Loading feedback data...
                </p>
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="flex justify-center items-center h-64">
              <div className="text-center text-destructive">
                <p className="text-lg font-semibold">{error}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => fetchFeedbacks()}
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <TabsContent value="pending">
              <FeedbackTable
                feedbacks={pendingFeedbacks}
                onView={(feedback) => {
                  setSelectedFeedback(feedback);
                  setViewDialogOpen(true);
                }}
                onApprove={(id) => updateFeedbackStatus(id, "published")}
                onReject={(id) => updateFeedbackStatus(id, "rejected")}
                showActions={true}
                getStatusColor={getStatusColor}
                formatDate={formatDate}
                renderStars={renderStars}
              />
            </TabsContent>

            <TabsContent value="published">
              <FeedbackTable
                feedbacks={publishedFeedbacks}
                onView={(feedback) => {
                  setSelectedFeedback(feedback);
                  setViewDialogOpen(true);
                }}
                onApprove={(id) => {}}
                onReject={(id) => updateFeedbackStatus(id, "rejected")}
                showActions={false}
                getStatusColor={getStatusColor}
                formatDate={formatDate}
                renderStars={renderStars}
              />
            </TabsContent>

            <TabsContent value="rejected">
              <FeedbackTable
                feedbacks={rejectedFeedbacks}
                onView={(feedback) => {
                  setSelectedFeedback(feedback);
                  setViewDialogOpen(true);
                }}
                onApprove={(id) => updateFeedbackStatus(id, "published")}
                onReject={(id) => {}}
                showActions={false}
                getStatusColor={getStatusColor}
                formatDate={formatDate}
                renderStars={renderStars}
              />
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Feedback View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedFeedback && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Feedback from {selectedFeedback.customer_name}</span>
                  <Badge className={getStatusColor(selectedFeedback.status)}>
                    {selectedFeedback.status.charAt(0).toUpperCase() +
                      selectedFeedback.status.slice(1)}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {selectedFeedback.customer_email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {selectedFeedback.visit_date
                          ? formatDate(selectedFeedback.visit_date)
                          : formatDate(selectedFeedback.created_at)}
                      </span>
                    </div>
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 my-4">
                {/* Service Type and Recommendation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">
                      Service Type
                    </h4>
                    <p className="font-medium text-gray-900">
                      {getServiceTypeText(selectedFeedback.service_type)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">
                      Would Recommend
                    </h4>
                    <div className="flex items-center gap-2">
                      {selectedFeedback.recommend === "definitely" ||
                      selectedFeedback.recommend === "probably" ? (
                        <ThumbsUp className="h-4 w-4 text-green-600" />
                      ) : selectedFeedback.recommend === "definitely_not" ||
                        selectedFeedback.recommend === "probably_not" ? (
                        <ThumbsDown className="h-4 w-4 text-red-600" />
                      ) : (
                        <div className="h-4 w-4" />
                      )}
                      <p className="font-medium">
                        {getRecommendText(selectedFeedback.recommend)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ratings */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">
                    Ratings
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        Overall Rating
                      </p>
                      {renderStars(selectedFeedback.overall_rating)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        Service Quality
                      </p>
                      {renderStars(selectedFeedback.service_quality)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        Staff Friendliness
                      </p>
                      {renderStars(selectedFeedback.staff_friendliness)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Cleanliness</p>
                      {renderStars(selectedFeedback.cleanliness)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        Value for Money
                      </p>
                      {renderStars(selectedFeedback.value_for_money)}
                    </div>
                  </div>
                </div>

                {/* Comments and Improvements */}
                <div className="space-y-4">
                  {selectedFeedback.comments && (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        Comments
                      </h4>
                      <p className="text-gray-700 whitespace-pre-line">
                        {selectedFeedback.comments}
                      </p>
                    </div>
                  )}

                  {selectedFeedback.improvements && (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        Suggested Improvements
                      </h4>
                      <p className="text-gray-700 whitespace-pre-line">
                        {selectedFeedback.improvements}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {selectedFeedback.status === "pending" && (
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                      onClick={() => {
                        updateFeedbackStatus(selectedFeedback.id, "rejected");
                        setViewDialogOpen(false);
                      }}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        updateFeedbackStatus(selectedFeedback.id, "published");
                        setViewDialogOpen(false);
                      }}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Publish
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface FeedbackTableProps {
  feedbacks: Feedback[];
  onView: (feedback: Feedback) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  showActions: boolean;
  getStatusColor: (status: string) => string;
  formatDate: (date: string) => string;
  renderStars: (rating: number) => JSX.Element;
}

function FeedbackTable({
  feedbacks,
  onView,
  onApprove,
  onReject,
  showActions,
  getStatusColor,
  formatDate,
  renderStars,
}: FeedbackTableProps) {
  if (feedbacks.length === 0) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-64">
          <div className="text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No feedback entries found</p>
            <p className="text-sm">
              When customers submit feedback, it will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Service Type</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feedbacks.map((feedback) => (
              <TableRow key={feedback.id}>
                <TableCell className="font-medium">
                  {feedback.customer_name}
                </TableCell>
                <TableCell>
                  {feedback.service_type === "spa" && "Spa Treatment"}
                  {feedback.service_type === "restaurant" && "Restaurant"}
                  {feedback.service_type === "both" && "Spa & Restaurant"}
                  {feedback.service_type === "other" && "Other"}
                  {!feedback.service_type && "N/A"}
                </TableCell>
                <TableCell>{renderStars(feedback.overall_rating)}</TableCell>
                <TableCell>{formatDate(feedback.created_at)}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(feedback.status)}>
                    {feedback.status.charAt(0).toUpperCase() +
                      feedback.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onView(feedback)}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {showActions && feedback.status === "pending" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onApprove(feedback.id)}
                          className="text-green-600 hover:text-green-800 hover:bg-green-50"
                          title="Publish Feedback"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onReject(feedback.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          title="Reject Feedback"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
