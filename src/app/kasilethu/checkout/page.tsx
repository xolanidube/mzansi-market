"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/kasilethu/checkout");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Lock className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
        <p className="text-muted-foreground mb-4">
          Please sign in to complete your purchase.
        </p>
        <Button asChild>
          <Link href="/login?callbackUrl=/kasilethu/checkout">Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Back */}
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => router.push("/kasilethu")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Continue Shopping
        </Button>

        {/* Header */}
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        {/* Form */}
        <CheckoutForm />
      </div>
    </div>
  );
}
