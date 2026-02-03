"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { ShopForm } from "@/components/shops/ShopForm";
import {
  Store,
  Edit,
  MapPin,
  Clock,
  Phone,
  Mail,
  Globe,
  CheckCircle,
  AlertCircle,
  Briefcase,
  Receipt,
  Percent,
} from "lucide-react";

interface Shop {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  openingHours?: string | null;
  closingHours?: string | null;
  workingDays?: string | null;
  tax?: number | null;
  contact?: string | null;
  rating: number;
  reviewCount: number;
  isApproved: boolean;
  isFeatured: boolean;
  coverImage?: string | null;
  logo?: string | null;
  _count?: {
    services: number;
  };
}

export default function ShopManagementPage() {
  const { data: session } = useSession();
  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");

  const fetchShop = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/shops?userId=${session.user.id}`);
      const data = await response.json();

      if (response.ok && data.shop) {
        setShop(data.shop);
      }
    } catch (err) {
      setError("Failed to load shop data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShop();
  }, [session?.user?.id]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  // Show form if editing or no shop exists
  if (isEditing || !shop) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {shop ? "Edit Shop" : "Create Your Shop"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {shop
                ? "Update your shop information"
                : "Set up your shop to start offering services"}
            </p>
          </div>
          {shop && (
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-6">
            <ShopForm
              initialData={shop ? {
                id: shop.id,
                name: shop.name,
                description: shop.description || "",
                address: shop.address || "",
                city: shop.city || "",
                province: shop.province || "",
                postalCode: shop.postalCode || "",
                phone: shop.phone || "",
                email: shop.email || "",
                website: shop.website || "",
                openingHours: shop.openingHours || "",
                closingHours: shop.closingHours || "",
                workingDays: shop.workingDays || "",
                tax: String(shop.tax ?? 15),
                contact: shop.contact || "",
              } : undefined}
              onSuccess={() => {
                setIsEditing(false);
                fetchShop();
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Shop</h1>
          <p className="text-muted-foreground mt-1">
            Manage your shop profile and settings
          </p>
        </div>
        <Button onClick={() => setIsEditing(true)}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Shop
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Approval Status */}
      {!shop.isApproved && (
        <Alert variant="warning">
          <AlertCircle className="w-4 h-4" />
          <span>
            Your shop is pending approval. Once approved, it will be visible to
            customers.
          </span>
        </Alert>
      )}

      {/* Shop Profile */}
      <Card>
        {/* Cover Image */}
        <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5">
          {shop.coverImage && (
            <Image
              src={shop.coverImage}
              alt={shop.name}
              fill
              className="object-cover"
            />
          )}
          <div className="absolute top-4 right-4 flex gap-2">
            {shop.isApproved ? (
              <Badge variant="success">
                <CheckCircle className="w-3 h-3 mr-1" />
                Approved
              </Badge>
            ) : (
              <Badge variant="warning">Pending Approval</Badge>
            )}
            {shop.isFeatured && <Badge variant="primary">Featured</Badge>}
          </div>
        </div>

        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Logo */}
            <div className="relative -mt-16 md:-mt-12">
              <div className="w-24 h-24 rounded-lg border-4 border-background bg-white shadow-md overflow-hidden">
                {shop.logo ? (
                  <Image
                    src={shop.logo}
                    alt={shop.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <Store className="w-10 h-10 text-primary" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{shop.name}</h2>
              {shop.description && (
                <p className="text-muted-foreground mt-2">{shop.description}</p>
              )}

              <div className="flex items-center gap-4 mt-4">
                <StarRating value={shop.rating} readonly showValue />
                <span className="text-sm text-muted-foreground">
                  ({shop.reviewCount} reviews)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats and Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Services Count */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{shop._count?.services || 0}</p>
                <p className="text-sm text-muted-foreground">Active Services</p>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full mt-4">
              <Link href="/dashboard/services">Manage Services</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {shop.address || shop.city ? (
              <div className="text-sm space-y-1">
                {shop.address && <p>{shop.address}</p>}
                <p>
                  {[shop.city, shop.province, shop.postalCode]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No location set</p>
            )}
          </CardContent>
        </Card>

        {/* Business Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Business Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {shop.openingHours && shop.closingHours ? (
              <div className="text-sm space-y-1">
                <p>
                  {shop.openingHours} - {shop.closingHours}
                </p>
                {shop.workingDays && (
                  <p className="text-muted-foreground">{shop.workingDays}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hours set</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{shop.phone || "Not set"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{shop.email || "Not set"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Website</p>
                {shop.website ? (
                  <a
                    href={shop.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {shop.website.replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  <p className="font-medium">Not set</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax & Billing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Tax & Billing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Percent className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">VAT Rate</p>
                <p className="text-2xl font-bold">{shop.tax ?? 15}%</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Business Contact</p>
                <p className="font-medium">{shop.contact || shop.phone || "Not set"}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              This tax rate will be applied to all invoices generated for your services.
              Customers will see the tax breakdown on their receipts.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <Link href="/dashboard/services/new">Add New Service</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/shops/${shop.id}`} target="_blank">
                View Public Profile
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/reviews">View Reviews</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
