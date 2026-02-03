"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import { MapPin, Clock, Briefcase } from "lucide-react";

interface ShopCardProps {
  shop: {
    id: string;
    name: string;
    description?: string | null;
    city?: string | null;
    province?: string | null;
    rating: number;
    reviewCount: number;
    coverImage?: string | null;
    logo?: string | null;
    isFeatured?: boolean;
    openingHours?: string | null;
    closingHours?: string | null;
    user?: {
      id: string;
      username: string;
      firstName?: string | null;
      lastName?: string | null;
      picture?: string | null;
    };
    _count?: {
      services: number;
    };
  };
}

export function ShopCard({ shop }: ShopCardProps) {
  const displayName = shop.user?.firstName
    ? `${shop.user.firstName} ${shop.user.lastName || ""}`
    : shop.user?.username;

  return (
    <Link href={`/shops/${shop.id}`}>
      <Card className="group hover:shadow-lg transition-shadow duration-200 overflow-hidden h-full">
        {/* Cover Image */}
        <div className="relative h-32 bg-gradient-to-br from-primary/20 to-primary/5">
          {shop.coverImage && (
            <Image
              src={shop.coverImage}
              alt={shop.name}
              fill
              className="object-cover"
            />
          )}
          {shop.isFeatured && (
            <Badge variant="warning" className="absolute top-2 right-2">
              Featured
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          {/* Logo and Name */}
          <div className="flex items-start gap-3 -mt-10 mb-3">
            <div className="relative w-16 h-16 rounded-lg border-2 border-white bg-white shadow-md overflow-hidden flex-shrink-0">
              {shop.logo || shop.user?.picture ? (
                <Image
                  src={shop.logo || shop.user?.picture || ""}
                  alt={shop.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                  {shop.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="pt-8">
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
                {shop.name}
              </h3>
              {displayName && (
                <p className="text-sm text-muted-foreground">by {displayName}</p>
              )}
            </div>
          </div>

          {/* Description */}
          {shop.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {shop.description}
            </p>
          )}

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <StarRating value={shop.rating} readonly size="sm" />
            <span className="text-sm text-muted-foreground">
              ({shop.reviewCount} reviews)
            </span>
          </div>

          {/* Info */}
          <div className="space-y-1.5 text-sm text-muted-foreground">
            {(shop.city || shop.province) && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="line-clamp-1">
                  {[shop.city, shop.province].filter(Boolean).join(", ")}
                </span>
              </div>
            )}

            {shop.openingHours && shop.closingHours && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>
                  {shop.openingHours} - {shop.closingHours}
                </span>
              </div>
            )}

            {shop._count?.services !== undefined && (
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                <span>
                  {shop._count.services} service{shop._count.services !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
