"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { ShoppingCart, Package } from "lucide-react";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    imageUrl?: string | null;
    quantity?: number;
    category?: string | null;
    status?: string;
  };
  onAddToCart?: (productId: string) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const isOutOfStock = product.quantity === 0 || product.status === "OUT_OF_STOCK";

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Image */}
      <div className="relative aspect-square bg-muted">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="error" className="text-lg px-4 py-2">
              Out of Stock
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Category */}
        {product.category && (
          <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
        )}

        {/* Name */}
        <h3 className="font-medium line-clamp-2 mb-2">
          <Link href={`/kasilethu/products/${product.id}`} className="hover:text-primary">
            {product.name}
          </Link>
        </h3>

        {/* Price */}
        <p className="text-lg font-bold text-primary mb-3">
          {formatCurrency(product.price)}
        </p>

        {/* Add to Cart */}
        {onAddToCart && !isOutOfStock && (
          <Button
            className="w-full"
            size="sm"
            onClick={() => onAddToCart(product.id)}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
