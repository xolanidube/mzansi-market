import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const saveServiceSchema = z.object({
  serviceId: z.string(),
});

// GET /api/saved-services - Get user's saved services
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const [savedServices, total] = await Promise.all([
      prisma.savedService.findMany({
        where: { userId: session.user.id },
        include: {
          service: {
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
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.savedService.count({ where: { userId: session.user.id } }),
    ]);

    return NextResponse.json({
      savedServices: savedServices.map((s) => ({
        id: s.id,
        savedAt: s.createdAt,
        service: {
          id: s.service.id,
          name: s.service.name,
          description: s.service.description,
          price: Number(s.service.price),
          chargeTime: s.service.chargeTime,
          picture: s.service.picture,
          provider: {
            id: s.service.provider.id,
            name: s.service.provider.username,
            picture: s.service.provider.picture,
            shop: s.service.provider.shop,
          },
          category: s.service.category,
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching saved services:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved services" },
      { status: 500 }
    );
  }
}

// POST /api/saved-services - Save a service
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { serviceId } = saveServiceSchema.parse(body);

    // Check if service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Check if already saved
    const existing = await prisma.savedService.findUnique({
      where: {
        userId_serviceId: {
          userId: session.user.id,
          serviceId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Service already saved" },
        { status: 400 }
      );
    }

    const saved = await prisma.savedService.create({
      data: {
        userId: session.user.id,
        serviceId,
      },
    });

    return NextResponse.json({
      success: true,
      id: saved.id,
      message: "Service saved successfully",
    });
  } catch (error) {
    console.error("Error saving service:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to save service" },
      { status: 500 }
    );
  }
}

// DELETE /api/saved-services - Unsave a service
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");

    if (!serviceId) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      );
    }

    const deleted = await prisma.savedService.deleteMany({
      where: {
        userId: session.user.id,
        serviceId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "Saved service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Service unsaved successfully",
    });
  } catch (error) {
    console.error("Error unsaving service:", error);
    return NextResponse.json(
      { error: "Failed to unsave service" },
      { status: 500 }
    );
  }
}
