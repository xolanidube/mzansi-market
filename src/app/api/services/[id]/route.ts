import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const updateServiceSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  price: z.number().min(0).optional(),
  chargeTime: z.number().min(0).optional(),
  categoryId: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/services/[id] - Get a specific service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        provider: {
          select: {
            id: true,
            username: true,
            picture: true,
            phone: true,
            shop: {
              select: {
                id: true,
                name: true,
                description: true,
                address: true,
                rating: true,
                totalReviews: true,
                startTime: true,
                endTime: true,
                openingDays: true,
                isApproved: true,
              },
            },
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Get related services from same provider
    const relatedServices = await prisma.service.findMany({
      where: {
        providerId: service.providerId,
        id: { not: service.id },
        isActive: true,
      },
      take: 4,
    });

    // Get reviews for the provider
    const reviews = await prisma.review.findMany({
      where: { receiverId: service.providerId },
      include: {
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
    });

    // Transform service to expected format
    const transformedService = {
      id: service.id,
      name: service.name,
      description: service.description,
      price: Number(service.price),
      chargeTime: service.chargeTime === 0 ? "FIXED" : service.chargeTime === 1 ? "HOURLY" : "DAILY",
      category: service.category?.name || "Other",
      image: service.picture,
      isActive: service.isActive,
      userId: service.providerId,
      tags: [],
      user: service.provider ? {
        id: service.provider.id,
        username: service.provider.username,
        picture: service.provider.picture,
        phone: service.provider.phone,
        shop: service.provider.shop ? {
          id: service.provider.shop.id,
          name: service.provider.shop.name,
          description: service.provider.shop.description,
          city: service.provider.shop.address,
          rating: service.provider.shop.rating,
          reviewCount: service.provider.shop.totalReviews,
          openingHours: service.provider.shop.startTime,
          closingHours: service.provider.shop.endTime,
          workingDays: service.provider.shop.openingDays?.join(", "),
          isApproved: service.provider.shop.isApproved,
        } : null,
      } : null,
    };

    return NextResponse.json({
      service: transformedService,
      relatedServices: relatedServices.map(s => ({
        ...s,
        price: Number(s.price),
      })),
      reviews,
    });
  } catch (error) {
    console.error("Error fetching service:", error);
    return NextResponse.json(
      { error: "Failed to fetch service" },
      { status: 500 }
    );
  }
}

// PATCH /api/services/[id] - Update a service
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

    // Check if service belongs to user
    const service = await prisma.service.findUnique({
      where: { id },
      select: { providerId: true },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    if (service.providerId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only update your own services" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateServiceSchema.parse(body);

    const updatedService = await prisma.service.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      message: "Service updated successfully",
      service: {
        ...updatedService,
        price: Number(updatedService.price),
      },
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

// DELETE /api/services/[id] - Delete a service
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

    // Check if service belongs to user
    const service = await prisma.service.findUnique({
      where: { id },
      select: { providerId: true },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    if (service.providerId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only delete your own services" },
        { status: 403 }
      );
    }

    // Check for active appointments
    const activeAppointments = await prisma.appointment.count({
      where: {
        serviceId: id,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });

    if (activeAppointments > 0) {
      return NextResponse.json(
        { error: "Cannot delete service with active appointments" },
        { status: 400 }
      );
    }

    // Soft delete - deactivate the service
    await prisma.service.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
