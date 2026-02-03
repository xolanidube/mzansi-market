import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addImageSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  caption: z.string().max(200).optional(),
});

// GET /api/gallery - Get user's gallery images
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // If userId is provided, get that user's public gallery
    // Otherwise, get the current user's gallery
    const targetUserId = userId || session?.user?.id;

    if (!targetUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const images = await prisma.galleryImage.findMany({
      where: {
        userId: targetUserId,
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      images: images.map((img) => ({
        id: img.id,
        url: img.url,
        caption: img.caption,
        order: img.order,
        createdAt: img.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching gallery:", error);
    return NextResponse.json(
      { error: "Failed to fetch gallery" },
      { status: 500 }
    );
  }
}

// POST /api/gallery - Add image to gallery
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
        { error: "Only service providers can add gallery images" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = addImageSchema.parse(body);

    // Count existing images
    const existingCount = await prisma.galleryImage.count({
      where: {
        userId: session.user.id,
      },
    });

    if (existingCount >= 20) {
      return NextResponse.json(
        { error: "Maximum of 20 gallery images allowed" },
        { status: 400 }
      );
    }

    const image = await prisma.galleryImage.create({
      data: {
        url: validatedData.url,
        caption: validatedData.caption,
        order: existingCount,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Image added to gallery",
      image: {
        id: image.id,
        url: image.url,
        caption: image.caption,
        order: image.order,
        createdAt: image.createdAt,
      },
    });
  } catch (error) {
    console.error("Error adding gallery image:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to add image" },
      { status: 500 }
    );
  }
}

// PATCH /api/gallery - Reorder gallery images
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { imageIds } = body as { imageIds: string[] };

    if (!Array.isArray(imageIds)) {
      return NextResponse.json(
        { error: "Invalid image order data" },
        { status: 400 }
      );
    }

    // Update order for each image
    await Promise.all(
      imageIds.map((id, index) =>
        prisma.galleryImage.updateMany({
          where: {
            id,
            userId: session.user.id,
          },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: "Gallery order updated",
    });
  } catch (error) {
    console.error("Error reordering gallery:", error);
    return NextResponse.json(
      { error: "Failed to reorder gallery" },
      { status: 500 }
    );
  }
}
