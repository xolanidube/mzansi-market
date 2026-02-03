import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const saveProviderSchema = z.object({
  providerId: z.string(),
});

// GET /api/saved-providers - Get user's saved providers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const [savedProviders, total] = await Promise.all([
      prisma.savedProvider.findMany({
        where: { userId: session.user.id },
        include: {
          provider: {
            select: {
              id: true,
              username: true,
              email: true,
              picture: true,
              isVerified: true,
              shop: {
                select: {
                  id: true,
                  name: true,
                  profileUrl: true,
                  rating: true,
                  totalReviews: true,
                },
              },
              _count: {
                select: {
                  services: true,
                  reviewsReceived: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.savedProvider.count({ where: { userId: session.user.id } }),
    ]);

    return NextResponse.json({
      savedProviders: savedProviders.map((s) => ({
        id: s.id,
        savedAt: s.createdAt,
        provider: {
          id: s.provider.id,
          name: s.provider.username,
          email: s.provider.email,
          picture: s.provider.picture,
          isVerified: s.provider.isVerified,
          shop: s.provider.shop
            ? {
                ...s.provider.shop,
                rating: s.provider.shop.rating
                  ? Number(s.provider.shop.rating)
                  : null,
              }
            : null,
          serviceCount: s.provider._count.services,
          reviewCount: s.provider._count.reviewsReceived,
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
    console.error("Error fetching saved providers:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved providers" },
      { status: 500 }
    );
  }
}

// POST /api/saved-providers - Save a provider
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { providerId } = saveProviderSchema.parse(body);

    // Can't save yourself
    if (providerId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot save yourself as a provider" },
        { status: 400 }
      );
    }

    // Check if provider exists and is a provider
    const provider = await prisma.user.findFirst({
      where: {
        id: providerId,
        userType: "SERVICE_PROVIDER",
      },
    });

    if (!provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    // Check if already saved
    const existing = await prisma.savedProvider.findUnique({
      where: {
        userId_providerId: {
          userId: session.user.id,
          providerId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Provider already saved" },
        { status: 400 }
      );
    }

    const saved = await prisma.savedProvider.create({
      data: {
        userId: session.user.id,
        providerId,
      },
    });

    return NextResponse.json({
      success: true,
      id: saved.id,
      message: "Provider saved successfully",
    });
  } catch (error) {
    console.error("Error saving provider:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to save provider" },
      { status: 500 }
    );
  }
}

// DELETE /api/saved-providers - Unsave a provider
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("providerId");

    if (!providerId) {
      return NextResponse.json(
        { error: "Provider ID is required" },
        { status: 400 }
      );
    }

    const deleted = await prisma.savedProvider.deleteMany({
      where: {
        userId: session.user.id,
        providerId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "Saved provider not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Provider unsaved successfully",
    });
  } catch (error) {
    console.error("Error unsaving provider:", error);
    return NextResponse.json(
      { error: "Failed to unsave provider" },
      { status: 500 }
    );
  }
}
