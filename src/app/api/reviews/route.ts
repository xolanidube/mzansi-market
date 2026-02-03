import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const reviewSchema = z.object({
  receiverId: z.string().min(1, "Receiver is required"),
  rating: z.number().min(1).max(5),
  text: z.string().optional(),
});

// GET /api/reviews - Get reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const receiverId = searchParams.get("receiverId");
    const senderId = searchParams.get("senderId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Build filter conditions
    const where: Record<string, unknown> = {};

    if (receiverId) {
      where.receiverId = receiverId;
    }

    if (senderId) {
      where.senderId = senderId;
    }

    // Get total count
    const total = await prisma.review.count({ where });

    // Get reviews
    const reviews = await prisma.review.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate average rating if filtering by receiverId
    let averageRating = null;
    let ratingCounts = null;

    if (receiverId) {
      const stats = await prisma.review.aggregate({
        where: { receiverId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      averageRating = stats._avg.rating;

      // Get rating distribution
      const distribution = await prisma.review.groupBy({
        by: ["rating"],
        where: { receiverId },
        _count: { rating: true },
      });

      ratingCounts = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };

      for (const item of distribution) {
        ratingCounts[item.rating as keyof typeof ratingCounts] = item._count.rating;
      }
    }

    return NextResponse.json({
      reviews,
      stats: receiverId
        ? {
            averageRating,
            totalReviews: total,
            ratingCounts,
          }
        : null,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Create a new review
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = reviewSchema.parse(body);

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: validatedData.receiverId },
      select: { id: true, username: true, userType: true },
    });

    if (!receiver) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Can't review yourself
    if (validatedData.receiverId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot review yourself" },
        { status: 400 }
      );
    }

    // Check if user already reviewed this person
    const existingReview = await prisma.review.findFirst({
      where: {
        senderId: session.user.id,
        receiverId: validatedData.receiverId,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this user" },
        { status: 400 }
      );
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        senderId: session.user.id,
        receiverId: validatedData.receiverId,
        rating: validatedData.rating,
        text: validatedData.text,
      },
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

    // Update receiver's shop rating if they are a service provider
    if (receiver.userType === "SERVICE_PROVIDER") {
      const stats = await prisma.review.aggregate({
        where: { receiverId: validatedData.receiverId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await prisma.shop.updateMany({
        where: { userId: validatedData.receiverId },
        data: {
          rating: stats._avg.rating ?? 0,
          totalReviews: stats._count.rating,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Review submitted successfully",
        review,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating review:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
