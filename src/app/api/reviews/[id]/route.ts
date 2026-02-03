import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  text: z.string().optional(),
});

// GET /api/reviews/[id] - Get a specific review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            picture: true,
          },
        },
        receiver: {
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
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Error fetching review:", error);
    return NextResponse.json(
      { error: "Failed to fetch review" },
      { status: 500 }
    );
  }
}

// PATCH /api/reviews/[id] - Update a review
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

    const review = await prisma.review.findUnique({
      where: { id },
      select: { senderId: true, receiverId: true },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Only the sender can update the review
    if (review.senderId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only edit your own reviews" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateReviewSchema.parse(body);

    const updatedReview = await prisma.review.update({
      where: { id },
      data: validatedData,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            picture: true,
          },
        },
      },
    });

    // Update receiver's shop rating
    const stats = await prisma.review.aggregate({
      where: { receiverId: review.receiverId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.shop.updateMany({
      where: { userId: review.receiverId },
      data: {
        rating: stats._avg.rating ?? 0,
        totalReviews: stats._count.rating,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Review updated successfully",
      review: updatedReview,
    });
  } catch (error) {
    console.error("Error updating review:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews/[id] - Delete a review
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

    const review = await prisma.review.findUnique({
      where: { id },
      select: { senderId: true, receiverId: true },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Only the sender can delete the review
    if (review.senderId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only delete your own reviews" },
        { status: 403 }
      );
    }

    await prisma.review.delete({
      where: { id },
    });

    // Update receiver's shop rating
    const stats = await prisma.review.aggregate({
      where: { receiverId: review.receiverId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.shop.updateMany({
      where: { userId: review.receiverId },
      data: {
        rating: stats._avg.rating || 0,
        totalReviews: stats._count.rating,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
