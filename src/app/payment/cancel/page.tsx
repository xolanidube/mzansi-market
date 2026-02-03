"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { XCircle, ArrowLeft, RefreshCcw } from "lucide-react";

function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");
  const paymentId = searchParams.get("paymentId");

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-lg">
        {/* Cancel Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-warning/10 mb-4">
            <XCircle className="w-10 h-10 text-warning" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Payment Cancelled</h1>
          <p className="text-muted-foreground">
            Your payment was not completed
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Don&apos;t worry, your booking is still saved. You can complete
                the payment anytime from your bookings page.
              </p>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  If you experienced any issues during payment, please contact
                  our support team for assistance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          {appointmentId && (
            <Button asChild className="w-full" size="lg">
              <Link href={`/checkout/${appointmentId}`}>
                <RefreshCcw className="w-4 h-4 mr-2" />
                Try Again
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard/bookings">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Bookings
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/help">Need Help?</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <PaymentCancelContent />
    </Suspense>
  );
}
