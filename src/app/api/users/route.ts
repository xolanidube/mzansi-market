import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get current user's profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        phone: true,
        gender: true,
        userType: true,
        picture: true,
        uniqueKey: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        shop: {
          select: {
            id: true,
            name: true,
            description: true,
            address: true,
            rating: true,
            totalReviews: true,
            isApproved: true,
            profileUrl: true,
            coverUrl: true,
          },
        },
        wallet: {
          select: {
            id: true,
            balance: true,
            currency: true,
          },
        },
        _count: {
          select: {
            services: true,
            jobsPosted: true,
            appointmentsBooked: true,
            appointmentsReceived: true,
            reviewsReceived: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
