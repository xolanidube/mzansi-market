import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const actionSchema = z.object({
  userId: z.string(),
  action: z.enum(["activate", "deactivate", "verify", "makeAdmin", "removeAdmin"]),
});

// GET /api/admin/users - Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userType: true },
    });

    if (admin?.userType !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const userType = searchParams.get("userType");

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (userType) {
      where.userType = userType;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          phone: true,
          userType: true,
          isVerified: true,
          isActive: true,
          picture: true,
          createdAt: true,
          _count: {
            select: {
              services: true,
              appointmentsBooked: true,
              appointmentsReceived: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users - Update user status/role
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userType: true },
    });

    if (admin?.userType !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, action } = actionSchema.parse(body);

    // Find the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, userType: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent self-modification for certain actions
    if (userId === session.user.id && ["deactivate", "removeAdmin"].includes(action)) {
      return NextResponse.json(
        { error: "You cannot perform this action on yourself" },
        { status: 400 }
      );
    }

    let updateData: Record<string, unknown> = {};
    let message = "";

    switch (action) {
      case "activate":
        updateData = { isActive: true };
        message = "User activated successfully";
        break;

      case "deactivate":
        updateData = { isActive: false };
        message = "User deactivated successfully";
        break;

      case "verify":
        updateData = { isVerified: true };
        message = "User verified successfully";
        break;

      case "makeAdmin":
        if (targetUser.userType === "ADMIN") {
          return NextResponse.json(
            { error: "User is already an admin" },
            { status: 400 }
          );
        }
        updateData = { userType: "ADMIN" };
        message = "User promoted to admin";
        break;

      case "removeAdmin":
        if (targetUser.userType !== "ADMIN") {
          return NextResponse.json(
            { error: "User is not an admin" },
            { status: 400 }
          );
        }
        updateData = { userType: "CLIENT" };
        message = "Admin privileges removed";
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Create notification for the user
    await prisma.notification.create({
      data: {
        userId,
        type: "SYSTEM",
        title: "Account Update",
        message: `Your account has been ${action === "activate" ? "activated" : action === "deactivate" ? "deactivated" : action === "verify" ? "verified" : action === "makeAdmin" ? "upgraded to admin" : "updated"}.`,
      },
    });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Error updating user:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
