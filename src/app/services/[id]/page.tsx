import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import { Avatar } from "@/components/ui/Avatar";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  Clock,
  MapPin,
  Phone,
  Calendar,
  ArrowLeft,
  MessageSquare,
  Share2,
  Heart,
} from "lucide-react";
import { ServiceImage } from "@/components/services";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const service = await prisma.service.findUnique({
    where: { id },
    select: { name: true, description: true },
  });

  if (!service) {
    return { title: "Service Not Found | Mzansi Market" };
  }

  return {
    title: `${service.name} | Mzansi Market`,
    description: service.description || undefined,
  };
}

const chargeTimeLabels: Record<number, string> = {
  0: "fixed price",
  1: "per hour",
  2: "per day",
};

export default async function ServiceDetailPage({ params }: Props) {
  const { id } = await params;

  const service = await prisma.service.findUnique({
    where: { id, isActive: true },
    include: {
      provider: {
        select: {
          id: true,
          username: true,
          picture: true,
          phone: true,
          createdAt: true,
          shop: {
            select: {
              id: true,
              name: true,
              description: true,
              address: true,
              rating: true,
              totalReviews: true,
              startTime: true,
              endTime: true,
              openingDays: true,
              isApproved: true,
            },
          },
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!service || !service.provider?.shop?.isApproved) {
    notFound();
  }

  // Get related services
  const relatedServices = await prisma.service.findMany({
    where: {
      providerId: service.providerId,
      id: { not: service.id },
      isActive: true,
    },
    include: {
      provider: {
        select: {
          id: true,
          username: true,
          picture: true,
          shop: {
            select: {
              id: true,
              name: true,
              rating: true,
              address: true,
            },
          },
        },
      },
      category: true,
    },
    take: 4,
  });

  // Get reviews for the provider
  const reviews = await prisma.review.findMany({
    where: { receiverId: service.providerId },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          picture: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const providerName = service.provider.username;
  const price = Number(service.price);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link
        href="/services"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Services
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Image */}
          <ServiceImage src={service.picture} alt={service.name} />

          {/* Service Info */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge variant="secondary" className="mb-2">
                  {service.category?.name || "Other"}
                </Badge>
                <h1 className="text-3xl font-bold">{service.name}</h1>
              </div>
              <div className="flex gap-2">
                <Tooltip content="Save to favorites">
                  <Button variant="ghost" size="sm">
                    <Heart className="w-5 h-5" />
                  </Button>
                </Tooltip>
                <Tooltip content="Share this service">
                  <Button variant="ghost" size="sm">
                    <Share2 className="w-5 h-5" />
                  </Button>
                </Tooltip>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <span className="text-3xl font-bold text-primary">
                {formatCurrency(price)}
              </span>
              <span className="text-muted-foreground">
                {chargeTimeLabels[service.chargeTime] || ""}
              </span>
            </div>
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>About This Service</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{service.description}</p>
            </CardContent>
          </Card>

          {/* Reviews */}
          {reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="flex gap-4 pb-4 border-b last:border-0">
                      <Avatar
                        src={review.sender.picture}
                        alt={review.sender.username}
                        name={review.sender.username}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{review.sender.username}</span>
                          <StarRating value={review.rating} readonly size="sm" />
                        </div>
                        {review.text && (
                          <p className="text-muted-foreground">{review.text}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Book Now Card */}
          <Card className="sticky top-4">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <span className="text-3xl font-bold text-primary">
                  {formatCurrency(price)}
                </span>
                <span className="text-muted-foreground ml-1">
                  {chargeTimeLabels[service.chargeTime] || ""}
                </span>
              </div>

              <Button asChild className="w-full mb-3" size="lg">
                <Link href={`/book/${service.id}`}>
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Now
                </Link>
              </Button>

              <Button variant="outline" className="w-full">
                <MessageSquare className="w-5 h-5 mr-2" />
                Contact Provider
              </Button>
            </CardContent>
          </Card>

          {/* Provider Card */}
          <Card>
            <CardHeader>
              <CardTitle>Service Provider</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/shops/${service.provider.shop?.id}`} className="block">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar
                    src={service.provider.picture}
                    alt={providerName}
                    name={providerName}
                    size="lg"
                  />
                  <div>
                    <h3 className="font-semibold">{service.provider.shop?.name}</h3>
                    <p className="text-sm text-muted-foreground">by {providerName}</p>
                  </div>
                </div>
              </Link>

              <div className="flex items-center gap-2 mb-4">
                <StarRating value={service.provider.shop?.rating || 0} readonly showValue />
                <span className="text-sm text-muted-foreground">
                  ({service.provider.shop?.totalReviews || 0} reviews)
                </span>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                {service.provider.shop?.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{service.provider.shop.address}</span>
                  </div>
                )}

                {service.provider.shop?.startTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      {service.provider.shop.startTime} - {service.provider.shop.endTime}
                    </span>
                  </div>
                )}

                {service.provider.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{service.provider.phone}</span>
                  </div>
                )}
              </div>

              <Button asChild variant="outline" className="w-full mt-4">
                <Link href={`/shops/${service.provider.shop?.id}`}>View Shop</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Related Services */}
      {relatedServices.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">More from this Provider</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedServices.map((related) => (
              <Card key={related.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{related.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {related.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">
                      {formatCurrency(Number(related.price))}
                    </span>
                    <Button asChild size="sm">
                      <Link href={`/services/${related.id}`}>View</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
