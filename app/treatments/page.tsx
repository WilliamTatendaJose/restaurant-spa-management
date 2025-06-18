"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  ArrowLeft,
  Sparkles,
  Heart,
  Award,
  Flower2,
  Star,
  DollarSign,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { spaServicesApi } from "@/lib/db";

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
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    async function loadServices() {
      try {
        const data = await spaServicesApi.list();
        setServices(data as SpaService[]);
      } catch (error) {
        console.error("Error loading services:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadServices();
  }, []);

  const categories = ["all", ...new Set(services.map(service => service.category || "general"))];
  const filteredServices = selectedCategory === "all" 
    ? services 
    : services.filter(service => (service.category || "general") === selectedCategory);

  const handleBookNow = () => {
    window.location.href = "/#booking";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-stone-50 to-amber-50">
      {/* Navigation Header */}
      <nav className="bg-white/90 backdrop-blur-xl border-b border-emerald-100/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 transition-colors">
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Back to Home</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-lg"></div>
                <Flower2 className="relative h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <span className="text-xl font-light text-gray-800 tracking-wide">LEWA</span>
                <span className="block text-xs text-emerald-600 font-medium -mt-1">LUXURY SPA</span>
              </div>
            </div>

            <Button onClick={handleBookNow} className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-xl">
              <Calendar className="mr-2 h-4 w-4" />
              Book Now
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-emerald-100 via-white to-amber-100">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 text-emerald-700 border-emerald-300 bg-emerald-50 px-6 py-2 text-sm font-medium">
            <Sparkles className="mr-2 h-4 w-4" />
            Our Complete Treatment Menu
          </Badge>
          <h1 className="text-6xl md:text-7xl font-extralight text-gray-800 mb-8 tracking-wide">
            Spa <span className="text-emerald-600">Treatments</span>
          </h1>
          <div className="w-24 h-px bg-gradient-to-r from-emerald-400 to-amber-400 mx-auto mb-8"></div>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Discover our comprehensive collection of wellness treatments designed to nurture your body, 
            mind, and spirit in our luxury spa sanctuary
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className={`capitalize px-6 py-2 ${
                  selectedCategory === category
                    ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white"
                    : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                {category === "all" ? "All Treatments" : category}
              </Button>
            ))}
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden border-0 shadow-xl">
                  <div className="h-48 bg-gradient-to-br from-emerald-100 to-amber-100 animate-pulse"></div>
                  <CardContent className="p-8">
                    <div className="h-6 bg-gray-200 rounded mb-4 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredServices.map((service, index) => (
                <Card key={service.id} className="group overflow-hidden border-0 shadow-xl hover:shadow-3xl transition-all duration-700 bg-gradient-to-br from-white via-emerald-50/30 to-amber-50/30">
                  {/* Service Image */}
                  <div className="relative h-48 overflow-hidden">
                    <div className={`w-full h-full bg-gradient-to-br ${
                      index % 3 === 0 ? "from-emerald-200 to-emerald-400" :
                      index % 3 === 1 ? "from-amber-200 to-amber-400" :
                      "from-emerald-200 via-amber-200 to-emerald-300"
                    } group-hover:scale-110 transition-transform duration-1000`}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      <div className="absolute bottom-4 left-4 flex items-center">
                        {service.category === "massage" && <Heart className="h-6 w-6 text-white mr-2" />}
                        {service.category === "facial" && <Award className="h-6 w-6 text-white mr-2" />}
                        {!service.category && <Sparkles className="h-6 w-6 text-white mr-2" />}
                        <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                          {service.category || "Wellness"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-8">
                    <h3 className="text-2xl font-light text-gray-800 mb-4 group-hover:text-emerald-600 transition-colors">
                      {service.name}
                    </h3>
                    
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {service.description || "A rejuvenating treatment designed to enhance your wellness journey."}
                    </p>

                    {service.benefits && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-800 mb-2 uppercase tracking-wide">Benefits:</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{service.benefits}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-6 pt-4 border-t border-emerald-100">
                      <div className="flex items-center text-emerald-600">
                        <Clock className="h-4 w-4 mr-2" />
                        <span className="font-medium">{service.duration} min</span>
                      </div>
                      <div className="flex items-center text-amber-600">
                        <DollarSign className="h-4 w-4 mr-1" />
                        <span className="text-xl font-light">${service.price}</span>
                      </div>
                    </div>

                    <Button 
                      onClick={handleBookNow}
                      className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 py-3 text-lg group/btn shadow-xl hover:shadow-emerald-500/25 transition-all duration-300"
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
              <Flower2 className="h-24 w-24 text-emerald-300 mx-auto mb-6" />
              <h3 className="text-2xl font-light text-gray-600 mb-4">No treatments found</h3>
              <p className="text-gray-500 mb-8">
                {selectedCategory === "all" 
                  ? "We're currently updating our treatment menu. Please check back soon."
                  : `No treatments found in the ${selectedCategory} category.`
                }
              </p>
              <Button 
                onClick={() => setSelectedCategory("all")}
                variant="outline"
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                View All Treatments
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-6 bg-gradient-to-br from-emerald-900 to-emerald-800">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-light mb-6">Ready to Experience Ultimate Relaxation?</h2>
          <p className="text-xl text-emerald-100 mb-10 leading-relaxed">
            Book your perfect treatment today and let our expert therapists guide you on a journey to wellness and rejuvenation
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button
              size="lg"
              onClick={handleBookNow}
              className="bg-white text-emerald-800 hover:bg-emerald-50 px-12 py-4 text-xl shadow-2xl hover:shadow-white/25 transform hover:scale-105 transition-all duration-300"
            >
              <Calendar className="mr-3 h-6 w-6" />
              Book Your Treatment Now
              <Sparkles className="ml-3 h-5 w-5" />
            </Button>
            <Link href="/">
              <Button
                size="lg"
                variant="ghost"
                className="text-white hover:bg-white/10 px-8 py-4 text-xl border-2 border-white/30 hover:border-white/50 transition-all duration-300"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}