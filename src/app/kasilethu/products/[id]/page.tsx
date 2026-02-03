"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProductCard } from "@/components/shop/ProductCard";
import { CartButton, useCart } from "@/components/shop/Cart";
import { Spinner } from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/utils";
import {
  Package,
  ShoppingCart,
  ArrowLeft,
  Check,
  AlertCircle,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  quantity?: number;
  category?: string | null;
  status?: string;
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${id}`);
        const data = await response.json();

        if (response.ok) {
          setProduct(data.product);
          setRelatedProducts(data.relatedProducts || []);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
      });
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Package className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
        <p className="text-muted-foreground mb-4">
          The product you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button onClick={() => router.push("/kasilethu")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Shop
        </Button>
      </div>
    );
  }

  const isOutOfStock =
    product.quantity === 0 || product.status === "OUT_OF_STOCK";

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/kasilethu")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shop
          </Button>
          <CartButton />
        </div>

        {/* Product */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Image */}
          <div className="aspect-square bg-muted rounded-lg relative">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-24 h-24 text-muted-foreground" />
              </div>
            )}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                <Badge variant="error" className="text-lg px-6 py-3">
                  Out of Stock
                </Badge>
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            {product.category && (
              <p className="text-sm text-muted-foreground mb-2">
                {product.category}
              </p>
            )}
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
            <p className="text-4xl font-bold text-primary mb-6">
              {formatCurrency(product.price)}
            </p>

            {product.description && (
              <div className="prose prose-sm max-w-none mb-6">
                <p className="text-muted-foreground">{product.description}</p>
              </div>
            )}

            {/* Stock Status */}
            <div className="flex items-center gap-2 mb-6">
              {isOutOfStock ? (
                <>
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-500">Out of Stock</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-green-500">
                    In Stock ({product.quantity} available)
                  </span>
                </>
              )}
            </div>

            {/* Add to Cart */}
            <Button
              size="lg"
              className="w-full"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
            >
              {addedToCart ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Added to Cart
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={(productId) => {
                    const prod = relatedProducts.find((rp) => rp.id === productId);
                    if (prod) {
                      addItem({
                        id: prod.id,
                        name: prod.name,
                        price: prod.price,
                        imageUrl: prod.imageUrl,
                      });
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
