import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateImageSchema = z.object({
  caption: z.string().max(200).optional(),
});

// GET /api/gallery/[id] - Get a specific gallery image
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const image = await prisma.galleryImage.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    return NextResponse.json({
      image: {
        id: image.id,
        url: image.url,
        caption: image.caption,
        order: image.order,
        createdAt: image.createdAt,
        user: image.user,
      },
    });
  } catch (error) {
    console.error("Error fetching gallery image:", error);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 }
    );
  }
}

// PATCH /api/gallery/[id] - Update a gallery image
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

    const image = await prisma.galleryImage.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    if (image.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateImageSchema.parse(body);

    const updatedImage = await prisma.galleryImage.update({
      where: { id },
      data: {
        caption: validatedData.caption,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Image updated",
      image: {
        id: updatedImage.id,
        url: updatedImage.url,
        caption: updatedImage.caption,
        order: updatedImage.order,
        createdAt: updatedImage.createdAt,
      },
    });
  } catch (error) {
    console.error("Error updating gallery image:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update image" },
      { status: 500 }
    );
  }
}

// DELETE /api/gallery/[id] - Delete a gallery image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const image = await prisma.galleryImage.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    if (image.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.galleryImage.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Image deleted from gallery",
    });
  } catch (error) {
    console.error("Error deleting gallery image:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
