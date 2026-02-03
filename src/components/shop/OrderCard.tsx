"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Package, ChevronRight } from "lucide-react";

interface OrderCardProps {
  order: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    createdAt: string | Date;
    items: Array<{
      id: string;
      quantity: number;
      price: number;
      product: {
        id: string;
        name: string;
        imageUrl?: string | null;
      };
    }>;
  };
  onCancel?: (orderId: string) => void;
}

const statusColors: Record<string, "success" | "warning" | "error" | "secondary"> = {
  PENDING: "warning",
  PROCESSING: "warning",
  SHIPPED: "success",
  DELIVERED: "success",
  CANCELLED: "error",
};

export function OrderCard({ order, onCancel }: OrderCardProps) {
  const canCancel = order.status === "PENDING";

  return (
    <Card>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Order #{order.orderNumber.slice(-8).toUpperCase()}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(new Date(order.createdAt))}
            </p>
          </div>
          <Badge variant={statusColors[order.status] || "secondary"}>
            {order.status}
          </Badge>
        </div>

        {/* Items Preview */}
        <div className="flex items-center gap-2 mb-4">
          {order.items.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="w-12 h-12 bg-muted rounded flex-shrink-0 relative"
            >
              {item.product.imageUrl ? (
                <Image
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  fill
                  className="object-cover rounded"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {order.items.length > 3 && (
            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-sm text-muted-foreground">
              +{order.items.length - 3}
            </div>
          )}
          <div className="flex-1 text-right">
            <p className="font-bold text-primary">
              {formatCurrency(order.totalAmount)}
            </p>
            <p className="text-sm text-muted-foreground">
              {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          {canCancel && onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel(order.id)}
            >
              Cancel Order
            </Button>
          )}
          <Button variant="ghost" size="sm" asChild className="ml-auto">
            <Link href={`/dashboard/orders/${order.id}`}>
              View Details
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
