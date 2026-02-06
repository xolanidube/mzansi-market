"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Carousel, CarouselSlide } from "@/components/ui/Carousel";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Star, Store, MapPin } from "lucide-react";

interface Shop {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  rating: number;
  reviewCount: number;
  coverImage?: string | null;
  logo?: string | null;
  _count: {
    services: number;
  };
}

export function FeaturedShops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await fetch("/api/shops?limit=8");
        const data = await response.json();
        if (response.ok && data.shops) {
          setShops(data.shops);
        }
      } catch (err) {
        console.error("Failed to fetch shops:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShops();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (shops.length === 0) {
    return null;
  }

  return (
    <Carousel
      autoPlay
      autoPlayInterval={5000}
      showDots
      showArrows
      loop
      gap={24}
    >
      {shops.map((shop) => (
        <CarouselSlide key={shop.id}>
          <Link href={`/shops/${shop.id}`}>
            <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden">
              {/* Cover Image */}
              <div className="relative h-40 bg-gradient-to-br from-primary/20 to-primary/5">
                {shop.coverImage ? (
                  <Image
                    src={shop.coverImage}
                    alt={shop.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Store className="w-12 h-12 text-primary/30" />
                  </div>
                )}
                {/* Logo Overlay */}
                <div className="absolute -bottom-8 left-4">
                  <div className="w-16 h-16 rounded-lg border-4 border-background bg-white shadow-md overflow-hidden">
                    {shop.logo ? (
                      <Image
                        src={shop.logo}
                        alt={shop.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        <Store className="w-6 h-6 text-primary" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <CardContent className="pt-10 pb-4 px-4">
                <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                  {shop.name}
                </h3>

                {shop.address && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <MapPin className="w-3 h-3" />
                    <span className="line-clamp-1">{shop.address}</span>
                  </div>
                )}

                {shop.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {shop.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">{shop.rating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">
                      ({shop.reviewCount})
                    </span>
                  </div>
                  <Badge variant="secondary">
                    {shop._count.services} services
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        </CarouselSlide>
      ))}
    </Carousel>
  );
}
