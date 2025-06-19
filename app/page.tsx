"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Phone,
  MapPin,
  Clock,
  Star,
  Play,
  ArrowRight,
  Heart,
  Award,
  Flower2,
  Sparkles,
  Users,
  Shield,
  Menu,
  X,
  MessageSquare,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bookingsApi, spaServicesApi, customersApi } from "@/lib/db";
import { FeedbackForm } from "@/components/feedback-form";
import { FeedbackDisplay } from "@/components/feedback-display";

interface SpaService {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  visits?: number;
}

export default function HomePage() {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const { toast } = useToast();

  // Scroll effect for parallax
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Booking form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [spaServices, setSpaServices] = useState<SpaService[]>([]);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    booking_date: "",
    booking_time: "",
    booking_type: "spa",
    service: "",
    party_size: "",
    notes: "",
  });

  const handleBookNow = async () => {
    // Load spa services when modal opens
    try {
      const services = await spaServicesApi.list();
      setSpaServices(services as SpaService[]);
    } catch (error) {
      console.error("Error loading services:", error);
    }
    setShowBookingModal(true);
  };

  const handleWatchStory = () => {
    window.open(
      "https://www.facebook.com/profile.php?id=61575636925432",
      "_blank"
    );
  };

  const handleExploreServices = () => {
    window.location.href = "/treatments";
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

  const handleFeedbackSuccess = () => {
    toast({
      title: "Thank You! 🎉",
      description: "Your feedback helps us improve our services.",
    });
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation
      if (
        !formData.customer_name ||
        !formData.customer_email ||
        !formData.customer_phone ||
        !formData.booking_date ||
        !formData.booking_time
      ) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      if (formData.booking_type === "spa" && !formData.service) {
        toast({
          title: "Error",
          description: "Please select a spa service",
          variant: "destructive",
        });
        return;
      }

      if (formData.booking_type === "restaurant" && !formData.party_size) {
        toast({
          title: "Error",
          description: "Please specify party size for restaurant booking",
          variant: "destructive",
        });
        return;
      }

      // Check for duplicate bookings
      try {
        const existingBookings = await bookingsApi.list();
        const duplicateBooking = existingBookings.find(
          (booking: any) =>
            booking.customer_email?.toLowerCase() ===
              formData.customer_email.toLowerCase() &&
            booking.booking_date === formData.booking_date &&
            booking.booking_time === formData.booking_time &&
            booking.service === formData.service &&
            booking.status !== "cancelled"
        );

        if (duplicateBooking) {
          toast({
            title: "Booking Already Exists",
            description:
              "You already have a booking for this service at this time. Please choose a different time or contact us to modify your existing booking.",
            variant: "destructive",
          });
          return;
        }
      } catch (error) {
        console.error("Error checking for duplicate bookings:", error);
        // Continue with booking creation if check fails
      }

      // First, create or find customer
      let customerId;
      try {
        const existingCustomers = await customersApi.list();
        const existingCustomer = (existingCustomers as Customer[]).find(
          (c: Customer) =>
            c.email?.toLowerCase() === formData.customer_email.toLowerCase()
        );

        if (existingCustomer) {
          customerId = existingCustomer.id;
          // Update customer info if needed
          await customersApi.update(existingCustomer.id, {
            name: formData.customer_name,
            phone: formData.customer_phone,
            last_visit: new Date().toISOString(),
            visits: (existingCustomer.visits || 0) + 1,
          });
        } else {
          // Create new customer
          const newCustomer = await customersApi.create({
            name: formData.customer_name,
            email: formData.customer_email,
            phone: formData.customer_phone,
            customer_type:
              formData.booking_type === "spa" ? "spa" : "restaurant",
            visits: 1,
            last_visit: new Date().toISOString(),
          });
          customerId = newCustomer.id;
        }
      } catch (error) {
        console.error("Error handling customer:", error);
      }

      // Create booking with pending status
      const bookingData = {
        customer_name: formData.customer_name,
        customer_id: customerId,
        customer_email: formData.customer_email, // Add email to booking data
        booking_date: formData.booking_date,
        booking_time: formData.booking_time,
        booking_type: formData.booking_type,
        service: formData.service,
        status: "pending",
        party_size: formData.party_size || null,
        notes: formData.notes || "",
      };

      const booking = await bookingsApi.create(bookingData);

      // Send confirmation email
      try {
        const serviceName =
          formData.booking_type === "spa"
            ? spaServices.find((s: SpaService) => s.id === formData.service)
                ?.name || "Spa Service"
            : `Table for ${formData.party_size} - Restaurant Reservation`;

        const response = await fetch("/api/bookings/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: booking.id,
            customerName: formData.customer_name,
            customerEmail: formData.customer_email,
            customerPhone: formData.customer_phone,
            serviceName,
            bookingDate: formData.booking_date,
            bookingTime: formData.booking_time,
          }),
        });

        const result = await response.json();

        if (result.success) {
          toast({
            title: "Booking Created Successfully! 🎉",
            description:
              "Your booking request has been submitted and a confirmation email has been sent. Our team will contact you soon to confirm your appointment.",
          });
        } else {
          toast({
            title: "Booking Created Successfully! 🎉",
            description:
              "Your booking request has been submitted. Our team will contact you soon to confirm your appointment.",
          });
        }
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
        toast({
          title: "Booking Created Successfully! 🎉",
          description:
            "Your booking request has been submitted. Our team will contact you soon to confirm your appointment.",
        });
      }

      // Reset form and close modal
      setFormData({
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        booking_date: "",
        booking_time: "",
        booking_type: "spa",
        service: "",
        party_size: "",
        notes: "",
      });
      setShowBookingModal(false);
    } catch (error) {
      console.error("Error creating booking:", error);
      toast({
        title: "Error",
        description:
          "Failed to create booking. Please try again or call us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-stone-50 to-amber-50">
      {/* Enhanced Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl border-b border-emerald-100/50 shadow-lg transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-lg"></div>
                <Flower2 className="relative h-10 w-10 text-emerald-600" />
              </div>
              <div>
                <span className="text-2xl font-light text-gray-800 tracking-wide">
                  LEWA
                </span>
                <span className="block text-sm text-emerald-600 font-medium -mt-1">
                  HEALTH SPA
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              <a href="#services" className="group relative py-2">
                <span className="text-gray-600 hover:text-emerald-600 transition-colors font-medium">
                  Services
                </span>
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all duration-300"></div>
              </a>
              <a href="#experience" className="group relative py-2">
                <span className="text-gray-600 hover:text-emerald-600 transition-colors font-medium">
                  Experience
                </span>
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all duration-300"></div>
              </a>
              <a href="#contact" className="group relative py-2">
                <span className="text-gray-600 hover:text-emerald-600 transition-colors font-medium">
                  Contact
                </span>
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all duration-300"></div>
              </a>
              <Button
                onClick={handleBookNow}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-xl hover:shadow-emerald-500/25 transform hover:scale-105 transition-all duration-300 px-6 py-2"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Book Now
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 border-t border-emerald-100">
              <div className="flex flex-col space-y-4 pt-4">
                <a
                  href="#services"
                  className="text-gray-600 hover:text-emerald-600 transition-colors font-medium"
                >
                  Services
                </a>
                <a
                  href="#experience"
                  className="text-gray-600 hover:text-emerald-600 transition-colors font-medium"
                >
                  Experience
                </a>
                <a
                  href="#contact"
                  className="text-gray-600 hover:text-emerald-600 transition-colors font-medium"
                >
                  Contact
                </a>
                <Button
                  onClick={handleBookNow}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white w-full"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Book Now
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Parallax Background */}
        <div
          className="absolute inset-0 transform"
          style={{ transform: `translateY(${scrollY * 0.5}px)` }}
        >
          <Image
            src="https://scontent.fhre2-2.fna.fbcdn.net/v/t39.30808-6/471263064_1106034651516041_5518068055766050068_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeGx9YgYJXJBPiPRvN5yI6HPvjGzf6yINs--MbN_rIg2z6KXWoQZ1YJ8QAyh_CXj6A1UDMwG-8FfSDAOx5wpP7kp&_nc_ohc=xYUVGW6TKE8Q7kNvgGDhz_h&_nc_zt=23&_nc_ht=scontent.fhre2-2.fna&_nc_gid=A8HCtlnU8qy-wJ9yJhpNY4J&oh=00_AYCyqZGKSa2uZY4Yy5YoZZqQ7Jg1oBzFw8VyPRdcUqZZ5Q&oe=678BAE51"
            alt="Luxury Spa Treatment Room"
            fill
            className="object-cover scale-110"
            priority
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/70 via-emerald-800/50 to-amber-900/60"></div>
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-400/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-amber-400/10 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-emerald-500/10 rounded-full blur-xl animate-pulse delay-2000"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-6xl mx-auto px-6">
          <div className="mb-8 animate-fade-in-up">
            <div className="flex items-center justify-center mb-6">
              <div className="relative p-6 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 mr-8">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-amber-400/20 rounded-full blur-lg"></div>
                <Flower2 className="relative h-20 w-20 text-white drop-shadow-2xl" />
              </div>
              <div className="text-left">
                <h1 className="text-7xl text-center md:text-8xl font-extralight text-white tracking-wider drop-shadow-2xl leading-none">
                  LEWA
                </h1>
                <div className="flex items-center mt-2">
                  <div className="h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent w-20 mr-4"></div>
                  <span className="text-3xl md:text-4xl text-amber-200 font-light tracking-wide">
                    HEALTH SPA
                  </span>
                  <div className="h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent w-20 mr-4"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-12 animate-fade-in-up delay-300">
            <p className="text-3xl md:text-4xl text-white/95 mb-6 font-light leading-relaxed">
              Discover Your Sanctuary of Serenity
            </p>
            <p className="text-xl md:text-2xl text-white/85 max-w-4xl mx-auto leading-relaxed mb-4">
              Indulge in transformative wellness experiences that harmonize
              ancient healing traditions with contemporary luxury in Zimbabwe's
              most prestigious spa destination
            </p>
            <p className="text-lg md:text-xl text-white/75 max-w-3xl mx-auto leading-relaxed">
              Located in the heart of Harare's exclusive Highlands district
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-fade-in-up delay-500">
            <Button
              size="lg"
              onClick={handleBookNow}
              className="group bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-16 py-7 text-xl shadow-2xl hover:shadow-emerald-500/30 transform hover:scale-105 transition-all duration-500 border-2 border-emerald-500/50 backdrop-blur-sm"
            >
              <Calendar className="mr-3 h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
              Begin Your Journey
              <Sparkles className="ml-3 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={handleWatchStory}
              className="group border-white/30 bg-white/5 text-white hover:bg-white/10 backdrop-blur-lg px-14 py-7 text-xl shadow-xl border-2 hover:border-white/50 transition-all duration-500"
            >
              <Play className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
              Explore Our Story
            </Button>
          </div>
        </div>
      </section>

      {/* Enhanced Services Section */}
      <section
        id="services"
        className="py-32 px-6 bg-gradient-to-b from-stone-50 via-white to-emerald-50/30"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <Badge
              variant="outline"
              className="mb-6 text-emerald-700 border-emerald-300 bg-emerald-50 px-6 py-2 text-sm font-medium"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Our Signature Services
            </Badge>
            <h2 className="text-6xl md:text-7xl font-extralight text-gray-800 mb-8 tracking-wide">
              Wellness & <span className="text-emerald-600">Beauty</span>
            </h2>
            <div className="w-24 h-px bg-gradient-to-r from-emerald-400 to-amber-400 mx-auto mb-8"></div>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Experience our signature treatments designed to restore your mind,
              body, and spirit in our luxurious spa environment crafted for
              ultimate relaxation
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-20 items-center mb-24">
            {/* Enhanced Massage Therapy Card */}
            <div className="order-2 lg:order-1 group">
              <Card className="overflow-hidden border-0 shadow-2xl hover:shadow-3xl transition-all duration-700 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50">
                <div className="relative overflow-hidden">
                  <Image
                    src="https://scontent.fhre2-2.fna.fbcdn.net/v/t39.30808-6/471340765_1106034674849372_5056996816568959673_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeHx4i6rRqTtFwRpEiR6hv-JR8gJtN3SuOVHyAm03dK45S7Tc1vPjzCYqb9eWz4HNRjY--YjG8W_x8tmnF11qA9B&_nc_ohc=j_KVtMLWL8MQ7kNvgELgvPk&_nc_zt=23&_nc_ht=scontent.fhre2-2.fna&_nc_gid=APnx5JMkJbZiI0R9SkMZKiM&oh=00_AYDhtH-lBnWR3CgmvBnDEXoE3WKRPJOJYRdKAmB8vQO5lg&oe=678BC568"
                    alt="Relaxing Massage Therapy"
                    width={700}
                    height={400}
                    className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-1000"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://scontent.fhre2-2.fna.fbcdn.net/v/t39.30808-6/471263064_1106034651516041_5518068055766050068_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeGx9YgYJXJBPiPRvN5yI6HPvjGzf6yINs--MbN_rIg2z6KXWoQZ1YJ8QAyh_CXj6A1UDMwG-8FfSDAOx5wpP7kp&_nc_ohc=xYUVGW6TKE8Q7kNvgGDhz_h&_nc_zt=23&_nc_ht=scontent.fhre2-2.fna&_nc_gid=A8HCtlnU8qy-wJ9yJhpNY4J&oh=00_AYCyqZGKSa2uZY4Yy5YoZZqQ7Jg1oBzFw8VyPRdcUqZZ5Q&oe=678BAE51";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/80 via-emerald-800/40 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 text-white">
                    <div className="flex items-center mb-3">
                      <Heart className="h-8 w-8 mr-3 text-rose-300" />
                      <Badge className="bg-white/20 text-white border-white/30">
                        Signature Treatment
                      </Badge>
                    </div>
                    <h3 className="text-4xl font-light leading-tight">
                      Therapeutic
                      <br />
                      Massage
                    </h3>
                  </div>
                </div>

                <CardContent className="p-10">
                  <p className="text-gray-600 mb-10 leading-relaxed text-lg">
                    Indulge in our signature massage treatments that combine
                    traditional techniques with modern wellness practices to
                    melt away stress and restore inner harmony.
                  </p>

                  <div className="space-y-6 mb-10">
                    <div className="flex items-center text-gray-700 group/item hover:text-emerald-600 transition-colors">
                      <div className="w-2 h-2 bg-amber-400 rounded-full mr-4 group-hover/item:bg-emerald-500 transition-colors"></div>
                      <span className="text-lg">Deep Tissue Massage</span>
                    </div>
                    <div className="flex items-center text-gray-700 group/item hover:text-emerald-600 transition-colors">
                      <div className="w-2 h-2 bg-amber-400 rounded-full mr-4 group-hover/item:bg-emerald-500 transition-colors"></div>
                      <span className="text-lg">Hot Stone Therapy</span>
                    </div>
                    <div className="flex items-center text-gray-700 group/item hover:text-emerald-600 transition-colors">
                      <div className="w-2 h-2 bg-amber-400 rounded-full mr-4 group-hover/item:bg-emerald-500 transition-colors"></div>
                      <span className="text-lg">Aromatherapy Sessions</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleExploreServices}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 py-6 text-lg group/btn shadow-xl hover:shadow-emerald-500/25 transition-all duration-300"
                  >
                    Explore Massage Services
                    <ArrowRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-2 transition-transform duration-300" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Facial Treatments Card */}
            <div className="order-1 lg:order-2 group">
              <Card className="overflow-hidden border-0 shadow-2xl hover:shadow-3xl transition-all duration-700 bg-gradient-to-br from-amber-50 via-white to-amber-50/50">
                <div className="relative overflow-hidden">
                  <Image
                    src="https://scontent.fhre2-2.fna.fbcdn.net/v/t39.30808-6/471395154_1106034701516036_1418481364985871761_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeHQD1YqZ3rDI9MQHbJXKqKvVq_dJLbTANlWr90kttMA2dpv-sLKV9PgIKr2v8PgOKJ5LTfYnrAH4cWjt0j7P9uQ&_nc_ohc=SJJQNi9YjOEQ7kNvgHZKy1p&_nc_zt=23&_nc_ht=scontent.fhre2-2.fna&_nc_gid=AZx5p4WXx6kWZrGS7-qRhPV&oh=00_AYBQbVJOLJhPfwTMi8HjRJ4vT5v4AYMcJ9wKqjGnw6MNRg&oe=678BCCF9"
                    alt="Luxury Facial Treatment"
                    width={700}
                    height={400}
                    className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-1000"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://scontent.fhre2-2.fna.fbcdn.net/v/t39.30808-6/471263064_1106034651516041_5518068055766050068_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeGx9YgYJXJBPiPRvN5yI6HPvjGzf6yINs--MbN_rIg2z6KXWoQZ1YJ8QAyh_CXj6A1UDMwG-8FfSDAOx5wpP7kp&_nc_ohc=xYUVGW6TKE8Q7kNvgGDhz_h&_nc_zt=23&_nc_ht=scontent.fhre2-2.fna&_nc_gid=A8HCtlnU8qy-wJ9yJhpNY4J&oh=00_AYCyqZGKSa2uZY4Yy5YoZZqQ7Jg1oBzFw8VyPRdcUqZZ5Q&oe=678BAE51";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-900/80 via-amber-800/40 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 text-white">
                    <div className="flex items-center mb-3">
                      <Award className="h-8 w-8 mr-3 text-amber-300" />
                      <Badge className="bg-white/20 text-white border-white/30">
                        Premium Care
                      </Badge>
                    </div>
                    <h3 className="text-4xl font-light leading-tight">
                      Facial
                      <br />
                      Rejuvenation
                    </h3>
                  </div>
                </div>

                <CardContent className="p-10">
                  <p className="text-gray-600 mb-10 leading-relaxed text-lg">
                    Revitalize your skin with our premium facial treatments
                    using organic products and advanced techniques for a
                    radiant, youthful glow that lasts.
                  </p>

                  <div className="space-y-6 mb-10">
                    <div className="flex items-center text-gray-700 group/item hover:text-amber-600 transition-colors">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full mr-4 group-hover/item:bg-amber-500 transition-colors"></div>
                      <span className="text-lg">Anti-Aging Treatments</span>
                    </div>
                    <div className="flex items-center text-gray-700 group/item hover:text-amber-600 transition-colors">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full mr-4 group-hover/item:bg-amber-500 transition-colors"></div>
                      <span className="text-lg">Hydrating Facials</span>
                    </div>
                    <div className="flex items-center text-gray-700 group/item hover:text-amber-600 transition-colors">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full mr-4 group-hover/item:bg-amber-500 transition-colors"></div>
                      <span className="text-lg">Organic Skincare</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleExploreServices}
                    className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 py-6 text-lg group/btn shadow-xl hover:shadow-amber-500/25 transition-all duration-300"
                  >
                    View Facial Services
                    <ArrowRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-2 transition-transform duration-300" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Enhanced Video/Experience Section */}
          <div className="relative rounded-3xl overflow-hidden shadow-3xl bg-gradient-to-br from-emerald-100 via-white to-amber-100 p-16">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 to-amber-50/80"></div>
            <div className="relative text-center">
              <div className="mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <Flower2 className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-5xl font-light mb-6 text-gray-800">
                  Experience <span className="text-emerald-600">Serenity</span>
                </h3>
                <div className="w-16 h-px bg-gradient-to-r from-emerald-400 to-amber-400 mx-auto mb-6"></div>
                <p className="text-xl mb-8 max-w-3xl mx-auto text-gray-600 leading-relaxed">
                  Step into our tranquil spa environment where every detail is
                  designed for your relaxation and every moment is crafted for
                  your wellbeing
                </p>
              </div>
              <Button
                size="lg"
                onClick={handleWatchStory}
                className="bg-gradient-to-r from-emerald-600/20 to-amber-600/20 hover:from-emerald-600/30 hover:to-amber-600/30 backdrop-blur-sm border-2 border-emerald-600/30 text-emerald-800 hover:text-emerald-900 shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-4"
              >
                <Play className="mr-3 h-5 w-5" />
                Take a Virtual Tour
                <Sparkles className="ml-3 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Experience Section */}
      <section
        id="experience"
        className="py-32 bg-gradient-to-br from-stone-100 via-emerald-50/30 to-amber-50/30"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <Badge
              variant="outline"
              className="mb-6 text-amber-700 border-amber-300 bg-amber-50 px-6 py-2 text-sm font-medium"
            >
              <Award className="mr-2 h-4 w-4" />
              The LEWA Experience
            </Badge>
            <h2 className="text-6xl md:text-7xl font-extralight text-gray-800 mb-8 tracking-wide">
              Your Wellness <span className="text-amber-600">Journey</span>
            </h2>
            <div className="w-24 h-px bg-gradient-to-r from-amber-400 to-emerald-400 mx-auto mb-8"></div>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Every moment crafted for your wellbeing and inner peace through
              our holistic approach to luxury wellness
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Enhanced Feature Cards */}
            <div className="text-center group cursor-pointer">
              <div className="relative mb-10">
                <div className="w-full h-64 bg-gradient-to-br from-emerald-200 via-emerald-300 to-emerald-400 rounded-3xl flex items-center justify-center group-hover:scale-105 transition-all duration-700 shadow-xl group-hover:shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl"></div>
                  <Flower2 className="relative h-20 w-20 text-emerald-800 group-hover:rotate-12 transition-transform duration-500" />
                </div>
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-lg border-4 border-emerald-100"></div>
              </div>
              <h3 className="text-3xl font-light text-gray-800 mb-6 group-hover:text-emerald-600 transition-colors">
                Serene Atmosphere
              </h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Immerse yourself in carefully curated spaces designed for
                ultimate relaxation, peace, and spiritual renewal
              </p>
            </div>

            <div className="text-center group cursor-pointer">
              <div className="relative mb-10">
                <div className="w-full h-64 bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400 rounded-3xl flex items-center justify-center group-hover:scale-105 transition-all duration-700 shadow-xl group-hover:shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl"></div>
                  <Heart className="relative h-20 w-20 text-amber-800 group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-lg border-4 border-amber-100"></div>
              </div>
              <h3 className="text-3xl font-light text-gray-800 mb-6 group-hover:text-amber-600 transition-colors">
                Expert Care
              </h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Our skilled therapists provide personalized attention and expert
                care tailored to your unique wellness journey
              </p>
            </div>

            <div className="text-center group cursor-pointer">
              <div className="relative mb-10">
                <div className="w-full h-64 bg-gradient-to-br from-emerald-200 via-amber-200 to-emerald-300 rounded-3xl flex items-center justify-center group-hover:scale-105 transition-all duration-700 shadow-xl group-hover:shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl"></div>
                  <Award className="relative h-20 w-20 text-emerald-800 group-hover:rotate-12 transition-transform duration-500" />
                </div>
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-lg border-4 border-emerald-100"></div>
              </div>
              <h3 className="text-3xl font-light text-gray-800 mb-6 group-hover:text-emerald-600 transition-colors">
                Premium Treatments
              </h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Experience luxury treatments using the finest organic products
                and time-honored techniques for lasting results
              </p>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="group">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="text-2xl font-light text-gray-800">100+</div>
              <div className="text-sm text-gray-600 uppercase tracking-wide">
                Happy Clients
              </div>
            </div>
            <div className="group">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="h-8 w-8 text-amber-600" />
              </div>
              <div className="text-2xl font-light text-gray-800">15+</div>
              <div className="text-sm text-gray-600 uppercase tracking-wide">
                Treatments
              </div>
            </div>
            <div className="group">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Award className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="text-2xl font-light text-gray-800">Service</div>
              <div className="text-sm text-gray-600 uppercase tracking-wide">
                Excellence
              </div>
            </div>
            <div className="group">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-8 w-8 text-amber-600" />
              </div>
              <div className="text-2xl font-light text-gray-800">100%</div>
              <div className="text-sm text-gray-600 uppercase tracking-wide">
                Natural
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW: Feedback Section */}
      <section className="py-32 px-6 bg-gradient-to-br from-white via-emerald-50/20 to-amber-50/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <Badge
              variant="outline"
              className="mb-6 text-emerald-700 border-emerald-300 bg-emerald-50 px-6 py-2 text-sm font-medium"
            >
              <Heart className="mr-2 h-4 w-4" />
              Guest Testimonials
            </Badge>
            <h2 className="text-6xl md:text-7xl font-extralight text-gray-800 mb-8 tracking-wide">
              Our Guests <span className="text-emerald-600">Love Us</span>
            </h2>
            <div className="w-24 h-px bg-gradient-to-r from-emerald-400 to-amber-400 mx-auto mb-8"></div>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Discover what our guests have to say about their experiences at
              LEWA Luxury Spa
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Feedback Display */}
            <div className="lg:order-2">
              <FeedbackDisplay />
            </div>

            {/* Feedback Benefits */}
            <div className="space-y-8 lg:order-1">
              <div className="flex items-start space-x-6 group">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Star className="h-8 w-8 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-gray-800 mb-2 group-hover:text-emerald-600 transition-colors">
                    Authentic Experiences
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Real testimonials from our valued guests who have
                    experienced our premium services firsthand
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-6 group">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="h-8 w-8 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-gray-800 mb-2 group-hover:text-amber-600 transition-colors">
                    Your Voice Matters
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    We value your feedback and continuously improve our services
                    based on guest suggestions
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-6 group">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-amber-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Award className="h-8 w-8 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-gray-800 mb-2 group-hover:text-emerald-600 transition-colors">
                    Recognized Excellence
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Join the hundreds of satisfied guests who have experienced
                    our award-winning services
                  </p>
                </div>
              </div>

              <Button
                size="lg"
                onClick={() => setShowFeedbackModal(true)}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-12 py-4 text-xl shadow-xl hover:shadow-emerald-500/25 transform hover:scale-105 transition-all duration-300"
              >
                <Heart className="mr-3 h-6 w-6" />
                Share Your Feedback
                <Sparkles className="ml-3 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Contact Section */}
      <section
        id="contact"
        className="py-32 px-6 bg-gradient-to-br from-emerald-50 via-white to-stone-50"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <Badge
              variant="outline"
              className="mb-6 text-emerald-700 border-emerald-300 bg-emerald-50 px-6 py-2 text-sm font-medium"
            >
              <MapPin className="mr-2 h-4 w-4" />
              Visit Us Today
            </Badge>
            <h2 className="text-6xl md:text-7xl font-extralight text-gray-800 mb-8 tracking-wide">
              Visit Our Spa <span className="text-emerald-600">Sanctuary</span>
            </h2>
            <div className="w-24 h-px bg-gradient-to-r from-emerald-400 to-amber-400 mx-auto mb-8"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Located in the heart of Harare's prestigious Highlands district
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 mb-20">
            {/* Enhanced Contact Cards */}
            <Card className="group text-center border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-emerald-50/30 overflow-hidden">
              <CardContent className="p-10">
                <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-light text-gray-800 mb-6 group-hover:text-emerald-600 transition-colors">
                  Our Location
                </h3>
                <div className="space-y-2 text-gray-600 leading-relaxed text-lg">
                  <p>29 Montgomery Road</p>
                  <p>Highlands, Harare</p>
                  <p>Zimbabwe</p>
                </div>
              </CardContent>
            </Card>

            <Card className="group text-center border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-amber-50/30 overflow-hidden">
              <CardContent className="p-10">
                <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <Phone className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-light text-gray-800 mb-6 group-hover:text-amber-600 transition-colors">
                  Contact Us
                </h3>
                <div className="space-y-2 text-gray-600 leading-relaxed text-lg">
                  <p>+263 78 004 5833</p>
                  <p>info@lewa.co.zw</p>
                  <p>www.lewa.co.zw</p>
                </div>
              </CardContent>
            </Card>

            <Card className="group text-center border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-emerald-50/30 overflow-hidden">
              <CardContent className="p-10">
                <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-light text-gray-800 mb-6 group-hover:text-emerald-600 transition-colors">
                  Opening Hours
                </h3>
                <div className="space-y-2 text-gray-600 leading-relaxed text-lg">
                  <p>Sun- Fri: 9am - 8pm</p>
                  <p>Saturday: Closed</p>
                  <p>By Appointment</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced CTA Section */}
          <div className="text-center bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-3xl p-16 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-amber-600/20"></div>
            <div className="relative">
              <h3 className="text-4xl font-light mb-6">
                Ready to Begin Your Wellness Journey?
              </h3>
              <p className="text-xl text-emerald-100 mb-10 max-w-2xl mx-auto">
                Book your appointment today and experience the ultimate in
                luxury spa treatments
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Button
                  size="lg"
                  onClick={handleBookNow}
                  className="bg-white text-emerald-800 hover:bg-emerald-50 px-16 py-6 text-xl shadow-2xl hover:shadow-white/25 transform hover:scale-105 transition-all duration-300 border-2 border-white/20"
                >
                  <Calendar className="mr-3 h-6 w-6" />
                  Book Your Treatment
                  <Sparkles className="ml-3 h-5 w-5" />
                </Button>
                <Link href="/dashboard" className="inline-block">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="text-white hover:bg-white/10 px-12 py-6 text-xl border-2 border-white/30 hover:border-white/50 transition-all duration-300"
                  >
                    Staff Portal
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-emerald-900 to-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-lg"></div>
                <Flower2 className="relative h-12 w-12 text-emerald-400 mr-4" />
              </div>
              <div>
                <span className="text-4xl font-extralight tracking-wide">
                  LEWA
                </span>
                <span className="block text-lg text-emerald-400 font-light -mt-1">
                  HEALTH SPA
                </span>
              </div>
            </div>
            <p className="text-emerald-100 mb-10 max-w-3xl mx-auto text-lg leading-relaxed">
              Escape to tranquility and rejuvenation. Experience the perfect
              harmony of wellness and luxury in Zimbabwe's premier spa
              destination.
            </p>
            <div className="flex justify-center space-x-8 mb-12">
              <a
                href="#"
                className="text-emerald-300 hover:text-emerald-200 transition-colors text-lg"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-emerald-300 hover:text-emerald-200 transition-colors text-lg"
              >
                Terms of Service
              </a>
              <a
                href="#contact"
                className="text-emerald-300 hover:text-emerald-200 transition-colors text-lg"
              >
                Contact
              </a>
            </div>
            <div className="pt-8 border-t border-emerald-800/50">
              <p className="text-emerald-400 text-lg">
                &copy; {new Date().getFullYear()} LEWA HEALTH Spa. All rights
                reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Feedback Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => setShowFeedbackModal(true)}
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-full w-16 h-16 shadow-2xl hover:shadow-emerald-500/25 transform hover:scale-110 transition-all duration-300 group"
          title="Share Your Feedback"
        >
          <Heart className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
        </Button>
      </div>

      {/* Enhanced Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-3xl border border-emerald-100">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-4xl font-light text-gray-800 mb-3">
                Book Your <span className="text-emerald-600">Experience</span>
              </h3>
              <div className="w-16 h-px bg-gradient-to-r from-emerald-400 to-amber-400 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">
                Fill out the form below and we'll confirm your booking shortly
              </p>
            </div>

            <form onSubmit={handleSubmitBooking} className="space-y-8">
              {/* Enhanced form sections with better styling */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 pb-3 border-b border-emerald-100">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h4 className="text-xl font-medium text-gray-800">
                    Contact Information
                  </h4>
                </div>

                {/* Form fields with enhanced styling - existing form fields remain the same but with improved classes */}
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="customer_name">Full Name *</Label>
                      <Input
                        id="customer_name"
                        name="customer_name"
                        value={formData.customer_name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customer_phone">Phone Number *</Label>
                      <Input
                        id="customer_phone"
                        name="customer_phone"
                        value={formData.customer_phone}
                        onChange={handleInputChange}
                        placeholder="+263 xxx xxx xxx"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customer_email">Email Address *</Label>
                    <Input
                      id="customer_email"
                      name="customer_email"
                      type="email"
                      value={formData.customer_email}
                      onChange={handleInputChange}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center space-x-3 pb-3 border-b border-emerald-100">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h4 className="text-xl font-medium text-gray-800">
                    Booking Details
                  </h4>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="booking_type">Experience Type *</Label>
                    <Select
                      value={formData.booking_type}
                      onValueChange={(value) =>
                        handleSelectChange("booking_type", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spa">Spa Treatment</SelectItem>
                        <SelectItem value="restaurant">
                          Restaurant Dining
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.booking_type === "spa" ? (
                    <div className="space-y-2">
                      <Label htmlFor="service">Select Spa Service *</Label>
                      <Select
                        value={formData.service}
                        onValueChange={(value) =>
                          handleSelectChange("service", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose your treatment" />
                        </SelectTrigger>
                        <SelectContent>
                          {spaServices.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name} - ${service.price} (
                              {service.duration} min)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="party_size">Party Size *</Label>
                      <Select
                        value={formData.party_size}
                        onValueChange={(value) =>
                          handleSelectChange("party_size", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Number of guests" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((size) => (
                            <SelectItem key={size} value={size.toString()}>
                              {size} {size === 1 ? "person" : "people"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="booking_date">Preferred Date *</Label>
                      <Input
                        id="booking_date"
                        name="booking_date"
                        type="date"
                        value={formData.booking_date}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="booking_time">Preferred Time *</Label>
                      <Input
                        id="booking_time"
                        name="booking_time"
                        type="time"
                        value={formData.booking_time}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Special Requests (Optional)</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Any special requests, allergies, or preferences..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Enhanced action buttons */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBookingModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-4 text-lg border-2 border-emerald-200 hover:border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-4 text-lg bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-xl hover:shadow-emerald-500/25"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Booking Request
                      <Sparkles className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW: Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <FeedbackForm
              onClose={() => setShowFeedbackModal(false)}
              onSuccess={handleFeedbackSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
}
