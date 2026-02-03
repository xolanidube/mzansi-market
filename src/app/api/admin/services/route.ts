import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const actionSchema = z.object({
  serviceId: z.string(),
  action: z.enum(["approve", "reject", "activate", "deactivate"]),
  reason: z.string().optional(),
});

// GET /api/admin/services - Get all services (admin only)
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
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status === "pending") {
      where.isActive = false;
    } else if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          isActive: true,
          createdAt: true,
          provider: {
            select: {
              id: true,
              username: true,
              email: true,
              picture: true,
              shop: {
                select: { name: true },
              },
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: { appointments: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.service.count({ where }),
    ]);

    return NextResponse.json({
      services: services.map((s) => ({
        ...s,
        price: Number(s.price),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/services - Update service status
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
    const { serviceId, action, reason } = actionSchema.parse(body);

    // Find the service
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        provider: {
          select: { id: true, email: true, username: true },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    let updateData: Record<string, unknown> = {};
    let notificationTitle = "";
    let notificationMessage = "";

    switch (action) {
      case "approve":
        updateData = { isActive: true };
        notificationTitle = "Service Approved";
        notificationMessage = `Your service "${service.name}" has been approved and is now live.`;
        break;

      case "reject":
        // Delete the service on rejection
        await prisma.service.delete({ where: { id: serviceId } });

        // Notify provider
        await prisma.notification.create({
          data: {
            userId: service.provider.id,
            type: "SYSTEM",
            title: "Service Rejected",
            message: `Your service "${service.name}" was not approved.${reason ? ` Reason: ${reason}` : ""}`,
          },
        });

        return NextResponse.json({
          success: true,
          message: "Service rejected and removed",
        });

      case "activate":
        updateData = { isActive: true };
        notificationTitle = "Service Reactivated";
        notificationMessage = `Your service "${service.name}" has been reactivated.`;
        break;

      case "deactivate":
        updateData = { isActive: false };
        notificationTitle = "Service Deactivated";
        notificationMessage = `Your service "${service.name}" has been deactivated by an administrator.${reason ? ` Reason: ${reason}` : ""}`;
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await prisma.service.update({
      where: { id: serviceId },
      data: updateData,
    });

    // Notify the provider
    await prisma.notification.create({
      data: {
        userId: service.provider.id,
        type: "SYSTEM",
        title: notificationTitle,
        message: notificationMessage,
      },
    });

    // Send email notification
    if (service.provider.email) {
      const { sendEmail } = await import("@/lib/email");
      await sendEmail(
        service.provider.email,
        notificationTitle,
        `
        <h2>${notificationTitle}</h2>
        <p>Hi ${service.provider.username},</p>
        <p>${notificationMessage}</p>
        <p>Best regards,<br>Mzansi Market Team</p>
        `
      );
    }

    return NextResponse.json({
      success: true,
      message: `Service ${action}d successfully`,
    });
  } catch (error) {
    console.error("Error updating service:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}
