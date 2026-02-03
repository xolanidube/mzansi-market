"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { BookingForm } from "@/components/bookings/BookingForm";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Star } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description?: string | null;
  price: number | null;
  chargeTime?: string | null;
  category?: string | null;
  rating?: number | null;
  totalReviews?: number;
  user: {
    id: string;
    username: string;
    picture?: string | null;
    shop?: {
      id: string;
      name: string;
      address?: string | null;
      rating?: number | null;
    } | null;
  };
}

export default function BookServicePage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await fetch(`/api/services/${serviceId}`);
        const data = await response.json();

        if (response.ok) {
          setService(data.service);
        } else {
          setError(data.error || "Service not found");
        }
      } catch (err) {
        setError("Failed to load service");
      } finally {
        setIsLoading(false);
      }
    };

    fetchService();
  }, [serviceId]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/book/${serviceId}`);
    }
  }, [status, serviceId, router]);

  if (isLoading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Alert variant="error">{error}</Alert>
          <Button asChild className="mt-4">
            <Link href="/services">Browse Services</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Alert variant="error">Service not found</Alert>
          <Button asChild className="mt-4">
            <Link href="/services">Browse Services</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Check if user is trying to book their own service
  if (session?.user?.id === service.user.id) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Alert variant="warning">You cannot book your own service</Alert>
          <Button asChild className="mt-4">
            <Link href="/services">Browse Other Services</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Back Link */}
        <Link
          href={`/services/${serviceId}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Service
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Book a Service</h1>
          <p className="text-muted-foreground">
            Select a date and time for your appointment
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Select Date & Time</CardTitle>
              </CardHeader>
              <CardContent>
                <BookingForm
                  service={{
                    id: service.id,
                    name: service.name,
                    description: service.description || undefined,
                    price: service.price,
                    chargeTime: service.chargeTime,
                  }}
                  provider={{
                    id: service.user.id,
                    username: service.user.username,
                    shop: service.user.shop,
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Service Summary Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Service Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium">{service.name}</h3>
                  {service.category && (
                    <p className="text-sm text-muted-foreground">
                      {service.category}
                    </p>
                  )}
                </div>

                {service.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {service.description}
                  </p>
                )}

                {service.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">{service.rating.toFixed(1)}</span>
                    {service.totalReviews !== undefined && (
                      <span className="text-muted-foreground text-sm">
                        ({service.totalReviews} reviews)
                      </span>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Price</span>
                    <span className="text-xl font-bold text-primary">
                      {service.price
                        ? formatCurrency(service.price)
                        : "Contact for pricing"}
                      {service.chargeTime && service.price && (
                        <span className="text-sm font-normal text-muted-foreground">
                          {" "}
                          / {service.chargeTime}
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {service.user.shop && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Provider</p>
                    <Link
                      href={`/shops/${service.user.shop.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {service.user.shop.name}
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
