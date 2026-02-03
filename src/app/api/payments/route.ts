import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getAvailableProviders, isProviderConfigured } from "@/lib/payments";
import { initiateYocoPayment } from "@/lib/payments/yoco";
import { initiatePayFastPayment } from "@/lib/payments/payfast";

const initiatePaymentSchema = z.object({
  provider: z.enum(["YOCO", "PAYFAST", "WALLET"]),
  amount: z.number().positive(),
  description: z.string().optional(),
  orderId: z.string().optional(),
  appointmentId: z.string().optional(),
  returnUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

// GET /api/payments - Get user's payments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (status) {
      where.status = status;
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
            },
          },
          appointment: {
            select: {
              id: true,
              service: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return NextResponse.json({
      payments: payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status,
        provider: p.provider,
        description: p.description,
        createdAt: p.createdAt,
        completedAt: p.completedAt,
        order: p.order,
        appointment: p.appointment,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

// POST /api/payments - Initiate a payment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = initiatePaymentSchema.parse(body);

    // Check if provider is configured
    if (!isProviderConfigured(validatedData.provider)) {
      return NextResponse.json(
        { error: `${validatedData.provider} is not configured` },
        { status: 400 }
      );
    }

    // Get user details for payment
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        username: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        amount: validatedData.amount,
        currency: "ZAR",
        status: "PENDING",
        provider: validatedData.provider,
        description: validatedData.description,
        orderId: validatedData.orderId,
        appointmentId: validatedData.appointmentId,
        metadata: {
          returnUrl: validatedData.returnUrl,
          cancelUrl: validatedData.cancelUrl,
        },
      },
    });

    let result;

    // Initiate payment with provider
    switch (validatedData.provider) {
      case "YOCO":
        result = await initiateYocoPayment({
          amount: validatedData.amount,
          description: validatedData.description,
          reference: payment.id,
          returnUrl: validatedData.returnUrl || `${process.env.NEXTAUTH_URL}/payment/success?paymentId=${payment.id}`,
          cancelUrl: validatedData.cancelUrl || `${process.env.NEXTAUTH_URL}/payment/cancel?paymentId=${payment.id}`,
          metadata: {
            paymentId: payment.id,
            userId: session.user.id,
          },
        });
        break;

      case "PAYFAST":
        result = await initiatePayFastPayment({
          amount: validatedData.amount,
          description: validatedData.description,
          reference: payment.id,
          customerEmail: user.email,
          customerFirstName: user.username,
          returnUrl: validatedData.returnUrl || `${process.env.NEXTAUTH_URL}/payment/success?paymentId=${payment.id}`,
          cancelUrl: validatedData.cancelUrl || `${process.env.NEXTAUTH_URL}/payment/cancel?paymentId=${payment.id}`,
          notifyUrl: `${process.env.NEXTAUTH_URL}/api/payments/webhook/payfast`,
          metadata: {
            paymentId: payment.id,
            userId: session.user.id,
          },
        });
        break;

      case "WALLET":
        // Handle wallet payment
        const wallet = await prisma.wallet.findUnique({
          where: { userId: session.user.id },
        });

        if (!wallet || Number(wallet.balance) < validatedData.amount) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: "FAILED",
              failureReason: "Insufficient wallet balance",
            },
          });

          return NextResponse.json(
            { error: "Insufficient wallet balance" },
            { status: 400 }
          );
        }

        // Build transaction operations
        const transactionOps = [
          prisma.wallet.update({
            where: { userId: session.user.id },
            data: {
              balance: { decrement: validatedData.amount },
            },
          }),
          prisma.transaction.create({
            data: {
              walletId: wallet.id,
              type: "DEBIT",
              amount: validatedData.amount,
              description: validatedData.description || "Payment",
            },
          }),
          prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: "COMPLETED",
              completedAt: new Date(),
            },
          }),
        ];

        // Confirm appointment if this is an appointment payment
        if (validatedData.appointmentId) {
          transactionOps.push(
            prisma.appointment.update({
              where: { id: validatedData.appointmentId },
              data: {
                paymentMode: "PAID",
                status: "CONFIRMED",
              },
            })
          );
        }

        // Deduct from wallet and update related records
        await prisma.$transaction(transactionOps);

        return NextResponse.json({
          success: true,
          paymentId: payment.id,
          status: "COMPLETED",
          message: "Payment completed from wallet",
        });

      default:
        return NextResponse.json(
          { error: "Unsupported payment provider" },
          { status: 400 }
        );
    }

    if (!result.success) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          failureReason: result.error,
        },
      });

      return NextResponse.json(
        { error: result.error || "Failed to initiate payment" },
        { status: 400 }
      );
    }

    // Update payment with provider reference
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerRef: result.providerRef,
        providerData: result.providerData ? JSON.parse(JSON.stringify(result.providerData)) : undefined,
        status: "PROCESSING",
      },
    });

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      redirectUrl: result.redirectUrl,
      status: "PROCESSING",
    });
  } catch (error) {
    console.error("Error initiating payment:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to initiate payment" },
      { status: 500 }
    );
  }
}

// GET /api/payments/providers - Get available payment providers
export async function OPTIONS() {
  return NextResponse.json({
    providers: getAvailableProviders(),
  });
}
