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
import { Tabs, TabsList, Tab, TabsPanel } from "@/components/ui/Tabs";
import {
  MapPin,
  Clock,
  Phone,
  ArrowLeft,
  MessageSquare,
  Share2,
  Store,
  Calendar,
} from "lucide-react";
import { ShopMap, ShopCoverImage } from "@/components/shops";
import { Tooltip } from "@/components/ui/Tooltip";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const shop = await prisma.shop.findUnique({
    where: { id },
    select: { name: true, description: true },
  });

  if (!shop) {
    return { title: "Shop Not Found | Mzansi Market" };
  }

  return {
    title: `${shop.name} | Mzansi Market`,
    description: shop.description || `Visit ${shop.name} on Mzansi Market`,
  };
}

export default async function ShopDetailPage({ params }: Props) {
  const { id } = await params;

  const shop = await prisma.shop.findUnique({
    where: { id, isApproved: true },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          picture: true,
          phone: true,
          createdAt: true,
        },
      },
    },
  });

  if (!shop) {
    notFound();
  }

  // Get services
  const services = await prisma.service.findMany({
    where: { providerId: shop.userId, isActive: true },
    include: {
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Get reviews for the shop owner
  const reviews = await prisma.review.findMany({
    where: { receiverId: shop.userId },
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
    take: 10,
  });

  const ownerName = shop.user.username;

  const memberSince = new Date(shop.user.createdAt).toLocaleDateString("en-ZA", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link
        href="/shops"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Shops
      </Link>

      {/* Shop Header */}
      <div className="relative mb-8">
        {/* Cover Image */}
        <div className="relative h-64 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
          <ShopCoverImage src={shop.coverUrl} alt={shop.name} />
        </div>

        {/* Shop Info Overlay */}
        <div className="relative -mt-16 mx-4 md:mx-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Logo */}
                <div className="relative -mt-16 md:-mt-12">
                  <div className="w-32 h-32 rounded-xl border-4 border-background bg-white shadow-lg overflow-hidden">
                    {shop.profileUrl ? (
                      <Image
                        src={shop.profileUrl}
                        alt={shop.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        <Store className="w-12 h-12 text-primary" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-bold">{shop.name}</h1>
                      <p className="text-muted-foreground">by {ownerName}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Contact
                      </Button>
                      <Tooltip content="Share this shop">
                        <Button variant="outline">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-4">
                    <StarRating value={shop.rating} readonly showValue />
                    <span className="text-muted-foreground">
                      ({shop.totalReviews} reviews)
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">
                      Member since {memberSince}
                    </span>
                  </div>

                  {shop.description && (
                    <p className="mt-4 text-muted-foreground">{shop.description}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultTab="services">
            <TabsList>
              <Tab value="services">
                Services ({services.length})
              </Tab>
              <Tab value="reviews">
                Reviews ({reviews.length})
              </Tab>
            </TabsList>

            <TabsPanel value="services" className="mt-6">
              {services.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      No services available yet
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {services.map((service) => (
                    <Card key={service.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <Badge variant="secondary" className="mb-2">
                          {service.category?.name || "Other"}
                        </Badge>
                        <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {service.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary text-lg">
                            {formatCurrency(Number(service.price))}
                          </span>
                          <Button asChild size="sm">
                            <Link href={`/services/${service.id}`}>View Details</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsPanel>

            <TabsPanel value="reviews" className="mt-6">
              {reviews.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No reviews yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <Avatar
                            src={review.sender.picture}
                            alt={review.sender.username}
                            name={review.sender.username}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{review.sender.username}</span>
                              <span className="text-sm text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <StarRating value={review.rating} readonly size="sm" className="mt-1" />
                            {review.text && (
                              <p className="mt-2 text-muted-foreground">
                                {review.text}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsPanel>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact & Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {shop.address && (
                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <p>{shop.address}</p>
                </div>
              )}

              {shop.contact && (
                <div className="flex gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <a
                    href={`tel:${shop.contact}`}
                    className="hover:text-primary"
                  >
                    {shop.contact}
                  </a>
                </div>
              )}

              {/* Map */}
              {shop.address && (
                <div className="pt-2">
                  <ShopMap
                    shopName={shop.name}
                    address={shop.address}
                    className="rounded-lg"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Business Hours */}
          {shop.startTime && (
            <Card>
              <CardHeader>
                <CardTitle>Business Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p>
                      {shop.startTime} - {shop.endTime}
                    </p>
                    {shop.openingDays && shop.openingDays.length > 0 && (
                      <p className="text-muted-foreground">{shop.openingDays.join(", ")}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-4">
              <Button className="w-full mb-3">
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Message
              </Button>
              {services.length > 0 && (
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/shops/${shop.id}/book`}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Appointment
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
