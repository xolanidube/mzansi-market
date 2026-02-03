"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout";
import {
  Card,
  CardContent,
  Button,
  Badge,
  Spinner,
} from "@/components/ui";
import { StarRating } from "@/components/ui/StarRating";
import { MapPin, Clock, ArrowLeft, Calendar } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description?: string;
  price: string;
  chargeTime?: string;
  picture?: string;
  category?: {
    id: string;
    name: string;
  };
}

interface Shop {
  id: string;
  name: string;
  description?: string;
  address?: string;
  contact?: string;
  startTime?: string;
  endTime?: string;
  openingDays?: string[];
  rating: number;
  totalReviews: number;
  profileUrl?: string;
  coverUrl?: string;
  user: {
    id: string;
    username: string;
    picture?: string;
  };
}

export default function BookFromShopPage() {
  const params = useParams();
  const shopId = params.id as string;

  const [shop, setShop] = useState<Shop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShopAndServices = async () => {
      if (!shopId) {
        setError("No shop specified");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch shop details
        const shopResponse = await fetch(`/api/shops/${shopId}`);
        if (!shopResponse.ok) {
          if (shopResponse.status === 404) {
            setError("Shop not found");
          } else {
            setError("Failed to load shop");
          }
          setLoading(false);
          return;
        }
        const shopData = await shopResponse.json();
        setShop(shopData);

        // Fetch services for this shop's owner
        const servicesResponse = await fetch(
          `/api/services?providerId=${shopData.user.id}&limit=50`
        );
        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          setServices(servicesData.services || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("An error occurred while loading the shop");
      } finally {
        setLoading(false);
      }
    };

    fetchShopAndServices();
  }, [shopId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <Card padding="none" className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-error/10 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-error"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {error || "Shop not found"}
              </h2>
              <p className="text-muted-foreground mb-6">
                The shop you&apos;re looking for doesn&apos;t exist or has been
                removed.
              </p>
              <Link href="/shops">
                <Button>Browse Shops</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          href={`/shops/${shop.id}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {shop.name}
        </Link>

        {/* Shop Info Header */}
        <Card padding="none" className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Shop Logo */}
              <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-primary/10">
                {shop.profileUrl ? (
                  <Image
                    src={shop.profileUrl}
                    alt={shop.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-3xl font-bold text-primary">
                      {shop.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Shop Details */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Book at {shop.name}
                </h1>
                <div className="flex items-center gap-4 mb-3">
                  <StarRating value={shop.rating} readonly size="sm" />
                  <span className="text-sm text-muted-foreground">
                    ({shop.totalReviews} reviews)
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {shop.address && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{shop.address}</span>
                    </div>
                  )}
                  {shop.startTime && shop.endTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {shop.startTime} - {shop.endTime}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services List */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Select a Service to Book
          </h2>
          <p className="text-muted-foreground">
            Choose from {services.length} available service
            {services.length !== 1 ? "s" : ""}
          </p>
        </div>

        {services.length === 0 ? (
          <Card padding="none">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                This shop hasn&apos;t added any services yet.
              </p>
              <Link href="/services" className="mt-4 inline-block">
                <Button variant="outline">Browse All Services</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card
                key={service.id}
                padding="none"
                className="hover:shadow-lg transition-shadow"
              >
                {/* Service Image */}
                {service.picture && (
                  <div className="relative h-40 bg-muted">
                    <Image
                      src={service.picture}
                      alt={service.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-foreground">
                      {service.name}
                    </h3>
                    {service.category && (
                      <Badge variant="secondary" className="text-xs">
                        {service.category.name}
                      </Badge>
                    )}
                  </div>

                  {service.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {service.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-lg font-bold text-primary">
                        R{parseFloat(service.price).toFixed(2)}
                      </span>
                      {service.chargeTime && (
                        <span className="text-sm text-muted-foreground ml-1">
                          / {service.chargeTime}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link href={`/book/${service.id}`}>
                    <Button className="w-full">
                      <Calendar className="w-4 h-4 mr-2" />
                      Book Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
