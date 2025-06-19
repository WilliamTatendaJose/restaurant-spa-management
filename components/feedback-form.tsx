"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { X, Star, ThumbsUp, ThumbsDown, Flower2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FeedbackFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function FeedbackForm({ onClose, onSuccess }: FeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overallRating, setOverallRating] = useState(0);
  const [serviceQuality, setServiceQuality] = useState(0);
  const [staffFriendliness, setStaffFriendliness] = useState(0);
  const [cleanliness, setCleanliness] = useState(0);
  const [valueForMoney, setValueForMoney] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    service_type: "",
    comments: "",
    improvements: "",
    recommend: "",
    visit_date: "",
  });
  const { toast } = useToast();

  const handleStarClick = (rating: number, ratingType: string) => {
    switch (ratingType) {
      case "overall":
        setOverallRating(rating);
        break;
      case "service":
        setServiceQuality(rating);
        break;
      case "staff":
        setStaffFriendliness(rating);
        break;
      case "cleanliness":
        setCleanliness(rating);
        break;
      case "value":
        setValueForMoney(rating);
        break;
      default:
        break;
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (
        !formData.customer_name ||
        !formData.customer_email ||
        !overallRating
      ) {
        toast({
          title: "Error",
          description:
            "Please fill in all required fields and provide an overall rating",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Submit to API
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          service_type: formData.service_type,
          overall_rating: overallRating,
          service_quality: serviceQuality,
          staff_friendliness: staffFriendliness,
          cleanliness: cleanliness,
          value_for_money: valueForMoney,
          comments: formData.comments,
          recommend: formData.recommend,
          visit_date: formData.visit_date,
          improvements: formData.improvements,
          status: "pending", // Default status
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Thank You!",
          description: "Your feedback has been submitted successfully.",
        });
        onSuccess();
        onClose();
      } else {
        toast({
          title: "Error",
          description:
            result.error || "Failed to submit feedback. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (
    rating: number,
    hoverRating: number,
    onRatingChange: (rating: number) => void,
    onHover?: (rating: number) => void,
    onLeave?: () => void
  ) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            onMouseEnter={onHover ? () => onHover(star) : undefined}
            onMouseLeave={onLeave ? onLeave : undefined}
            className="focus:outline-none focus:ring-2 focus:ring-emerald-700 rounded-sm p-1"
            aria-label={`Rate ${star} out of 5 stars`}
          >
            <Star
              className={`h-8 w-8 ${
                star <= (hoverRating || rating)
                  ? "text-amber-600 fill-amber-600"
                  : "text-gray-400"
              } transition-colors`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Card className="bg-white rounded-3xl shadow-2xl border-emerald-100 overflow-hidden">
      <div className="relative">
        <div className="absolute top-6 right-6 z-10">
          <Button
            variant="outline"
            size="icon"
            onClick={onClose}
            className="rounded-full h-10 w-10 bg-white hover:bg-gray-100 border border-gray-300 shadow-md"
            aria-label="Close feedback form"
          >
            <X className="h-5 w-5 text-gray-700" />
          </Button>
        </div>
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 px-8 py-12 text-white text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <Flower2 className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-4xl font-light mb-3">Share Your Experience</h2>
          <div className="w-16 h-px bg-emerald-300 mx-auto mb-4"></div>
          <p className="text-white max-w-2xl mx-auto">
            Your feedback helps us create better experiences for all our guests.
            Thank you for taking the time to share your thoughts.
          </p>
        </div>
      </div>

      <CardContent className="p-8 bg-gray-50">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Contact Information */}
          <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-medium text-gray-800 border-b border-emerald-200 pb-2">
              Your Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="customer_name"
                  className="text-gray-800 font-medium"
                >
                  Full Name *
                </Label>
                <Input
                  id="customer_name"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                  required
                  className="border-gray-300 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 text-gray-800 bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="customer_email"
                  className="text-gray-800 font-medium"
                >
                  Email Address *
                </Label>
                <Input
                  id="customer_email"
                  name="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                  required
                  className="border-gray-300 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 text-gray-800 bg-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="service_type"
                className="text-gray-800 font-medium"
              >
                Which service did you experience? *
              </Label>
              <Select
                value={formData.service_type}
                onValueChange={(value) =>
                  handleSelectChange("service_type", value)
                }
              >
                <SelectTrigger className="border-gray-300 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 text-gray-800 bg-white">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200">
                  <SelectItem value="spa">Spa Treatment</SelectItem>
                  <SelectItem value="restaurant">Restaurant Dining</SelectItem>
                  <SelectItem value="both">Both Spa & Restaurant</SelectItem>
                  <SelectItem value="other">Other Services</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="visit_date" className="text-gray-800 font-medium">
                Visit Date (Optional)
              </Label>
              <Input
                id="visit_date"
                name="visit_date"
                type="date"
                value={formData.visit_date}
                onChange={handleInputChange}
                max={new Date().toISOString().split("T")[0]}
                className="border-gray-300 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 text-gray-800 bg-white"
              />
            </div>
          </div>

          {/* Ratings */}
          <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-medium text-gray-800 border-b border-emerald-200 pb-2">
              Your Ratings
            </h3>
            <div className="space-y-8">
              <div className="space-y-2">
                <Label className="text-base font-medium text-gray-800">
                  Overall Experience *
                </Label>
                <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-md">
                  {renderStars(
                    overallRating,
                    hoveredRating,
                    (rating) => handleStarClick(rating, "overall"),
                    (rating) => setHoveredRating(rating),
                    () => setHoveredRating(0)
                  )}
                  <span className="text-gray-700 text-sm font-medium px-3 py-1 bg-gray-100 rounded-full">
                    {hoveredRating || overallRating
                      ? ["Poor", "Fair", "Good", "Very Good", "Excellent"][
                          (hoveredRating || overallRating) - 1
                        ]
                      : ""}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 bg-gray-50 p-3 rounded-md">
                  <Label className="text-base font-medium text-gray-800">
                    Service Quality
                  </Label>
                  {renderStars(serviceQuality, 0, (rating) =>
                    handleStarClick(rating, "service")
                  )}
                </div>
                <div className="space-y-2 bg-gray-50 p-3 rounded-md">
                  <Label className="text-base font-medium text-gray-800">
                    Staff Friendliness
                  </Label>
                  {renderStars(staffFriendliness, 0, (rating) =>
                    handleStarClick(rating, "staff")
                  )}
                </div>
                <div className="space-y-2 bg-gray-50 p-3 rounded-md">
                  <Label className="text-base font-medium text-gray-800">
                    Cleanliness
                  </Label>
                  {renderStars(cleanliness, 0, (rating) =>
                    handleStarClick(rating, "cleanliness")
                  )}
                </div>
                <div className="space-y-2 bg-gray-50 p-3 rounded-md">
                  <Label className="text-base font-medium text-gray-800">
                    Value for Money
                  </Label>
                  {renderStars(valueForMoney, 0, (rating) =>
                    handleStarClick(rating, "value")
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-medium text-gray-800 border-b border-emerald-200 pb-2">
              Your Comments
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="comments" className="text-gray-800 font-medium">
                  Please share your experience with us
                </Label>
                <Textarea
                  id="comments"
                  name="comments"
                  value={formData.comments}
                  onChange={handleInputChange}
                  placeholder="What did you enjoy most about your experience?"
                  rows={4}
                  className="border-gray-300 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 text-gray-800 bg-white resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="improvements"
                  className="text-gray-800 font-medium"
                >
                  Any suggestions for improvement?
                </Label>
                <Textarea
                  id="improvements"
                  name="improvements"
                  value={formData.improvements}
                  onChange={handleInputChange}
                  placeholder="How could we make your experience even better?"
                  rows={4}
                  className="border-gray-300 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 text-gray-800 bg-white resize-none"
                />
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="space-y-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <Label className="text-base font-medium text-gray-800">
              Would you recommend us to friends and family?
            </Label>
            <RadioGroup
              value={formData.recommend}
              onValueChange={(value) => handleSelectChange("recommend", value)}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2 p-2 hover:bg-emerald-50 rounded-md transition-colors">
                <RadioGroupItem
                  value="definitely"
                  id="recommend-definitely"
                  className="text-emerald-700 border-gray-400"
                />
                <Label
                  htmlFor="recommend-definitely"
                  className="flex items-center gap-2 text-gray-800 cursor-pointer"
                >
                  <ThumbsUp className="h-4 w-4 text-emerald-700" />
                  Definitely
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2 hover:bg-emerald-50 rounded-md transition-colors">
                <RadioGroupItem
                  value="probably"
                  id="recommend-probably"
                  className="text-emerald-700 border-gray-400"
                />
                <Label
                  htmlFor="recommend-probably"
                  className="text-gray-800 cursor-pointer"
                >
                  Probably
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2 hover:bg-emerald-50 rounded-md transition-colors">
                <RadioGroupItem
                  value="maybe"
                  id="recommend-maybe"
                  className="text-emerald-700 border-gray-400"
                />
                <Label
                  htmlFor="recommend-maybe"
                  className="text-gray-800 cursor-pointer"
                >
                  Maybe
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2 hover:bg-emerald-50 rounded-md transition-colors">
                <RadioGroupItem
                  value="probably_not"
                  id="recommend-probably-not"
                  className="text-emerald-700 border-gray-400"
                />
                <Label
                  htmlFor="recommend-probably-not"
                  className="text-gray-800 cursor-pointer"
                >
                  Probably Not
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2 hover:bg-emerald-50 rounded-md transition-colors">
                <RadioGroupItem
                  value="definitely_not"
                  id="recommend-definitely-not"
                  className="text-emerald-700 border-gray-400"
                />
                <Label
                  htmlFor="recommend-definitely-not"
                  className="flex items-center gap-2 text-gray-800 cursor-pointer"
                >
                  <ThumbsDown className="h-4 w-4 text-red-700" />
                  Definitely Not
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex flex-col md:flex-row gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-6 text-lg border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-6 text-lg bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white shadow-xl hover:shadow-emerald-600/25 font-medium"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                "Submit Feedback"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
