import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const availabilitySchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
  isActive: z.boolean().default(true),
});

const bulkAvailabilitySchema = z.array(availabilitySchema);

// GET /api/availability - Get provider's availability
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("providerId");

    // If providerId is provided, get that provider's availability (public)
    // Otherwise, get the current user's availability
    const targetUserId = providerId || session?.user?.id;

    if (!targetUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [availability, blockedTimes] = await Promise.all([
      prisma.availability.findMany({
        where: { providerId: targetUserId },
        orderBy: { dayOfWeek: "asc" },
      }),
      // Only fetch blocked times for the current user
      providerId === session?.user?.id || !providerId
        ? prisma.blockedTime.findMany({
            where: {
              providerId: targetUserId,
              date: { gte: new Date() },
            },
            orderBy: { date: "asc" },
          })
        : [],
    ]);

    // Get day names for readability
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    return NextResponse.json({
      availability: availability.map((a) => ({
        id: a.id,
        dayOfWeek: a.dayOfWeek,
        dayName: dayNames[a.dayOfWeek],
        startTime: a.startTime,
        endTime: a.endTime,
        isActive: a.isActive,
      })),
      blockedTimes: blockedTimes.map((b) => ({
        id: b.id,
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
        reason: b.reason,
      })),
    });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}

// POST /api/availability - Set provider's availability
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a service provider
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userType: true },
    });

    if (user?.userType !== "SERVICE_PROVIDER") {
      return NextResponse.json(
        { error: "Only service providers can set availability" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Check if it's a bulk update or single
    if (Array.isArray(body)) {
      const validatedData = bulkAvailabilitySchema.parse(body);

      // Delete existing availability and create new
      await prisma.availability.deleteMany({
        where: { providerId: session.user.id },
      });

      const created = await prisma.availability.createMany({
        data: validatedData.map((a) => ({
          ...a,
          providerId: session.user.id,
        })),
      });

      return NextResponse.json({
        success: true,
        message: `${created.count} availability slots created`,
      });
    } else {
      const validatedData = availabilitySchema.parse(body);

      // Upsert single availability slot
      const availability = await prisma.availability.upsert({
        where: {
          providerId_dayOfWeek: {
            providerId: session.user.id,
            dayOfWeek: validatedData.dayOfWeek,
          },
        },
        update: {
          startTime: validatedData.startTime,
          endTime: validatedData.endTime,
          isActive: validatedData.isActive,
        },
        create: {
          providerId: session.user.id,
          dayOfWeek: validatedData.dayOfWeek,
          startTime: validatedData.startTime,
          endTime: validatedData.endTime,
          isActive: validatedData.isActive,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Availability updated",
        availability,
      });
    }
  } catch (error) {
    console.error("Error setting availability:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to set availability" },
      { status: 500 }
    );
  }
}

// DELETE /api/availability - Delete availability slot
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const dayOfWeek = searchParams.get("dayOfWeek");

    if (id) {
      await prisma.availability.deleteMany({
        where: {
          id,
          providerId: session.user.id,
        },
      });
    } else if (dayOfWeek !== null) {
      await prisma.availability.deleteMany({
        where: {
          providerId: session.user.id,
          dayOfWeek: parseInt(dayOfWeek),
        },
      });
    } else {
      return NextResponse.json(
        { error: "No availability slot specified" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Availability deleted",
    });
  } catch (error) {
    console.error("Error deleting availability:", error);
    return NextResponse.json(
      { error: "Failed to delete availability" },
      { status: 500 }
    );
  }
}
