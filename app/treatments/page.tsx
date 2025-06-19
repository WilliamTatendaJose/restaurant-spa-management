"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Clock,
  ArrowLeft,
  Sparkles,
  Heart,
  Award,
  Flower2,
  DollarSign,
  Search,
  Filter,
  X,
} from "lucide-react";
import Link from "next/link";
import { spaServicesApi } from "@/lib/db";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { HeroBookingModal } from "@/components/bookings/hero-booking-modal";

interface SpaService {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  benefits: string;
}

export default function TreatmentsPage() {
  const [services, setServices] = useState<SpaService[]>([]);
  const [filteredServices, setFilteredServices] = useState<SpaService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState<SpaService | null>(
    null
  );
  const { toast } = useToast();

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState("all");
  const [durationRange, setDurationRange] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function loadServices() {
      try {
        const data = await spaServicesApi.list();
        // Deduplicate services by ID
        const uniqueServices = data.filter(
          (service: SpaService, index: number, self: SpaService[]) =>
            self.findIndex((s) => s.id === service.id) === index
        );
        setServices(uniqueServices as SpaService[]);
      } catch (error) {
        console.error("Error loading services:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadServices();
  }, []);

  // Apply filters whenever filter states change
  useEffect(() => {
    let filtered = [...services];

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (service) =>
          (service.category || "general").toLowerCase() ===
          selectedCategory.toLowerCase()
      );
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (service) =>
          service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (service.description || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (service.benefits || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Price range filter
    if (priceRange !== "all") {
      filtered = filtered.filter((service) => {
        const price = service.price;
        switch (priceRange) {
          case "under-50":
            return price < 50;
          case "50-100":
            return price >= 50 && price <= 100;
          case "100-200":
            return price > 100 && price <= 200;
          case "over-200":
            return price > 200;
          default:
            return true;
        }
      });
    }

    // Duration range filter
    if (durationRange !== "all") {
      filtered = filtered.filter((service) => {
        const duration = service.duration;
        switch (durationRange) {
          case "under-30":
            return duration < 30;
          case "30-60":
            return duration >= 30 && duration <= 60;
          case "60-90":
            return duration > 60 && duration <= 90;
          case "over-90":
            return duration > 90;
          default:
            return true;
        }
      });
    }

    setFilteredServices(filtered);
  }, [services, selectedCategory, searchTerm, priceRange, durationRange]);

  const categories = [
    "all",
    ...new Set(services.map((service) => service.category || "general")),
  ];

  const handleBookNow = (service: SpaService | null = null) => {
    if (service) {
      setSelectedService(service);
    } else {
      setSelectedService(null);
    }
    setShowBookingModal(true);
  };

  const handleBookingSuccess = () => {
    toast({
      title: "Booking Submitted!",
      description:
        "Your booking request has been received. We'll contact you shortly to confirm.",
    });
    setShowBookingModal(false);
    setSelectedService(null);
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setSearchTerm("");
    setPriceRange("all");
    setDurationRange("all");
  };

  const activeFiltersCount = [
    selectedCategory !== "all",
    searchTerm !== "",
    priceRange !== "all",
    durationRange !== "all",
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-amber-50">
      {/* Navigation Header */}
      <nav className="bg-white/95 backdrop-blur-xl border-b border-emerald-100 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center space-x-2 text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Back to Home</span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-lg"></div>
                <Flower2 className="relative h-8 w-8 text-emerald-700" />
              </div>
              <div>
                <span className="text-xl font-light text-gray-800 tracking-wide">
                  LEWA
                </span>
                <span className="block text-xs text-emerald-700 font-medium -mt-1">
                  LUXURY SPA
                </span>
              </div>
            </div>

            <Button
              onClick={() => handleBookNow()}
              className="bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white shadow-xl"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Book Now
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-emerald-200 via-white to-amber-100">
        <div className="max-w-7xl mx-auto text-center">
          <Badge
            variant="outline"
            className="mb-6 text-emerald-800 border-emerald-400 bg-emerald-100 px-6 py-2 text-sm font-medium"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Our Complete Treatment Menu
          </Badge>
          <h1 className="text-6xl md:text-7xl font-extralight text-gray-900 mb-8 tracking-wide">
            Spa <span className="text-emerald-700">Treatments</span>
          </h1>
          <div className="w-24 h-px bg-gradient-to-r from-emerald-500 to-amber-500 mx-auto mb-8"></div>
          <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
            Discover our comprehensive collection of wellness treatments
            designed to nurture your body, mind, and spirit in our luxury spa
            sanctuary
          </p>
        </div>
      </section>

      {/* Enhanced Filters Section */}
      <section className="py-8 px-6 bg-white/90 backdrop-blur-sm border-b border-emerald-100">
        <div className="max-w-7xl mx-auto">
          {/* Search and Filter Toggle */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                placeholder="Search treatments, benefits, or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-3 text-lg border-emerald-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 bg-white text-gray-800"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-3 text-lg border-emerald-300 hover:bg-emerald-50 text-emerald-800 ${showFilters ? "bg-emerald-50 border-emerald-400" : ""}`}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="bg-emerald-50/80 rounded-xl p-6 border border-emerald-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-800">
                    Category
                  </label>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="border-emerald-300 focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white text-gray-800">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories
                        .filter((cat) => cat !== "all")
                        .map((category) => (
                          <SelectItem
                            key={category}
                            value={category}
                            className="capitalize"
                          >
                            {category}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-800">
                    Price Range
                  </label>
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger className="border-emerald-300 focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white text-gray-800">
                      <SelectValue placeholder="All Prices" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Prices</SelectItem>
                      <SelectItem value="under-50">Under $50</SelectItem>
                      <SelectItem value="50-100">$50 - $100</SelectItem>
                      <SelectItem value="100-200">$100 - $200</SelectItem>
                      <SelectItem value="over-200">Over $200</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Duration Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-800">
                    Duration
                  </label>
                  <Select
                    value={durationRange}
                    onValueChange={setDurationRange}
                  >
                    <SelectTrigger className="border-emerald-300 focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white text-gray-800">
                      <SelectValue placeholder="All Durations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Durations</SelectItem>
                      <SelectItem value="under-30">Under 30 min</SelectItem>
                      <SelectItem value="30-60">30 - 60 min</SelectItem>
                      <SelectItem value="60-90">60 - 90 min</SelectItem>
                      <SelectItem value="over-90">Over 90 min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-800 opacity-0">
                    Clear
                  </label>
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    disabled={activeFiltersCount === 0}
                    className="w-full border-emerald-400 hover:bg-emerald-100 text-emerald-800 disabled:opacity-50"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear All
                  </Button>
                </div>
              </div>

              {/* Results Summary */}
              <div className="text-sm text-gray-700">
                Showing {filteredServices.length} of {services.length}{" "}
                treatments
                {activeFiltersCount > 0 &&
                  ` with ${activeFiltersCount} filter${activeFiltersCount > 1 ? "s" : ""} applied`}
              </div>
            </div>
          )}

          {/* Quick Category Pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={`capitalize px-4 py-2 ${
                  selectedCategory === category
                    ? "bg-gradient-to-r from-emerald-700 to-emerald-800 text-white"
                    : "border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                }`}
              >
                {category === "all" ? "All Treatments" : category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Loading State */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden border-0 shadow-xl">
                  <div className="h-48 bg-gradient-to-br from-emerald-200 to-amber-200 animate-pulse"></div>
                  <CardContent className="p-8">
                    <div className="h-6 bg-gray-300 rounded mb-4 animate-pulse"></div>
                    <div className="h-4 bg-gray-300 rounded mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-300 rounded mb-4 animate-pulse"></div>
                    <div className="h-10 bg-gray-300 rounded animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredServices.map((service, index) => (
                <Card
                  key={service.id}
                  className="group overflow-hidden border-0 shadow-xl hover:shadow-3xl transition-all duration-700 bg-gradient-to-br from-white via-emerald-50/30 to-amber-50/30"
                >
                  {/* Service Image */}
                  <div className="relative h-48 overflow-hidden">
                    <div
                      className={`w-full h-full bg-gradient-to-br ${
                        index % 3 === 0
                          ? "from-emerald-300 to-emerald-500"
                          : index % 3 === 1
                            ? "from-amber-300 to-amber-500"
                            : "from-emerald-300 via-amber-300 to-emerald-400"
                      } group-hover:scale-110 transition-transform duration-1000`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                      <div className="absolute bottom-4 left-4 flex items-center">
                        {service.category === "massage" && (
                          <Heart className="h-6 w-6 text-white mr-2" />
                        )}
                        {service.category === "facial" && (
                          <Award className="h-6 w-6 text-white mr-2" />
                        )}
                        {(!service.category ||
                          (service.category !== "massage" &&
                            service.category !== "facial")) && (
                          <Sparkles className="h-6 w-6 text-white mr-2" />
                        )}
                        <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm font-medium">
                          {service.category || "Wellness"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-8">
                    <h3 className="text-2xl font-medium text-gray-800 mb-4 group-hover:text-emerald-700 transition-colors">
                      {service.name}
                    </h3>

                    <p className="text-gray-700 mb-6 leading-relaxed">
                      {service.description ||
                        "A rejuvenating treatment designed to enhance your wellness journey."}
                    </p>

                    {service.benefits && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-800 mb-2 uppercase tracking-wide">
                          Benefits:
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {service.benefits}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-6 pt-4 border-t border-emerald-200">
                      <div className="flex items-center text-emerald-700">
                        <Clock className="h-4 w-4 mr-2" />
                        <span className="font-medium">
                          {service.duration} min
                        </span>
                      </div>
                      <div className="flex items-center text-amber-700">
                        <DollarSign className="h-4 w-4 mr-1" />
                        <span className="text-xl font-medium">
                          ${service.price}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleBookNow(service)}
                      className="w-full bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 py-3 text-lg group/btn shadow-xl hover:shadow-emerald-600/25 transition-all duration-300 text-white"
                    >
                      Book This Treatment
                      <Calendar className="ml-2 h-4 w-4 group-hover/btn:rotate-12 transition-transform duration-300" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredServices.length === 0 && (
            <div className="text-center py-20">
              <Flower2 className="h-24 w-24 text-emerald-400 mx-auto mb-6" />
              <h3 className="text-2xl font-medium text-gray-700 mb-4">
                No treatments found
              </h3>
              <p className="text-gray-600 mb-8">
                {services.length === 0
                  ? "We're currently updating our treatment menu. Please check back soon."
                  : activeFiltersCount > 0
                    ? "Try adjusting your filters to see more results."
                    : `No treatments found in the ${selectedCategory} category.`}
              </p>
              {activeFiltersCount > 0 ? (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                >
                  Clear All Filters
                </Button>
              ) : (
                <Button
                  onClick={() => setSelectedCategory("all")}
                  variant="outline"
                  className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                >
                  View All Treatments
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-6 bg-gradient-to-br from-emerald-800 to-emerald-900">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-light mb-6">
            Ready to Experience Ultimate Relaxation?
          </h2>
          <p className="text-xl text-emerald-50 mb-10 leading-relaxed">
            Book your perfect treatment today and let our expert therapists
            guide you on a journey to wellness and rejuvenation
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button
              size="lg"
              onClick={() => handleBookNow()}
              className="bg-white text-emerald-900 hover:bg-emerald-50 px-12 py-4 text-xl shadow-2xl hover:shadow-white/25 transform hover:scale-105 transition-all duration-300"
            >
              <Calendar className="mr-3 h-6 w-6" />
              Book Your Treatment Now
              <Sparkles className="ml-3 h-5 w-5" />
            </Button>
            <Link href="/">
              <Button
                size="lg"
                variant="ghost"
                className="text-white hover:bg-white/10 px-8 py-4 text-xl border-2 border-white/40 hover:border-white/60 transition-all duration-300"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      {showBookingModal && (
        <HeroBookingModal
          showModal={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          onSuccess={handleBookingSuccess}
          preselectedService={selectedService}
        />
      )}
    </div>
  );
}
