import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const responseSchema = z.object({
  response: z.string().min(10, "Response must be at least 10 characters").max(1000, "Response must be less than 1000 characters"),
});

// POST /api/reviews/[id]/response - Add provider response to a review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: reviewId } = await params;
    const body = await request.json();
    const { response } = responseSchema.parse(body);

    // Get the review - receiver is the provider being reviewed
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Verify the current user is the review receiver (the provider being reviewed)
    if (review.receiverId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the reviewed provider can respond to this review" },
        { status: 403 }
      );
    }

    // Check if already responded
    if (review.providerResponse) {
      return NextResponse.json(
        { error: "You have already responded to this review" },
        { status: 400 }
      );
    }

    // Update the review with the response
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        providerResponse: response,
        providerResponseDate: new Date(),
      },
    });

    // Notify the reviewer
    try {
      await prisma.notification.create({
        data: {
          userId: review.senderId,
          type: "SYSTEM",
          title: "Provider responded to your review",
          message: `${review.receiver.username} has responded to your review`,
          metadata: {
            reviewId: review.id,
          },
        },
      });
    } catch (notificationError) {
      console.error("Failed to create notification:", notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      review: {
        id: updatedReview.id,
        providerResponse: updatedReview.providerResponse,
        providerResponseDate: updatedReview.providerResponseDate,
      },
    });
  } catch (error) {
    console.error("Error adding review response:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to add response" },
      { status: 500 }
    );
  }
}

// PUT /api/reviews/[id]/response - Update provider response
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: reviewId } = await params;
    const body = await request.json();
    const { response } = responseSchema.parse(body);

    // Get the review
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Verify the current user is the review receiver
    if (review.receiverId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the reviewed provider can update this response" },
        { status: 403 }
      );
    }

    // Check if there's a response to update
    if (!review.providerResponse) {
      return NextResponse.json(
        { error: "No existing response to update" },
        { status: 400 }
      );
    }

    // Update the response
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        providerResponse: response,
        providerResponseDate: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      review: {
        id: updatedReview.id,
        providerResponse: updatedReview.providerResponse,
        providerResponseDate: updatedReview.providerResponseDate,
      },
    });
  } catch (error) {
    console.error("Error updating review response:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update response" },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews/[id]/response - Delete provider response
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: reviewId } = await params;

    // Get the review
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Verify the current user is the review receiver
    if (review.receiverId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the reviewed provider can delete this response" },
        { status: 403 }
      );
    }

    // Check if there's a response to delete
    if (!review.providerResponse) {
      return NextResponse.json(
        { error: "No response to delete" },
        { status: 400 }
      );
    }

    // Remove the response
    await prisma.review.update({
      where: { id: reviewId },
      data: {
        providerResponse: null,
        providerResponseDate: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Response deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review response:", error);
    return NextResponse.json(
      { error: "Failed to delete response" },
      { status: 500 }
    );
  }
}
