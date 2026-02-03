import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { sendBookingStatusUpdate } from "@/lib/email";

const updateAppointmentSchema = z.object({
  status: z
    .enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"])
    .optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  notes: z.string().optional(),
  address: z.string().optional(),
});

// GET /api/appointments/[id] - Get a specific appointment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            chargeTime: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
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
                tax: true,
              },
            },
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Check if user is part of this appointment
    if (
      appointment.requesterId !== session.user.id &&
      appointment.providerId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "You don't have access to this appointment" },
        { status: 403 }
      );
    }

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointment" },
      { status: 500 }
    );
  }
}

// PATCH /api/appointments/[id] - Update an appointment
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

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      select: {
        id: true,
        requesterId: true,
        providerId: true,
        status: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    const isRequester = appointment.requesterId === session.user.id;
    const isProvider = appointment.providerId === session.user.id;

    if (!isRequester && !isProvider) {
      return NextResponse.json(
        { error: "You don't have access to this appointment" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateAppointmentSchema.parse(body);

    // Validate status transitions
    if (validatedData.status) {
      const currentStatus = appointment.status;
      const newStatus = validatedData.status;

      // Requester can only cancel
      if (isRequester && !isProvider) {
        if (newStatus !== "CANCELLED") {
          return NextResponse.json(
            { error: "You can only cancel appointments" },
            { status: 403 }
          );
        }
      }

      // Provider can confirm, complete, mark no-show, or cancel
      if (isProvider) {
        const allowedTransitions: Record<string, string[]> = {
          PENDING: ["CONFIRMED", "CANCELLED"],
          CONFIRMED: ["COMPLETED", "CANCELLED", "NO_SHOW"],
        };

        if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
          return NextResponse.json(
            { error: `Cannot change status from ${currentStatus} to ${newStatus}` },
            { status: 400 }
          );
        }
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (validatedData.status) updateData.status = validatedData.status;
    if (validatedData.date) updateData.date = new Date(validatedData.date);
    if (validatedData.time) updateData.time = validatedData.time;
    if (validatedData.notes !== undefined) updateData.note = validatedData.notes;
    if (validatedData.address !== undefined) updateData.address = validatedData.address;

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
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
          },
        },
      },
    });

    // Send status update email to the customer if status changed
    if (validatedData.status && updatedAppointment.requester?.email) {
      const statusMessages: Record<string, string> = {
        CONFIRMED: "Confirmed",
        COMPLETED: "Completed",
        CANCELLED: "Cancelled",
        NO_SHOW: "Marked as No-Show",
      };

      const statusMessage = statusMessages[validatedData.status] || validatedData.status;

      sendBookingStatusUpdate(updatedAppointment.requester.email, {
        customerName: updatedAppointment.requester.username,
        serviceName: updatedAppointment.service?.name || "Service",
        status: statusMessage,
        bookingId: updatedAppointment.id,
      }).catch((err) => console.error("Failed to send status update email:", err));
    }

    return NextResponse.json({
      success: true,
      message: "Appointment updated successfully",
      appointment: {
        ...updatedAppointment,
        service: updatedAppointment.service
          ? {
              ...updatedAppointment.service,
              price: updatedAppointment.service.price
                ? Number(updatedAppointment.service.price)
                : null,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error updating appointment:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}

// DELETE /api/appointments/[id] - Delete/Cancel an appointment
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

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      select: {
        id: true,
        requesterId: true,
        providerId: true,
        status: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Check if user is part of this appointment
    if (
      appointment.requesterId !== session.user.id &&
      appointment.providerId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "You don't have access to this appointment" },
        { status: 403 }
      );
    }

    // Can only cancel pending or confirmed appointments
    if (!["PENDING", "CONFIRMED"].includes(appointment.status)) {
      return NextResponse.json(
        { error: "Cannot cancel this appointment" },
        { status: 400 }
      );
    }

    // Soft delete - mark as cancelled
    await prisma.appointment.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({
      success: true,
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json(
      { error: "Failed to cancel appointment" },
      { status: 500 }
    );
  }
}
