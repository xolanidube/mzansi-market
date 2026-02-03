import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/validations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        userType: true,
        picture: true,
        createdAt: true,
        shop: {
          select: {
            id: true,
            name: true,
            description: true,
            address: true,
            contact: true,
            startTime: true,
            endTime: true,
            openingDays: true,
            rating: true,
            totalReviews: true,
            isApproved: true,
            profileUrl: true,
            coverUrl: true,
          },
        },
        services: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            chargeTime: true,
            picture: true,
          },
          take: 10,
        },
        reviewsReceived: {
          select: {
            id: true,
            rating: true,
            text: true,
            createdAt: true,
            sender: {
              select: {
                id: true,
                username: true,
                picture: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        _count: {
          select: {
            services: true,
            reviewsReceived: true,
            appointmentsReceived: true,
          },
        },
        isVerified: true,
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
    console.error("Get user by ID error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Users can only update their own profile
    if (session.user.id !== id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Check if username is being changed and if it's available
    if (validatedData.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: validatedData.username,
          NOT: { id },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "This username is already taken" },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(validatedData.username && { username: validatedData.username }),
        ...(validatedData.phone !== undefined && { phone: validatedData.phone }),
        ...(validatedData.gender && { gender: validatedData.gender }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        phone: true,
        gender: true,
        userType: true,
        picture: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
