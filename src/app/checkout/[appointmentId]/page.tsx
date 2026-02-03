"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  Wallet,
  Building2,
  Loader2,
  CheckCircle,
} from "lucide-react";

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: string;
  notes?: string;
  address?: string;
  service: {
    id: string;
    name: string;
    price: number | null;
    chargeTime?: string;
  } | null;
  provider: {
    id: string;
    username: string;
    shop?: {
      id: string;
      name: string;
      address?: string;
      tax?: string | null;
    } | null;
  };
}

interface PaymentProvider {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  available: boolean;
}

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  // Fetch appointment details
  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const response = await fetch(`/api/appointments/${appointmentId}`);
        const data = await response.json();

        if (response.ok) {
          setAppointment(data.appointment);
        } else {
          setError(data.error || "Appointment not found");
        }
      } catch (err) {
        setError("Failed to load appointment");
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchAppointment();
    }
  }, [appointmentId, session?.user?.id]);

  // Fetch wallet balance
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const response = await fetch("/api/wallet");
        const data = await response.json();
        if (response.ok) {
          setWalletBalance(data.balance || 0);
        }
      } catch (err) {
        console.error("Failed to fetch wallet:", err);
      }
    };

    if (session?.user?.id) {
      fetchWallet();
    }
  }, [session?.user?.id]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/checkout/${appointmentId}`);
    }
  }, [status, appointmentId, router]);

  const servicePrice = appointment?.service?.price || 0;
  const commissionRate = 8; // 8%
  const taxRate = parseFloat(appointment?.provider.shop?.tax || "0");
  const commission = servicePrice * (commissionRate / 100);
  const tax = servicePrice * (taxRate / 100);
  const totalAmount = servicePrice + commission + tax;

  const paymentProviders: PaymentProvider[] = [
    {
      id: "WALLET",
      name: "Wallet Balance",
      icon: <Wallet className="w-6 h-6" />,
      description: `Available: ${formatCurrency(walletBalance)}`,
      available: walletBalance >= totalAmount,
    },
    {
      id: "YOCO",
      name: "Card Payment (Yoco)",
      icon: <CreditCard className="w-6 h-6" />,
      description: "Pay with credit or debit card",
      available: true,
    },
    {
      id: "PAYFAST",
      name: "PayFast",
      icon: <Building2 className="w-6 h-6" />,
      description: "Multiple payment options",
      available: true,
    },
  ];

  const handlePayment = async () => {
    if (!selectedProvider || !appointment) return;

    setIsProcessing(true);
    setError("");

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          amount: totalAmount,
          description: `Payment for ${appointment.service?.name || "service"}`,
          appointmentId: appointment.id,
          returnUrl: `${window.location.origin}/payment/success?appointmentId=${appointment.id}`,
          cancelUrl: `${window.location.origin}/payment/cancel?appointmentId=${appointment.id}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Payment failed");
      }

      // Handle wallet payment (completes immediately)
      if (selectedProvider === "WALLET" && data.status === "COMPLETED") {
        router.push(`/payment/success?appointmentId=${appointment.id}&paymentId=${data.paymentId}`);
        return;
      }

      // Redirect to payment gateway
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        throw new Error("No payment redirect URL received");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setIsProcessing(false);
    }
  };

  const handleSkipPayment = () => {
    // Allow user to skip payment and pay later
    router.push("/dashboard/bookings");
  };

  if (isLoading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !appointment) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Alert variant="error">{error}</Alert>
          <Button asChild className="mt-4">
            <Link href="/dashboard/bookings">View Bookings</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Alert variant="error">Appointment not found</Alert>
          <Button asChild className="mt-4">
            <Link href="/dashboard/bookings">View Bookings</Link>
          </Button>
        </div>
      </div>
    );
  }

  // If already paid, redirect to success
  if (appointment.status === "CONFIRMED") {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Already Paid</h1>
          <p className="text-muted-foreground mb-6">
            This appointment has already been paid for.
          </p>
          <Button asChild>
            <Link href="/dashboard/bookings">View Your Bookings</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Link */}
        <Link
          href="/dashboard/bookings"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bookings
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Complete Your Payment</h1>
          <p className="text-muted-foreground">
            Secure your appointment by completing the payment
          </p>
        </div>

        {error && <Alert variant="error" className="mb-6">{error}</Alert>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Options */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentProviders.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => provider.available && setSelectedProvider(provider.id)}
                    disabled={!provider.available || isProcessing}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-colors ${
                      selectedProvider === provider.id
                        ? "border-primary bg-primary/5"
                        : provider.available
                        ? "border-border hover:border-primary/50"
                        : "border-border bg-muted/50 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-full ${
                        selectedProvider === provider.id
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {provider.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">{provider.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {provider.description}
                      </p>
                    </div>
                    {selectedProvider === provider.id && (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handlePayment}
                disabled={!selectedProvider || isProcessing}
                className="flex-1"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay {formatCurrency(totalAmount)}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleSkipPayment}
                disabled={isProcessing}
              >
                Pay Later
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Service */}
                <div>
                  <h3 className="font-medium">{appointment.service?.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {appointment.provider.shop?.name || appointment.provider.username}
                  </p>
                </div>

                {/* Date & Time */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{formatDate(new Date(appointment.date))}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{appointment.time}</span>
                  </div>
                  {(appointment.address || appointment.provider.shop?.address) && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {appointment.address || appointment.provider.shop?.address}
                      </span>
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Service Fee</span>
                    <span className="font-medium">
                      {formatCurrency(servicePrice)}
                    </span>
                  </div>
                  {appointment.service?.chargeTime && (
                    <p className="text-xs text-muted-foreground text-right -mt-1">
                      per {appointment.service.chargeTime}
                    </p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Commission ({commissionRate}%)
                    </span>
                    <span className="font-medium">
                      {formatCurrency(commission)}
                    </span>
                  </div>
                  {taxRate > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Tax ({taxRate}%)
                      </span>
                      <span className="font-medium">
                        {formatCurrency(tax)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total</span>
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Note */}
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground text-center">
                Your payment is secure and encrypted. By completing this payment,
                you agree to our terms of service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
