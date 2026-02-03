import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/products/[id] - Get a specific product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Get related products
    const relatedProducts = await prisma.product.findMany({
      where: {
        id: { not: product.id },
        status: "AVAILABLE",
        categoryId: product.categoryId,
      },
      take: 4,
    });

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: Number(product.price),
        status: product.status,
        imageUrl: product.imageUrl,
        quantity: product.quantity,
        category: product.category?.name || null,
        categoryId: product.categoryId,
        createdAt: product.createdAt,
      },
      relatedProducts: relatedProducts.map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        imageUrl: p.imageUrl,
      })),
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}
