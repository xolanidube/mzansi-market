import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const serviceSchema = z.object({
  name: z.string().min(2, "Service name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().min(0, "Price must be positive"),
  chargeTime: z.number().min(0).default(0), // 0=fixed, 1=hourly, 2=daily
  categoryId: z.string().optional(),
});

// GET /api/services - Get services with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("providerId") || searchParams.get("userId");
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    // Build filter conditions
    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (providerId) {
      where.providerId = providerId;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await prisma.service.count({ where });

    // Get services
    const services = await prisma.service.findMany({
      where,
      include: {
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
                address: true,
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
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Transform services to match expected format
    const transformedServices = services.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      price: Number(service.price),
      chargeTime: service.chargeTime === 0 ? "FIXED" : service.chargeTime === 1 ? "HOURLY" : "DAILY",
      category: service.category?.name || "Other",
      image: service.picture,
      isActive: service.isActive,
      createdAt: service.createdAt,
      user: service.provider ? {
        id: service.provider.id,
        username: service.provider.username,
        picture: service.provider.picture,
        shop: service.provider.shop ? {
          id: service.provider.shop.id,
          name: service.provider.shop.name,
          rating: service.provider.shop.rating,
          city: service.provider.shop.address,
        } : null,
      } : null,
    }));

    return NextResponse.json({
      services: transformedServices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

// POST /api/services - Create a new service
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a service provider with a shop
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { shop: true },
    });

    if (user?.userType !== "SERVICE_PROVIDER") {
      return NextResponse.json(
        { error: "Only service providers can create services" },
        { status: 403 }
      );
    }

    if (!user.shop) {
      return NextResponse.json(
        { error: "You must create a shop before adding services" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = serviceSchema.parse(body);

    const service = await prisma.service.create({
      data: {
        providerId: session.user.id,
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        chargeTime: validatedData.chargeTime,
        categoryId: validatedData.categoryId,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Service created successfully",
        service: {
          ...service,
          price: Number(service.price),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating service:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}
