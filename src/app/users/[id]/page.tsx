"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Spinner,
  Avatar,
} from "@/components/ui";

type UserProfile = {
  id: string;
  username: string;
  email: string;
  phone?: string;
  picture?: string;
  userType: string;
  isVerified: boolean;
  createdAt: string;
  shop?: {
    id: string;
    name: string;
    description?: string;
    address?: string;
    contact?: string;
    startTime?: string;
    endTime?: string;
    openingDays: string[];
    rating: number;
    totalReviews: number;
    profileUrl?: string;
  };
  services?: Array<{
    id: string;
    name: string;
    description?: string;
    price: string;
    picture?: string;
  }>;
  reviewsReceived?: Array<{
    id: string;
    rating: number;
    text?: string;
    createdAt: string;
    sender: {
      username: string;
      picture?: string;
    };
  }>;
  _count?: {
    services: number;
    reviewsReceived: number;
    appointmentsReceived: number;
  };
};

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("User not found");
          } else {
            setError("Failed to load user profile");
          }
          return;
        }

        const data = await response.json();
        setUser(data);
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("An error occurred while loading the profile");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card padding="none" className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-error/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {error || "User not found"}
            </h2>
            <p className="text-muted-foreground mb-6">
              The profile you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isProvider = user.userType === "SERVICE_PROVIDER";
  const avgRating = user.shop?.rating || 0;
  const totalReviews = user.shop?.totalReviews || user._count?.reviewsReceived || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/services">
              <Button variant="ghost" size="sm">Services</Button>
            </Link>
            <Link href="/shops">
              <Button variant="ghost" size="sm">Shops</Button>
            </Link>
            <Link href="/login">
              <Button size="sm">Sign In</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Profile Picture */}
            <div className="relative">
              {user.picture || user.shop?.profileUrl ? (
                <Image
                  src={user.picture || user.shop?.profileUrl || ""}
                  alt={user.username}
                  width={128}
                  height={128}
                  className="w-32 h-32 rounded-full object-cover border-4 border-background shadow-lg"
                />
              ) : (
                <Avatar
                  name={user.username}
                  size="xl"
                  className="w-32 h-32 text-3xl border-4 border-background shadow-lg"
                />
              )}
              {user.isVerified && (
                <div className="absolute bottom-0 right-0 bg-success text-white p-1.5 rounded-full">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <h1 className="text-3xl font-bold text-foreground">
                  {user.shop?.name || user.username}
                </h1>
                {user.isVerified && (
                  <Badge variant="success">Verified</Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1">@{user.username}</p>

              <div className="flex items-center gap-4 mt-4 justify-center md:justify-start">
                <Badge variant={isProvider ? "primary" : "secondary"}>
                  {isProvider ? "Service Provider" : "Client"}
                </Badge>

                {isProvider && totalReviews > 0 && (
                  <div className="flex items-center gap-1">
                    <svg className="w-5 h-5 text-warning" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-semibold">{avgRating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({totalReviews} reviews)</span>
                  </div>
                )}
              </div>

              {/* Contact Actions */}
              <div className="flex gap-3 mt-6 justify-center md:justify-start">
                <Link href={`/dashboard/messages/new?to=${user.id}`}>
                  <Button>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Send Message
                  </Button>
                </Link>
                {user.shop && (
                  <Link href={`/shops/${user.shop.id}`}>
                    <Button variant="outline">View Shop</Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - About & Contact */}
          <div className="space-y-6">
            {/* About */}
            {user.shop?.description && (
              <Card padding="none">
                <CardHeader className="p-6 pb-4">
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <p className="text-muted-foreground">{user.shop.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Contact Info */}
            <Card padding="none">
              <CardHeader className="p-6 pb-4">
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-3">
                {user.shop?.contact && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{user.shop.contact}</span>
                  </div>
                )}
                {user.shop?.address && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{user.shop.address}</span>
                  </div>
                )}
                {user.shop?.startTime && user.shop?.endTime && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{user.shop.startTime} - {user.shop.endTime}</span>
                  </div>
                )}
                {user.shop?.openingDays && user.shop.openingDays.length > 0 && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-muted-foreground mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{user.shop.openingDays.join(", ")}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            {isProvider && (
              <Card padding="none">
                <CardHeader className="p-6 pb-4">
                  <CardTitle>Stats</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-lg bg-secondary/50">
                      <p className="text-2xl font-bold text-foreground">
                        {user._count?.services || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Services</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-secondary/50">
                      <p className="text-2xl font-bold text-foreground">
                        {totalReviews}
                      </p>
                      <p className="text-sm text-muted-foreground">Reviews</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-secondary/50">
                      <p className="text-2xl font-bold text-foreground">
                        {user._count?.appointmentsReceived || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Bookings</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-secondary/50">
                      <p className="text-2xl font-bold text-foreground">
                        {avgRating.toFixed(1)}
                      </p>
                      <p className="text-sm text-muted-foreground">Rating</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Services & Reviews */}
          <div className="lg:col-span-2 space-y-6">
            {/* Services */}
            {isProvider && user.services && user.services.length > 0 && (
              <Card padding="none">
                <CardHeader className="p-6 pb-4">
                  <CardTitle>Services</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {user.services.map((service) => (
                      <Link
                        key={service.id}
                        href={`/services/${service.id}`}
                        className="block"
                      >
                        <div className="p-4 rounded-lg border border-border hover:border-primary transition-colors">
                          <h3 className="font-semibold text-foreground">
                            {service.name}
                          </h3>
                          {service.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {service.description}
                            </p>
                          )}
                          <p className="text-primary font-semibold mt-2">
                            R{parseFloat(service.price).toFixed(2)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            {user.reviewsReceived && user.reviewsReceived.length > 0 && (
              <Card padding="none">
                <CardHeader className="p-6 pb-4">
                  <CardTitle>Reviews</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="space-y-4">
                    {user.reviewsReceived.map((review) => (
                      <div
                        key={review.id}
                        className="p-4 rounded-lg bg-secondary/30"
                      >
                        <div className="flex items-start gap-3">
                          {review.sender.picture ? (
                            <Image
                              src={review.sender.picture}
                              alt={review.sender.username}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <Avatar name={review.sender.username} size="sm" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-foreground">
                                {review.sender.username}
                              </p>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <svg
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating
                                        ? "text-warning"
                                        : "text-muted"
                                    }`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                            </div>
                            {review.text && (
                              <p className="text-muted-foreground mt-2">
                                {review.text}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Content */}
            {isProvider && (!user.services || user.services.length === 0) && (
              <Card padding="none">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    This provider hasn&apos;t added any services yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
