"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Calendar, Clock, MapPin, MessageCircle, Phone } from "lucide-react";

interface BookingCardProps {
  booking: {
    id: string;
    date: string | Date;
    time: string;
    status: string;
    notes?: string | null;
    address?: string | null;
    service?: {
      id: string;
      name: string;
      price?: number | null;
      chargeTime?: string | null;
    } | null;
    requester?: {
      id: string;
      username: string;
      picture?: string | null;
      phone?: string | null;
    };
    provider?: {
      id: string;
      username: string;
      picture?: string | null;
      phone?: string | null;
      shop?: {
        id: string;
        name: string;
        address?: string | null;
      } | null;
    };
  };
  role: "client" | "provider";
  onStatusChange?: (id: string, status: string) => void;
}

const statusColors: Record<string, "success" | "warning" | "error" | "secondary"> = {
  PENDING: "warning",
  CONFIRMED: "success",
  COMPLETED: "secondary",
  CANCELLED: "error",
  NO_SHOW: "error",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No Show",
};

export function BookingCard({ booking, role, onStatusChange }: BookingCardProps) {
  const otherParty = role === "client" ? booking.provider : booking.requester;
  const isPending = booking.status === "PENDING";
  const isConfirmed = booking.status === "CONFIRMED";
  const canCancel = isPending || isConfirmed;

  const bookingDate = new Date(booking.date);
  const isPast = bookingDate < new Date();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Avatar
              src={otherParty?.picture}
              name={otherParty?.username || "User"}
              size="md"
            />
            <div>
              <h3 className="font-medium">
                {role === "client"
                  ? booking.provider?.shop?.name || booking.provider?.username
                  : booking.requester?.username}
              </h3>
              <p className="text-sm text-muted-foreground">
                {booking.service?.name || "Service"}
              </p>
            </div>
          </div>
          <Badge variant={statusColors[booking.status]}>
            {statusLabels[booking.status]}
          </Badge>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>{formatDate(bookingDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{booking.time}</span>
          </div>
          {booking.address && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="line-clamp-1">{booking.address}</span>
            </div>
          )}
        </div>

        {/* Price */}
        {booking.service?.price && (
          <div className="flex items-center justify-between py-2 border-t border-b mb-4">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-bold text-primary">
              {formatCurrency(booking.service.price)}
              {booking.service.chargeTime && ` / ${booking.service.chargeTime}`}
            </span>
          </div>
        )}

        {/* Notes */}
        {booking.notes && (
          <div className="bg-muted/50 rounded p-3 mb-4">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {booking.notes}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            {otherParty?.phone && (
              <Button variant="ghost" size="sm" asChild>
                <a href={`tel:${otherParty.phone}`}>
                  <Phone className="w-4 h-4" />
                </a>
              </Button>
            )}
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/dashboard/messages/new?to=${otherParty?.id}`}>
                <MessageCircle className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className="flex gap-2">
            {/* Provider Actions */}
            {role === "provider" && (
              <>
                {isPending && onStatusChange && (
                  <Button
                    size="sm"
                    onClick={() => onStatusChange(booking.id, "CONFIRMED")}
                  >
                    Confirm
                  </Button>
                )}
                {isConfirmed && !isPast && onStatusChange && (
                  <Button
                    size="sm"
                    onClick={() => onStatusChange(booking.id, "COMPLETED")}
                  >
                    Complete
                  </Button>
                )}
              </>
            )}

            {/* Cancel Button */}
            {canCancel && onStatusChange && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusChange(booking.id, "CANCELLED")}
              >
                Cancel
              </Button>
            )}

            {/* View Details */}
            <Button size="sm" variant="ghost" asChild>
              <Link href={`/dashboard/bookings/${booking.id}`}>View</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
