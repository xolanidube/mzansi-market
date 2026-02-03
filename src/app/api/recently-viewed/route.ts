import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const trackViewSchema = z.object({
  serviceId: z.string().optional(),
  productId: z.string().optional(),
}).refine(
  (data) => data.serviceId || data.productId,
  { message: "Must provide either serviceId or productId" }
);

// GET /api/recently-viewed - Get user's recently viewed items
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "services", "products", or null for all
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (type === "services") {
      where.serviceId = { not: null };
    } else if (type === "products") {
      where.productId = { not: null };
    }

    const recentlyViewed = await prisma.recentlyViewed.findMany({
      where,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            picture: true,
            isActive: true,
            provider: {
              select: {
                id: true,
                username: true,
                picture: true,
                shop: {
                  select: {
                    id: true,
                    name: true,
                    rating: true,
                  },
                },
              },
            },
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            imageUrl: true,
            status: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { lastViewed: "desc" },
      take: limit,
    });

    // Filter out inactive items
    const activeItems = recentlyViewed.filter((item) => {
      if (item.service) return item.service.isActive;
      if (item.product) return item.product.status === "AVAILABLE";
      return false;
    });

    return NextResponse.json({
      items: activeItems.map((item) => ({
        id: item.id,
        type: item.serviceId ? "service" : "product",
        viewCount: item.viewCount,
        lastViewed: item.lastViewed,
        data: item.service || item.product,
      })),
    });
  } catch (error) {
    console.error("Error fetching recently viewed:", error);
    return NextResponse.json(
      { error: "Failed to fetch recently viewed" },
      { status: 500 }
    );
  }
}

// POST /api/recently-viewed - Track a view
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { serviceId, productId } = trackViewSchema.parse(body);

    // Validate the item exists
    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
      });
      if (!service) {
        return NextResponse.json({ error: "Service not found" }, { status: 404 });
      }
    }

    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });
      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
    }

    // Upsert the view record
    if (serviceId) {
      await prisma.recentlyViewed.upsert({
        where: {
          userId_serviceId: {
            userId: session.user.id,
            serviceId,
          },
        },
        create: {
          userId: session.user.id,
          serviceId,
          viewCount: 1,
        },
        update: {
          viewCount: { increment: 1 },
          lastViewed: new Date(),
        },
      });
    }

    if (productId) {
      await prisma.recentlyViewed.upsert({
        where: {
          userId_productId: {
            userId: session.user.id,
            productId,
          },
        },
        create: {
          userId: session.user.id,
          productId,
          viewCount: 1,
        },
        update: {
          viewCount: { increment: 1 },
          lastViewed: new Date(),
        },
      });
    }

    // Keep only last 50 recently viewed items per user
    const oldItems = await prisma.recentlyViewed.findMany({
      where: { userId: session.user.id },
      orderBy: { lastViewed: "desc" },
      skip: 50,
      select: { id: true },
    });

    if (oldItems.length > 0) {
      await prisma.recentlyViewed.deleteMany({
        where: {
          id: { in: oldItems.map((i) => i.id) },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking view:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to track view" },
      { status: 500 }
    );
  }
}

// DELETE /api/recently-viewed - Clear history
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      await prisma.recentlyViewed.deleteMany({
        where: {
          id,
          userId: session.user.id,
        },
      });
    } else {
      await prisma.recentlyViewed.deleteMany({
        where: { userId: session.user.id },
      });
    }

    return NextResponse.json({
      success: true,
      message: id ? "Item removed from history" : "Viewing history cleared",
    });
  } catch (error) {
    console.error("Error clearing recently viewed:", error);
    return NextResponse.json(
      { error: "Failed to clear history" },
      { status: 500 }
    );
  }
}
