"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { useCart } from "./Cart";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Package, CheckCircle } from "lucide-react";
import Image from "next/image";

export function CheckoutForm() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (items.length === 0) {
      setError("Your cart is empty");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
          address: address || undefined,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to place order");
      }

      setSuccess(true);
      setOrderNumber(data.order.orderNumber);
      clearCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Order Placed!</h2>
        <p className="text-muted-foreground mb-4">
          Your order number is: <strong>{orderNumber}</strong>
        </p>
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => router.push("/kasilethu")}>
            Continue Shopping
          </Button>
          <Button onClick={() => router.push("/dashboard/orders")}>
            View Orders
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">Your cart is empty</p>
        <Button onClick={() => router.push("/kasilethu")}>
          Browse Products
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      {/* Order Summary */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h3 className="font-medium mb-4">Order Summary</h3>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-12 h-12 bg-muted rounded flex-shrink-0 relative">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium line-clamp-1">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  {item.quantity} x {formatCurrency(item.price)}
                </p>
              </div>
              <p className="font-medium">
                {formatCurrency(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>
        <div className="border-t mt-4 pt-4 flex items-center justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-primary">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Delivery Address */}
      <Textarea
        label="Delivery Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Enter your delivery address..."
        rows={3}
      />

      {/* Notes */}
      <Textarea
        label="Order Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Any special instructions..."
        rows={2}
      />

      {/* Submit */}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Placing Order...
          </>
        ) : (
          `Place Order - ${formatCurrency(total)}`
        )}
      </Button>
    </form>
  );
}
