"use client";

import { useState, useEffect } from "react";
import { spaServicesApi } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Tag, DollarSign, Search, Calendar, Sparkles, Flower2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { HeroBookingModal } from "@/components/bookings/hero-booking-modal";
import { useToast } from "@/components/ui/use-toast";

interface SpaService {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  category?: string;
  status?: string;
  isActive?: boolean;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

const placeholderImage = "/placeholder.svg";

export default function TreatmentsPage() {
  const [services, setServices] = useState<SpaService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState<SpaService | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function loadServices() {
      try {
        setIsLoading(true);
        const activeServices = await spaServicesApi.listActive() as SpaService[];

        // Deduplicate services
        const deduplicated = activeServices.reduce((acc: SpaService[], current) => {
          const existing = acc.find(item => item.name === current.name && item.category === current.category);
          if (!existing) {
            acc.push(current);
          } else {
            const existingDate = new Date(existing.updated_at || existing.created_at || 0).getTime();
            const currentDate = new Date(current.updated_at || current.created_at || 0).getTime();
            if (currentDate > existingDate) {
              const index = acc.findIndex(item => item.id === existing.id);
              acc[index] = current;
            }
          }
          return acc;
        }, []);

        setServices(deduplicated);
      } catch (error) {
        console.error("Failed to load active spa services:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadServices();
  }, []);

  const handleBookNow = (service: SpaService) => {
    setSelectedService(service);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingModal(false);
    toast({
      title: "Booking Submitted! 🎉",
      description: "Your request has been sent. We will contact you shortly to confirm.",
    });
  };

  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (!selectedCategory || service.category === selectedCategory)
  );

  const categories = Array.from(
    new Set(services.map((s) => s.category).filter(Boolean))
  );

  return (
    <>
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
            Our Luxurious Spa Treatments
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
            Indulge in our curated selection of treatments designed to rejuvenate
            your body and soul.
          </p>
        </div>

        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search treatments..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={!selectedCategory ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden shadow-lg animate-pulse">
                <div className="w-full h-48 bg-gray-200"></div>
                <CardContent className="p-6">
                  <div className="h-6 w-3/4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-1/2 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 w-full bg-gray-200 rounded"></div>
                  <div className="h-4 w-full bg-gray-200 rounded mt-2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.length > 0 ? (
              filteredServices.map((service) => (
                <Card
                  key={service.id}
                  className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col group"
                >
                  <div className="relative w-full h-48">
                    <Image
                      src={service.image_url || placeholderImage}
                      alt={service.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="p-6 flex-grow flex flex-col">
                    <h2 className="text-2xl font-semibold mb-2 text-gray-800">
                      {service.name}
                    </h2>
                    <p className="text-gray-600 mb-4 text-sm flex-grow">
                      {service.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-700 mt-auto pt-4 border-t">
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-emerald-600" />
                        <span>{service.duration} min</span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="mr-2 h-4 w-4 text-emerald-600" />
                        <span>{Number(service.price).toFixed(2)}</span>
                      </div>
                      {service.category && (
                        <div className="flex items-center">
                          <Tag className="mr-2 h-4 w-4 text-emerald-600" />
                          <Badge
                            variant="secondary"
                            className="capitalize"
                          >
                            {service.category}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => handleBookNow(service)}
                      className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white"
                    >
                      <Calendar className="mr-2 h-4 w-4" /> Book Now
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500 py-16">
                <Flower2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                No treatments match your search criteria.
              </p>
            )}
          </div>
        )}
      </div>
      <HeroBookingModal
        showModal={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onSuccess={handleBookingSuccess}
        preselectedService={selectedService}
      />
    </>
  );
}
