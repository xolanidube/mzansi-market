import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addToCartSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive().default(1),
});

// GET /api/cart - Get user's cart
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create cart
    let cart = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        status: "CART",
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                imageUrl: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.order.create({
        data: {
          userId: session.user.id,
          status: "CART",
          totalAmount: 0,
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  imageUrl: true,
                  status: true,
                },
              },
            },
          },
        },
      });
    }

    // Calculate totals
    const items = cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      price: Number(item.price),
      product: item.product,
    }));

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return NextResponse.json({
      id: cart.id,
      items,
      subtotal,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, quantity } = addToCartSchema.parse(body);

    // Get product
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.status !== "AVAILABLE") {
      return NextResponse.json(
        { error: "Product not found or unavailable" },
        { status: 404 }
      );
    }

    // Get or create cart
    let cart = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        status: "CART",
      },
    });

    if (!cart) {
      cart = await prisma.order.create({
        data: {
          userId: session.user.id,
          status: "CART",
          totalAmount: 0,
        },
      });
    }

    // Check if item already in cart
    const existingItem = await prisma.orderItem.findFirst({
      where: {
        orderId: cart.id,
        productId,
      },
    });

    if (existingItem) {
      // Update quantity
      await prisma.orderItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      // Add new item
      await prisma.orderItem.create({
        data: {
          orderId: cart.id,
          productId,
          quantity,
          price: product.price,
        },
      });
    }

    // Update cart total
    const cartItems = await prisma.orderItem.findMany({
      where: { orderId: cart.id },
    });

    const total = cartItems.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );

    await prisma.order.update({
      where: { id: cart.id },
      data: { totalAmount: total },
    });

    return NextResponse.json({
      success: true,
      message: "Item added to cart",
    });
  } catch (error) {
    console.error("Error adding to cart:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to add item to cart" },
      { status: 500 }
    );
  }
}

// DELETE /api/cart - Clear cart
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cart = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        status: "CART",
      },
    });

    if (cart) {
      await prisma.orderItem.deleteMany({
        where: { orderId: cart.id },
      });

      await prisma.order.update({
        where: { id: cart.id },
        data: { totalAmount: 0 },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Cart cleared",
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    return NextResponse.json(
      { error: "Failed to clear cart" },
      { status: 500 }
    );
  }
}
