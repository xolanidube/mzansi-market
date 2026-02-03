import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateQuantitySchema = z.object({
  quantity: z.number().int().positive(),
});

// PATCH /api/cart/[itemId] - Update item quantity
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { itemId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { quantity } = updateQuantitySchema.parse(body);

    // Find the cart item and verify ownership
    const item = await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: {
        order: {
          select: { userId: true, status: true },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.order.userId !== session.user.id || item.order.status !== "CART") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update quantity
    await prisma.orderItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    // Update cart total
    const cartItems = await prisma.orderItem.findMany({
      where: { orderId: item.orderId },
    });

    const total = cartItems.reduce(
      (sum, cartItem) => sum + Number(cartItem.price) * cartItem.quantity,
      0
    );

    await prisma.order.update({
      where: { id: item.orderId },
      data: { totalAmount: total },
    });

    return NextResponse.json({
      success: true,
      message: "Quantity updated",
    });
  } catch (error) {
    console.error("Error updating cart item:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}

// DELETE /api/cart/[itemId] - Remove item from cart
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { itemId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the cart item and verify ownership
    const item = await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: {
        order: {
          select: { id: true, userId: true, status: true },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.order.userId !== session.user.id || item.order.status !== "CART") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete item
    await prisma.orderItem.delete({
      where: { id: itemId },
    });

    // Update cart total
    const cartItems = await prisma.orderItem.findMany({
      where: { orderId: item.orderId },
    });

    const total = cartItems.reduce(
      (sum, cartItem) => sum + Number(cartItem.price) * cartItem.quantity,
      0
    );

    await prisma.order.update({
      where: { id: item.orderId },
      data: { totalAmount: total },
    });

    return NextResponse.json({
      success: true,
      message: "Item removed from cart",
    });
  } catch (error) {
    console.error("Error removing cart item:", error);
    return NextResponse.json(
      { error: "Failed to remove item" },
      { status: 500 }
    );
  }
}
