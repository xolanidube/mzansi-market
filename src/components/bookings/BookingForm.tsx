"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { DateTimePicker } from "./DateTimePicker";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Calendar, Clock, Loader2 } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number | null;
  chargeTime?: string | null;
}

interface Provider {
  id: string;
  username: string;
  shop?: {
    name: string;
    address?: string | null;
  } | null;
}

interface BookingFormProps {
  service: Service;
  provider: Provider;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BookingForm({
  service,
  provider,
  onSuccess,
  onCancel,
}: BookingFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState(provider.shop?.address || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime) {
      setError("Please select a date and time");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          providerId: provider.id,
          date: selectedDate.toISOString().split("T")[0],
          time: selectedTime,
          notes: notes || undefined,
          address: address || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to book appointment");
      }

      setSuccess("Appointment booked successfully!");

      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      } else {
        // Redirect to checkout if service has a price, otherwise to bookings
        setTimeout(() => {
          if (service.price && service.price > 0 && data.appointment?.id) {
            router.push(`/checkout/${data.appointment.id}`);
          } else {
            router.push("/dashboard/bookings");
          }
          router.refresh();
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Service Summary */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h3 className="font-medium mb-2">Booking Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Service:</span>
            <span className="font-medium">{service.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Provider:</span>
            <span className="font-medium">
              {provider.shop?.name || provider.username}
            </span>
          </div>
          {service.price && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price:</span>
              <span className="font-medium text-primary">
                {formatCurrency(service.price)}
                {service.chargeTime && ` / ${service.chargeTime}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Date & Time Selection */}
      <div>
        <h3 className="font-medium mb-3">Select Date & Time</h3>
        <DateTimePicker
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          onDateChange={setSelectedDate}
          onTimeChange={setSelectedTime}
        />
      </div>

      {/* Selected Date/Time Display */}
      {selectedDate && selectedTime && (
        <div className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="font-medium">{formatDate(selectedDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <span className="font-medium">{selectedTime}</span>
          </div>
        </div>
      )}

      {/* Location */}
      <div>
        <Input
          label="Location / Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter the service location"
        />
      </div>

      {/* Notes */}
      <Textarea
        label="Additional Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Any special requests or information for the provider..."
        rows={3}
      />

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isLoading || !selectedDate || !selectedTime}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Booking...
            </>
          ) : (
            "Confirm Booking"
          )}
        </Button>
      </div>
    </form>
  );
}
