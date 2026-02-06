import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const updateShopSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  contact: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  openingDays: z.array(z.string()).optional(),
  profileUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  registrationDocument: z.string().optional(),
  tax: z.string().optional(),
});

// GET /api/shops/[id] - Get a specific shop
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const shop = await prisma.shop.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            picture: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: shop.id,
      name: shop.name,
      description: shop.description,
      address: shop.address,
      contact: shop.contact,
      startTime: shop.startTime,
      endTime: shop.endTime,
      openingDays: shop.openingDays,
      rating: shop.rating,
      totalReviews: shop.totalReviews,
      profileUrl: shop.profileUrl,
      coverUrl: shop.coverUrl,
      registrationDocument: shop.registrationDocument,
      tax: shop.tax,
      isApproved: shop.isApproved,
      user: shop.user,
      createdAt: shop.createdAt,
    });
  } catch (error) {
    console.error("Error fetching shop:", error);
    return NextResponse.json(
      { error: "Failed to fetch shop" },
      { status: 500 }
    );
  }
}

// PATCH /api/shops/[id] - Update a shop
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shop = await prisma.shop.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    if (shop.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to edit this shop" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateShopSchema.parse(body);

    const updatedShop = await prisma.shop.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      message: "Shop updated successfully",
      shop: updatedShop,
    });
  } catch (error) {
    console.error("Error updating shop:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update shop" },
      { status: 500 }
    );
  }
}
