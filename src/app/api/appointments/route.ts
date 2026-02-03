import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { sendBookingConfirmation, sendNewBookingNotification } from "@/lib/email";

const appointmentSchema = z.object({
  serviceId: z.string().min(1, "Service is required"),
  providerId: z.string().min(1, "Provider is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  notes: z.string().optional(),
  address: z.string().optional(),
});

// GET /api/appointments - Get appointments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role"); // "client" or "provider"
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Build filter conditions
    const where: Record<string, unknown> = {};

    // Filter by role
    if (role === "provider") {
      where.providerId = session.user.id;
    } else {
      where.requesterId = session.user.id;
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Get total count
    const total = await prisma.appointment.count({ where });

    // Get appointments
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            chargeTime: true,
          },
        },
        requester: {
          select: {
            id: true,
            username: true,
            picture: true,
            phone: true,
            email: true,
          },
        },
        provider: {
          select: {
            id: true,
            username: true,
            picture: true,
            phone: true,
            email: true,
            shop: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
        },
      },
      orderBy: [{ date: "asc" }, { time: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Transform appointments
    const transformedAppointments = appointments.map((apt) => ({
      id: apt.id,
      date: apt.date,
      time: apt.time,
      status: apt.status,
      notes: apt.note,
      address: apt.address,
      createdAt: apt.createdAt,
      service: apt.service
        ? {
            id: apt.service.id,
            name: apt.service.name,
            price: apt.service.price ? Number(apt.service.price) : null,
            chargeTime: apt.service.chargeTime,
          }
        : null,
      requester: apt.requester,
      provider: apt.provider,
    }));

    return NextResponse.json({
      appointments: transformedAppointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

// POST /api/appointments - Create a new appointment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = appointmentSchema.parse(body);

    // Verify service exists and belongs to provider
    const service = await prisma.service.findUnique({
      where: { id: validatedData.serviceId },
      select: { id: true, providerId: true, name: true },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    if (service.providerId !== validatedData.providerId) {
      return NextResponse.json(
        { error: "Service does not belong to this provider" },
        { status: 400 }
      );
    }

    // Check if user is trying to book their own service
    if (validatedData.providerId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot book your own service" },
        { status: 400 }
      );
    }

    // Check for conflicting appointments
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        providerId: validatedData.providerId,
        date: new Date(validatedData.date),
        time: validatedData.time,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });

    if (existingAppointment) {
      return NextResponse.json(
        { error: "This time slot is already booked" },
        { status: 400 }
      );
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        requesterId: session.user.id,
        providerId: validatedData.providerId,
        serviceId: validatedData.serviceId,
        date: new Date(validatedData.date),
        time: validatedData.time,
        note: validatedData.notes,
        address: validatedData.address,
        status: "PENDING",
      },
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
            email: true,
          },
        },
        provider: {
          select: {
            id: true,
            username: true,
            email: true,
            shop: {
              select: {
                name: true,
                address: true,
              },
            },
          },
        },
      },
    });

    // Format date for emails
    const formattedDate = new Date(validatedData.date).toLocaleDateString("en-ZA", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Send confirmation email to customer
    if (appointment.requester?.email) {
      sendBookingConfirmation(appointment.requester.email, {
        customerName: appointment.requester.username,
        serviceName: appointment.service?.name || "Service",
        providerName: appointment.provider?.shop?.name || appointment.provider?.username || "Provider",
        date: formattedDate,
        time: validatedData.time,
        address: appointment.provider?.shop?.address || validatedData.address,
        bookingId: appointment.id,
      }).catch((err) => console.error("Failed to send customer email:", err));
    }

    // Send notification email to provider
    if (appointment.provider?.email) {
      sendNewBookingNotification(appointment.provider.email, {
        providerName: appointment.provider.username,
        customerName: appointment.requester?.username || "Customer",
        serviceName: appointment.service?.name || "Service",
        date: formattedDate,
        time: validatedData.time,
        bookingId: appointment.id,
      }).catch((err) => console.error("Failed to send provider email:", err));
    }

    return NextResponse.json(
      {
        success: true,
        message: "Appointment booked successfully",
        appointment: {
          ...appointment,
          service: appointment.service
            ? {
                ...appointment.service,
                price: appointment.service.price
                  ? Number(appointment.service.price)
                  : null,
              }
            : null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating appointment:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}
