import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const shopSchema = z.object({
  name: z.string().min(2, "Shop name must be at least 2 characters"),
  description: z.string().optional(),
  address: z.string().optional(),
  contact: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  openingDays: z.array(z.string()).optional(),
  registrationDocument: z.string().optional(),
  tax: z.string().optional(),
});

// GET /api/shops - Get all approved shops or current user's shop
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const search = searchParams.get("search");
    const city = searchParams.get("city");
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    // If userId is provided, get that user's shop
    if (userId) {
      const shop = await prisma.shop.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              picture: true,
            },
          },
        },
      });

      if (!shop) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
      }

      // Get service count
      const serviceCount = await prisma.service.count({
        where: { providerId: userId, isActive: true },
      });

      // Transform to expected format
      const transformedShop = {
        id: shop.id,
        name: shop.name,
        description: shop.description,
        address: shop.address,
        city: shop.address,
        phone: shop.contact,
        openingHours: shop.startTime,
        closingHours: shop.endTime,
        workingDays: shop.openingDays?.join(", "),
        rating: shop.rating,
        reviewCount: shop.totalReviews,
        isApproved: shop.isApproved,
        isFeatured: false,
        coverImage: shop.coverUrl,
        logo: shop.profileUrl,
        user: shop.user,
        _count: {
          services: serviceCount,
        },
      };

      return NextResponse.json({ shop: transformedShop });
    }

    // Build filter conditions for public listing
    const where: Record<string, unknown> = {
      isApproved: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    if (city) {
      where.address = { contains: city, mode: "insensitive" };
    }

    // If category is specified, find shops that have services in that category
    if (category) {
      const shopsWithCategory = await prisma.service.findMany({
        where: {
          isActive: true,
          category: {
            name: { contains: category, mode: "insensitive" },
          },
        },
        select: {
          providerId: true,
        },
        distinct: ["providerId"],
      });

      const providerIds = shopsWithCategory.map(s => s.providerId);

      if (providerIds.length > 0) {
        where.userId = { in: providerIds };
      } else {
        // No shops found with this category
        return NextResponse.json({
          shops: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        });
      }
    }

    // Get total count
    const total = await prisma.shop.count({ where });

    // Get shops
    const shops = await prisma.shop.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            picture: true,
          },
        },
      },
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get service counts for all shops
    const shopIds = shops.map(s => s.userId);
    const serviceCounts = await prisma.service.groupBy({
      by: ["providerId"],
      where: { providerId: { in: shopIds }, isActive: true },
      _count: { id: true },
    });

    const serviceCountMap = new Map(
      serviceCounts.map(sc => [sc.providerId, sc._count.id])
    );

    // Transform shops to expected format
    const transformedShops = shops.map((shop) => ({
      id: shop.id,
      name: shop.name,
      description: shop.description,
      city: shop.address,
      rating: shop.rating,
      reviewCount: shop.totalReviews,
      coverImage: shop.coverUrl,
      logo: shop.profileUrl,
      openingHours: shop.startTime,
      closingHours: shop.endTime,
      user: shop.user,
      _count: {
        services: serviceCountMap.get(shop.userId) || 0,
      },
    }));

    return NextResponse.json({
      shops: transformedShops,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching shops:", error);
    return NextResponse.json(
      { error: "Failed to fetch shops" },
      { status: 500 }
    );
  }
}

// POST /api/shops - Create or update shop
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a service provider
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userType: true },
    });

    if (user?.userType !== "SERVICE_PROVIDER") {
      return NextResponse.json(
        { error: "Only service providers can create shops" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = shopSchema.parse(body);

    // Check if user already has a shop
    const existingShop = await prisma.shop.findUnique({
      where: { userId: session.user.id },
    });

    if (existingShop) {
      // Update existing shop
      const shop = await prisma.shop.update({
        where: { userId: session.user.id },
        data: validatedData,
      });

      return NextResponse.json({
        success: true,
        message: "Shop updated successfully",
        shop,
      });
    }

    // Create new shop
    const shop = await prisma.shop.create({
      data: {
        userId: session.user.id,
        ...validatedData,
        isApproved: false,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Shop created successfully",
        shop,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating/updating shop:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create/update shop" },
      { status: 500 }
    );
  }
}
