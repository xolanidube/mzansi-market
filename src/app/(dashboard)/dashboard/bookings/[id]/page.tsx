"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  Receipt,
} from "lucide-react";

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: string;
  notes?: string | null;
  address?: string | null;
  createdAt: string;
  service?: {
    id: string;
    name: string;
    description?: string | null;
    price?: number | null;
    chargeTime?: string | null;
    category?: {
      id: string;
      name: string;
    } | null;
  } | null;
  requester: {
    id: string;
    username: string;
    picture?: string | null;
    phone?: string | null;
    email: string;
  };
  provider: {
    id: string;
    username: string;
    picture?: string | null;
    phone?: string | null;
    email: string;
    shop?: {
      id: string;
      name: string;
      address?: string | null;
      phone?: string | null;
      tax?: string | null;
    } | null;
  };
}

const statusColors: Record<string, "success" | "warning" | "error" | "secondary"> = {
  PENDING: "warning",
  CONFIRMED: "success",
  COMPLETED: "secondary",
  CANCELLED: "error",
  NO_SHOW: "error",
};

const statusIcons: Record<string, React.ReactNode> = {
  PENDING: <AlertCircle className="w-5 h-5" />,
  CONFIRMED: <CheckCircle className="w-5 h-5" />,
  COMPLETED: <CheckCircle className="w-5 h-5" />,
  CANCELLED: <XCircle className="w-5 h-5" />,
  NO_SHOW: <XCircle className="w-5 h-5" />,
};

export default function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const response = await fetch(`/api/appointments/${id}`);
        const data = await response.json();

        if (response.ok) {
          setAppointment(data.appointment);
        } else {
          setError(data.error || "Failed to load appointment");
        }
      } catch (err) {
        setError("An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchAppointment();
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [id, status, router]);

  const handleStatusChange = async (newStatus: string) => {
    if (!appointment) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setAppointment({ ...appointment, status: newStatus });
      }
    } catch (err) {
      console.error("Error updating appointment:", err);
    } finally {
      setUpdating(false);
    }
  };

  if (isLoading || status === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Alert variant="error">{error}</Alert>
        <Button asChild className="mt-4">
          <Link href="/dashboard/bookings">Back to Bookings</Link>
        </Button>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div>
        <Alert variant="error">Appointment not found</Alert>
        <Button asChild className="mt-4">
          <Link href="/dashboard/bookings">Back to Bookings</Link>
        </Button>
      </div>
    );
  }

  const isProvider = session?.user?.id === appointment.provider.id;
  const isRequester = session?.user?.id === appointment.requester.id;
  const otherParty = isProvider ? appointment.requester : appointment.provider;
  const isPending = appointment.status === "PENDING";
  const isConfirmed = appointment.status === "CONFIRMED";
  const canCancel = isPending || isConfirmed;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/bookings"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bookings
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Booking Details</h1>
          <Badge variant={statusColors[appointment.status]} className="text-sm px-3 py-1">
            {statusIcons[appointment.status]}
            <span className="ml-1">{appointment.status}</span>
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Info */}
          <Card>
            <CardHeader>
              <CardTitle>Service Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-xl font-medium">{appointment.service?.name}</h3>
                {appointment.service?.category && (
                  <p className="text-sm text-muted-foreground">
                    {appointment.service.category.name}
                  </p>
                )}
              </div>
              {appointment.service?.description && (
                <p className="text-muted-foreground">
                  {appointment.service.description}
                </p>
              )}
              {appointment.service?.price && (() => {
                const servicePrice = appointment.service.price;
                const commissionRate = 8; // 8%
                const taxRate = parseFloat(appointment.provider.shop?.tax || "0");
                const commission = servicePrice * (commissionRate / 100);
                const tax = servicePrice * (taxRate / 100);
                const total = servicePrice + commission + tax;

                return (
                  <div className="bg-muted/50 rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-border flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-primary" />
                      <span className="font-medium">Price Breakdown</span>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Service Price
                          {appointment.service.chargeTime && (
                            <span className="text-xs ml-1">
                              (per {appointment.service.chargeTime === "1" ? "hour" : appointment.service.chargeTime === "2" ? "day" : "service"})
                            </span>
                          )}
                        </span>
                        <span className="font-medium">{formatCurrency(servicePrice)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Service Commission ({commissionRate}%)
                        </span>
                        <span className="font-medium">{formatCurrency(commission)}</span>
                      </div>
                      {taxRate > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Tax ({taxRate}%)
                          </span>
                          <span className="font-medium">{formatCurrency(tax)}</span>
                        </div>
                      )}
                      <div className="pt-3 border-t border-border flex items-center justify-between">
                        <span className="font-semibold">Total</span>
                        <span className="text-xl font-bold text-primary">
                          {formatCurrency(total)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Date, Time & Location */}
          <Card>
            <CardHeader>
              <CardTitle>Appointment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {formatDate(new Date(appointment.date))}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="font-medium">{appointment.time}</p>
                  </div>
                </div>
              </div>
              {appointment.address && (
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{appointment.address}</p>
                  </div>
                </div>
              )}
              {appointment.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Notes</p>
                  <p className="p-4 bg-muted/50 rounded-lg">
                    {appointment.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Proceed to Checkout (for requester with pending booking) */}
          {isRequester && isPending && appointment.service?.price && (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold mb-1">Ready to secure your booking?</h3>
                    <p className="text-sm text-muted-foreground">
                      Complete payment to confirm your appointment
                    </p>
                  </div>
                  <Button asChild size="lg">
                    <Link href={`/checkout/${appointment.id}`}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Proceed to Checkout
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {(isPending || isConfirmed) && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {isProvider && isPending && (
                    <Button
                      onClick={() => handleStatusChange("CONFIRMED")}
                      disabled={updating}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm Appointment
                    </Button>
                  )}
                  {isProvider && isConfirmed && (
                    <Button
                      onClick={() => handleStatusChange("COMPLETED")}
                      disabled={updating}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Completed
                    </Button>
                  )}
                  {canCancel && (
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange("CANCELLED")}
                      disabled={updating}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel Appointment
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Contact Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {isProvider ? "Client" : "Provider"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar
                  src={otherParty.picture}
                  name={otherParty.username}
                  size="lg"
                />
                <div>
                  <h3 className="font-medium">{otherParty.username}</h3>
                  {!isProvider && appointment.provider.shop && (
                    <p className="text-sm text-muted-foreground">
                      {appointment.provider.shop.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {otherParty.email && (
                  <a
                    href={`mailto:${otherParty.email}`}
                    className="flex items-center gap-2 text-sm hover:text-primary"
                  >
                    <Mail className="w-4 h-4" />
                    {otherParty.email}
                  </a>
                )}
                {otherParty.phone && (
                  <a
                    href={`tel:${otherParty.phone}`}
                    className="flex items-center gap-2 text-sm hover:text-primary"
                  >
                    <Phone className="w-4 h-4" />
                    {otherParty.phone}
                  </a>
                )}
              </div>

              <Button variant="outline" className="w-full" asChild>
                <Link href={`/dashboard/messages/new?to=${otherParty.id}`}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send Message
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Shop Info (for clients) */}
          {!isProvider && appointment.provider.shop && (
            <Card>
              <CardHeader>
                <CardTitle>Shop Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <h3 className="font-medium">{appointment.provider.shop.name}</h3>
                {appointment.provider.shop.address && (
                  <p className="text-sm text-muted-foreground flex items-start gap-2">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {appointment.provider.shop.address}
                  </p>
                )}
                <Button variant="outline" className="w-full mt-3" asChild>
                  <Link href={`/shops/${appointment.provider.shop.id}`}>
                    View Shop
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
