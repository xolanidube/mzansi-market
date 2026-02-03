import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { RecurringPattern } from "@prisma/client";

const createRecurringSchema = z.object({
  serviceId: z.string(),
  providerId: z.string(),
  pattern: z.nativeEnum(RecurringPattern),
  frequency: z.number().int().min(1).max(4).default(1),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  startDate: z.string().transform((s) => new Date(s)),
  endDate: z.string().transform((s) => new Date(s)).optional(),
  occurrences: z.number().int().min(1).max(52).optional(),
  address: z.string().optional(),
  note: z.string().optional(),
});

// Helper to generate appointment dates
function generateAppointmentDates(
  pattern: RecurringPattern,
  frequency: number,
  startDate: Date,
  endDate: Date | null,
  occurrences: number | null,
  dayOfWeek: number | null,
  dayOfMonth: number | null
): Date[] {
  const dates: Date[] = [];
  const maxOccurrences = occurrences || 52; // Max 1 year of weekly appointments
  const maxEndDate = endDate || new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);

  let currentDate = new Date(startDate);

  while (dates.length < maxOccurrences && currentDate <= maxEndDate) {
    // Check if this date matches the pattern
    let matches = false;

    switch (pattern) {
      case "WEEKLY":
        if (dayOfWeek !== null && currentDate.getDay() === dayOfWeek) {
          matches = true;
        } else if (dayOfWeek === null) {
          matches = true;
        }
        break;

      case "BIWEEKLY":
        if (dayOfWeek !== null && currentDate.getDay() === dayOfWeek) {
          const weeksDiff = Math.floor(
            (currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
          );
          if (weeksDiff % 2 === 0) {
            matches = true;
          }
        }
        break;

      case "MONTHLY":
        if (dayOfMonth !== null && currentDate.getDate() === dayOfMonth) {
          matches = true;
        } else if (dayOfMonth === null && currentDate.getDate() === startDate.getDate()) {
          matches = true;
        }
        break;

      case "CUSTOM":
        // For custom, just use the frequency in weeks
        const weeksDiff = Math.floor(
          (currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
        );
        if (weeksDiff % frequency === 0 && currentDate.getDay() === startDate.getDay()) {
          matches = true;
        }
        break;
    }

    if (matches && currentDate >= startDate) {
      dates.push(new Date(currentDate));
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

// GET /api/appointments/recurring - Get user's recurring appointments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role"); // "customer" or "provider"

    const where: Record<string, unknown> = {};

    if (role === "provider") {
      where.providerId = session.user.id;
    } else {
      where.requesterId = session.user.id;
    }

    const recurring = await prisma.recurringAppointment.findMany({
      where,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        requester: {
          select: {
            id: true,
            username: true,
            picture: true,
          },
        },
        provider: {
          select: {
            id: true,
            username: true,
            picture: true,
            shop: {
              select: {
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            appointments: true,
          },
        },
        appointments: {
          where: {
            date: { gte: new Date() },
          },
          orderBy: { date: "asc" },
          take: 3,
          select: {
            id: true,
            date: true,
            time: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      recurring: recurring.map((r) => ({
        id: r.id,
        pattern: r.pattern,
        frequency: r.frequency,
        dayOfWeek: r.dayOfWeek,
        dayOfMonth: r.dayOfMonth,
        time: r.time,
        startDate: r.startDate,
        endDate: r.endDate,
        occurrences: r.occurrences,
        isActive: r.isActive,
        service: r.service,
        requester: r.requester,
        provider: {
          ...r.provider,
          shopName: r.provider.shop?.name,
        },
        totalAppointments: r._count.appointments,
        upcomingAppointments: r.appointments,
      })),
    });
  } catch (error) {
    console.error("Error fetching recurring appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch recurring appointments" },
      { status: 500 }
    );
  }
}

// POST /api/appointments/recurring - Create recurring appointment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createRecurringSchema.parse(body);

    // Verify service and provider
    const service = await prisma.service.findUnique({
      where: { id: data.serviceId, isActive: true },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found or inactive" },
        { status: 404 }
      );
    }

    const provider = await prisma.user.findUnique({
      where: { id: data.providerId, userType: "SERVICE_PROVIDER" },
    });

    if (!provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    // Create the recurring appointment
    const recurring = await prisma.recurringAppointment.create({
      data: {
        requesterId: session.user.id,
        providerId: data.providerId,
        serviceId: data.serviceId,
        pattern: data.pattern,
        frequency: data.frequency,
        dayOfWeek: data.dayOfWeek,
        dayOfMonth: data.dayOfMonth,
        time: data.time,
        startDate: data.startDate,
        endDate: data.endDate,
        occurrences: data.occurrences,
      },
    });

    // Generate the first batch of appointments (next 4 weeks or up to occurrences)
    const appointmentDates = generateAppointmentDates(
      data.pattern,
      data.frequency,
      data.startDate,
      data.endDate || null,
      Math.min(data.occurrences || 4, 4), // Create max 4 appointments initially
      data.dayOfWeek || null,
      data.dayOfMonth || null
    );

    const appointments = await Promise.all(
      appointmentDates.map((date) =>
        prisma.appointment.create({
          data: {
            requesterId: session.user.id,
            providerId: data.providerId,
            serviceId: data.serviceId,
            date,
            time: data.time,
            address: data.address,
            note: data.note,
            status: "PENDING",
            recurringAppointmentId: recurring.id,
          },
        })
      )
    );

    // Notify the provider
    await prisma.notification.create({
      data: {
        userId: data.providerId,
        type: "BOOKING_NEW",
        title: "New Recurring Booking",
        message: `You have a new ${data.pattern.toLowerCase()} recurring booking for ${service.name}`,
        metadata: {
          recurringId: recurring.id,
          appointmentCount: appointments.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      recurringId: recurring.id,
      appointmentsCreated: appointments.length,
      appointments: appointments.map((a) => ({
        id: a.id,
        date: a.date,
        time: a.time,
        status: a.status,
      })),
    });
  } catch (error) {
    console.error("Error creating recurring appointment:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create recurring appointment" },
      { status: 500 }
    );
  }
}

// PATCH /api/appointments/recurring - Update recurring appointment
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const action = searchParams.get("action"); // "pause", "resume", "cancel"

    if (!id) {
      return NextResponse.json(
        { error: "Recurring appointment ID is required" },
        { status: 400 }
      );
    }

    const recurring = await prisma.recurringAppointment.findFirst({
      where: {
        id,
        OR: [
          { requesterId: session.user.id },
          { providerId: session.user.id },
        ],
      },
    });

    if (!recurring) {
      return NextResponse.json(
        { error: "Recurring appointment not found" },
        { status: 404 }
      );
    }

    if (action === "pause") {
      await prisma.recurringAppointment.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        success: true,
        message: "Recurring appointment paused",
      });
    }

    if (action === "resume") {
      await prisma.recurringAppointment.update({
        where: { id },
        data: { isActive: true },
      });

      return NextResponse.json({
        success: true,
        message: "Recurring appointment resumed",
      });
    }

    if (action === "cancel") {
      // Cancel all future appointments
      await prisma.appointment.updateMany({
        where: {
          recurringAppointmentId: id,
          date: { gte: new Date() },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        data: {
          status: "CANCELLED",
        },
      });

      // Deactivate the recurring appointment
      await prisma.recurringAppointment.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        success: true,
        message: "Recurring appointment cancelled",
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'pause', 'resume', or 'cancel'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating recurring appointment:", error);
    return NextResponse.json(
      { error: "Failed to update recurring appointment" },
      { status: 500 }
    );
  }
}
