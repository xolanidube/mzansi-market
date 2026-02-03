import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/payments/[id] - Get a specific payment
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

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
        appointment: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
            provider: {
              select: {
                id: true,
                username: true,
                shop: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                  },
                },
              },
            },
            requester: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Check if user owns this payment
    if (payment.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have access to this payment" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      payment: {
        id: payment.id,
        amount: Number(payment.amount),
        currency: payment.currency,
        status: payment.status,
        provider: payment.provider,
        description: payment.description,
        createdAt: payment.createdAt,
        completedAt: payment.completedAt,
        order: payment.order,
        appointment: payment.appointment
          ? {
              id: payment.appointment.id,
              date: payment.appointment.date,
              time: payment.appointment.time,
              status: payment.appointment.status,
              service: payment.appointment.service
                ? {
                    ...payment.appointment.service,
                    price: payment.appointment.service.price
                      ? Number(payment.appointment.service.price)
                      : null,
                  }
                : null,
              provider: payment.appointment.provider,
              requester: payment.appointment.requester,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error fetching payment:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment" },
      { status: 500 }
    );
  }
}
