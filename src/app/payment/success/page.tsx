"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Download,
} from "lucide-react";

interface PaymentDetails {
  id: string;
  amount: number;
  status: string;
  provider: string;
  appointment?: {
    id: string;
    date: string;
    time: string;
    service: {
      name: string;
    } | null;
    provider: {
      username: string;
      shop?: {
        name: string;
        address?: string;
      } | null;
    };
  } | null;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId");
  const appointmentId = searchParams.get("appointmentId");

  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        // Try to get payment details
        if (paymentId) {
          const response = await fetch(`/api/payments/${paymentId}`);
          if (response.ok) {
            const data = await response.json();
            setPayment(data.payment);
            setIsLoading(false);
            return;
          }
        }

        // Fallback to appointment details
        if (appointmentId) {
          const response = await fetch(`/api/appointments/${appointmentId}`);
          if (response.ok) {
            const data = await response.json();
            // Construct payment-like object from appointment
            setPayment({
              id: "N/A",
              amount: data.appointment?.service?.price || 0,
              status: "COMPLETED",
              provider: "WALLET",
              appointment: data.appointment,
            });
          }
        }
      } catch (err) {
        setError("Failed to load payment details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [paymentId, appointmentId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-lg">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 mb-4">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground">
            Your booking has been confirmed
          </p>
        </div>

        {/* Payment Details Card */}
        <Card className="mb-6">
          <CardContent className="p-6 space-y-4">
            {payment?.appointment && (
              <>
                {/* Service Info */}
                <div className="text-center pb-4 border-b">
                  <h2 className="font-semibold text-lg">
                    {payment.appointment.service?.name || "Service"}
                  </h2>
                  <p className="text-muted-foreground">
                    {payment.appointment.provider.shop?.name ||
                      payment.appointment.provider.username}
                  </p>
                </div>

                {/* Appointment Details */}
                <div className="space-y-3 py-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">
                        {formatDate(new Date(payment.appointment.date))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="font-medium">{payment.appointment.time}</p>
                    </div>
                  </div>
                  {payment.appointment.provider.shop?.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">
                          {payment.appointment.provider.shop.address}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Payment Amount */}
            <div className="pt-4 border-t text-center">
              <p className="text-sm text-muted-foreground mb-1">Amount Paid</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(payment?.amount || 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                via {payment?.provider || "Payment"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Note */}
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <p className="text-sm text-center text-muted-foreground">
            A confirmation email has been sent to your registered email address.
            Please save this information for your records.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button asChild className="w-full" size="lg">
            <Link href="/dashboard/bookings">
              View My Bookings
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/services">Browse More Services</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
