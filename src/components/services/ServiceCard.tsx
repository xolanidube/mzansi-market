"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StarRating } from "@/components/ui/StarRating";
import { MapPin, Clock, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ServiceCardProps {
  service: {
    id: string;
    name: string;
    description: string;
    price: number;
    chargeTime: string;
    category: string;
    subcategory?: string | null;
    duration?: number | null;
    image?: string | null;
    isFeatured?: boolean;
    user?: {
      id: string;
      username: string;
      firstName?: string | null;
      lastName?: string | null;
      picture?: string | null;
      shop?: {
        id: string;
        name: string;
        city?: string | null;
        rating: number;
      } | null;
    };
  };
  showProvider?: boolean;
}

const chargeTimeLabels: Record<string, string> = {
  HOURLY: "/hr",
  DAILY: "/day",
  FIXED: " fixed",
  NEGOTIABLE: " (negotiable)",
};

export function ServiceCard({ service, showProvider = true }: ServiceCardProps) {
  const providerName = service.user?.firstName
    ? `${service.user.firstName} ${service.user.lastName || ""}`
    : service.user?.username;

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200 overflow-hidden h-full flex flex-col">
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/5">
        {service.image ? (
          <Image
            src={service.image}
            alt={service.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl text-primary/30">
              {service.category.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {service.isFeatured && (
          <Badge variant="warning" className="absolute top-2 right-2">
            Featured
          </Badge>
        )}

        <Badge variant="secondary" className="absolute bottom-2 left-2">
          {service.category}
        </Badge>
      </div>

      <CardContent className="p-4 flex-1 flex flex-col">
        {/* Title and Price */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
            {service.name}
          </h3>
          <div className="text-right flex-shrink-0">
            <span className="font-bold text-primary">
              {formatCurrency(service.price)}
            </span>
            <span className="text-sm text-muted-foreground">
              {chargeTimeLabels[service.chargeTime] || ""}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
          {service.description}
        </p>

        {/* Duration */}
        {service.duration && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Clock className="w-4 h-4" />
            <span>{service.duration} min</span>
          </div>
        )}

        {/* Provider Info */}
        {showProvider && service.user && (
          <div className="border-t pt-3 mt-auto">
            <Link
              href={`/shops/${service.user.shop?.id}`}
              className="flex items-center gap-3 hover:bg-muted/50 -mx-2 px-2 py-1.5 rounded-md transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex-shrink-0">
                {service.user.picture ? (
                  <Image
                    src={service.user.picture}
                    alt={providerName || ""}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary font-medium">
                    {(providerName || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-1">
                  {service.user.shop?.name || providerName}
                </p>
                {service.user.shop && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <StarRating value={service.user.shop.rating} readonly size="sm" />
                    {service.user.shop.city && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {service.user.shop.city}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </Link>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <Button asChild className="flex-1">
            <Link href={`/services/${service.id}`}>View Details</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/book/${service.id}`}>
              <Calendar className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
