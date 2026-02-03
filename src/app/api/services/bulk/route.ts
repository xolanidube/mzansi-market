import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bulkUpdateSchema = z.object({
  serviceIds: z.array(z.string()).min(1).max(50),
  updates: z.object({
    isActive: z.boolean().optional(),
    categoryId: z.string().optional(),
    priceAdjustment: z.object({
      type: z.enum(["fixed", "percentage"]),
      value: z.number(),
    }).optional(),
  }),
});

const bulkDeactivateSchema = z.object({
  serviceIds: z.array(z.string()).min(1).max(50),
});

// PATCH /api/services/bulk - Bulk update services
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { serviceIds, updates } = bulkUpdateSchema.parse(body);

    // Verify all services belong to the user
    const services = await prisma.service.findMany({
      where: {
        id: { in: serviceIds },
        providerId: session.user.id,
      },
    });

    if (services.length !== serviceIds.length) {
      return NextResponse.json(
        { error: "Some services not found or don't belong to you" },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (updates.isActive !== undefined) {
      updateData.isActive = updates.isActive;
    }

    if (updates.categoryId) {
      // Verify category exists
      const category = await prisma.category.findUnique({
        where: { id: updates.categoryId },
      });
      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }
      updateData.categoryId = updates.categoryId;
    }

    // Handle price adjustment
    if (updates.priceAdjustment) {
      const { type, value } = updates.priceAdjustment;

      // Update each service individually for price adjustments
      const results = await Promise.all(
        services.map(async (service) => {
          let newPrice: number;

          if (type === "fixed") {
            newPrice = Number(service.price) + value;
          } else {
            // Percentage adjustment
            newPrice = Number(service.price) * (1 + value / 100);
          }

          // Ensure price is not negative
          newPrice = Math.max(0, Math.round(newPrice * 100) / 100);

          return prisma.service.update({
            where: { id: service.id },
            data: {
              ...updateData,
              price: newPrice,
            },
          });
        })
      );

      return NextResponse.json({
        success: true,
        updated: results.length,
        message: `${results.length} services updated`,
      });
    }

    // Bulk update without price adjustment
    const result = await prisma.service.updateMany({
      where: {
        id: { in: serviceIds },
        providerId: session.user.id,
      },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
      message: `${result.count} services updated`,
    });
  } catch (error) {
    console.error("Error bulk updating services:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update services" },
      { status: 500 }
    );
  }
}

// POST /api/services/bulk - Bulk deactivate services
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action;

    if (action === "deactivate") {
      const { serviceIds } = bulkDeactivateSchema.parse(body);

      const result = await prisma.service.updateMany({
        where: {
          id: { in: serviceIds },
          providerId: session.user.id,
        },
        data: {
          isActive: false,
        },
      });

      return NextResponse.json({
        success: true,
        deactivated: result.count,
        message: `${result.count} services deactivated`,
      });
    }

    if (action === "activate") {
      const { serviceIds } = bulkDeactivateSchema.parse(body);

      const result = await prisma.service.updateMany({
        where: {
          id: { in: serviceIds },
          providerId: session.user.id,
        },
        data: {
          isActive: true,
        },
      });

      return NextResponse.json({
        success: true,
        activated: result.count,
        message: `${result.count} services activated`,
      });
    }

    if (action === "delete") {
      const { serviceIds } = bulkDeactivateSchema.parse(body);

      // Check for active appointments before deletion
      const servicesWithAppointments = await prisma.service.findMany({
        where: {
          id: { in: serviceIds },
          providerId: session.user.id,
          appointments: {
            some: {
              status: { in: ["PENDING", "CONFIRMED"] },
            },
          },
        },
        select: { id: true, name: true },
      });

      if (servicesWithAppointments.length > 0) {
        return NextResponse.json(
          {
            error: "Cannot delete services with pending appointments",
            servicesWithAppointments,
          },
          { status: 400 }
        );
      }

      const result = await prisma.service.deleteMany({
        where: {
          id: { in: serviceIds },
          providerId: session.user.id,
        },
      });

      return NextResponse.json({
        success: true,
        deleted: result.count,
        message: `${result.count} services deleted`,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'deactivate', 'activate', or 'delete'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error bulk action on services:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to perform bulk action" },
      { status: 500 }
    );
  }
}
