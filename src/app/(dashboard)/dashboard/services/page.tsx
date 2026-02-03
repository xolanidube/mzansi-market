"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { formatCurrency } from "@/lib/utils";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MoreVertical,
  Clock,
  Tag,
} from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  chargeTime: string;
  category: string;
  subcategory?: string | null;
  duration?: number | null;
  image?: string | null;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
}

const chargeTimeLabels: Record<string, string> = {
  HOURLY: "/hr",
  DAILY: "/day",
  FIXED: " fixed",
  NEGOTIABLE: " (negotiable)",
};

export default function ServicesManagementPage() {
  const { data: session } = useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const fetchServices = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/services?userId=${session.user.id}`);
      const data = await response.json();

      if (response.ok) {
        setServices(data.services);
      }
    } catch (err) {
      setError("Failed to load services");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [session?.user?.id]);

  const toggleServiceStatus = async (serviceId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        setServices((prev) =>
          prev.map((s) =>
            s.id === serviceId ? { ...s, isActive: !isActive } : s
          )
        );
      }
    } catch (err) {
      console.error("Failed to update service status:", err);
    }
    setActiveMenu(null);
  };

  const deleteService = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setServices((prev) => prev.filter((s) => s.id !== serviceId));
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete service");
      }
    } catch (err) {
      console.error("Failed to delete service:", err);
    }
    setActiveMenu(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Services</h1>
          <p className="text-muted-foreground mt-1">
            Manage the services you offer to customers
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/services/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Link>
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Services List */}
      {services.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Tag className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No services yet</h3>
            <p className="text-muted-foreground mb-4">
              Start adding services to attract customers
            </p>
            <Button asChild>
              <Link href="/dashboard/services/new">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Service
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {services.map((service) => (
            <Card
              key={service.id}
              className={!service.isActive ? "opacity-60" : ""}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {service.image ? (
                      <Image
                        src={service.image}
                        alt={service.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl text-muted-foreground">
                        {service.category.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-lg line-clamp-1">
                          {service.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">{service.category}</Badge>
                          {service.subcategory && (
                            <Badge variant="outline">{service.subcategory}</Badge>
                          )}
                          {!service.isActive && (
                            <Badge variant="warning">Inactive</Badge>
                          )}
                          {service.isFeatured && (
                            <Badge variant="primary">Featured</Badge>
                          )}
                        </div>
                      </div>

                      {/* Actions Menu */}
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setActiveMenu(
                              activeMenu === service.id ? null : service.id
                            )
                          }
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>

                        {activeMenu === service.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-background border rounded-md shadow-lg z-10">
                            <div className="py-1">
                              <Link
                                href={`/dashboard/services/${service.id}`}
                                className="flex items-center gap-2 px-4 py-2 hover:bg-muted"
                                onClick={() => setActiveMenu(null)}
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </Link>
                              <Link
                                href={`/services/${service.id}`}
                                target="_blank"
                                className="flex items-center gap-2 px-4 py-2 hover:bg-muted"
                                onClick={() => setActiveMenu(null)}
                              >
                                <Eye className="w-4 h-4" />
                                View Public
                              </Link>
                              <button
                                onClick={() =>
                                  toggleServiceStatus(service.id, service.isActive)
                                }
                                className="flex items-center gap-2 px-4 py-2 hover:bg-muted w-full text-left"
                              >
                                {service.isActive ? (
                                  <>
                                    <EyeOff className="w-4 h-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-4 h-4" />
                                    Activate
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => deleteService(service.id)}
                                className="flex items-center gap-2 px-4 py-2 hover:bg-muted w-full text-left text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                      {service.description}
                    </p>

                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <span className="font-semibold text-primary">
                        {formatCurrency(service.price)}
                        {chargeTimeLabels[service.chargeTime] || ""}
                      </span>

                      {service.duration && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {service.duration} min
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
