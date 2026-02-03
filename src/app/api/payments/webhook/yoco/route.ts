import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyYocoPayment } from "@/lib/payments/yoco";
import { notifyPaymentReceived, notifyPaymentFailed } from "@/lib/notifications";

// POST /api/payments/webhook/yoco - Yoco webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("Yoco webhook received:", body);

    const { id: checkoutId, status, metadata } = body;

    if (!checkoutId) {
      return NextResponse.json(
        { error: "Missing checkout ID" },
        { status: 400 }
      );
    }

    // Verify the payment with Yoco
    const verification = await verifyYocoPayment(checkoutId);

    // Find the payment by provider reference or metadata
    const paymentId = metadata?.paymentId;
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { id: paymentId },
          { providerRef: checkoutId },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        order: true,
        appointment: {
          include: {
            service: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      console.error(`Payment not found for checkout: ${checkoutId}`);
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Update payment status based on verification
    const newStatus = verification.status;

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        providerRef: checkoutId,
        providerData: verification.providerData ? JSON.parse(JSON.stringify(verification.providerData)) : undefined,
        completedAt: newStatus === "COMPLETED" ? new Date() : undefined,
        failureReason: newStatus === "FAILED" ? verification.error : undefined,
      },
    });

    // Handle completed payments
    if (newStatus === "COMPLETED") {
      // Handle wallet deposits
      if (payment.type === "WALLET_DEPOSIT") {
        // Get or create wallet
        let wallet = await prisma.wallet.findUnique({
          where: { userId: payment.user.id },
        });

        if (!wallet) {
          wallet = await prisma.wallet.create({
            data: {
              userId: payment.user.id,
              balance: 0,
              currency: "ZAR",
            },
          });
        }

        // Credit wallet and create transaction
        await prisma.$transaction([
          prisma.wallet.update({
            where: { userId: payment.user.id },
            data: {
              balance: { increment: Number(payment.amount) },
            },
          }),
          prisma.transaction.create({
            data: {
              walletId: wallet.id,
              amount: Number(payment.amount),
              type: "CREDIT",
              description: "Wallet deposit via Yoco",
              reference: payment.id,
            },
          }),
        ]);

        // Notify user
        await notifyPaymentReceived(
          payment.user.id,
          Number(payment.amount),
          "Wallet Deposit",
          payment.id
        );
      } else {
        // Update related order/appointment status
        if (payment.orderId) {
          await prisma.order.update({
            where: { id: payment.orderId },
            data: { status: "CONFIRMED" },
          });
        }

        if (payment.appointmentId) {
          await prisma.appointment.update({
            where: { id: payment.appointmentId },
            data: {
              paymentMode: "PAID",
              status: "CONFIRMED",
            },
          });
        }

        // Notify user
        await notifyPaymentReceived(
          payment.user.id,
          Number(payment.amount),
          payment.appointment?.service?.name || "Order",
          payment.id
        );
      }
    } else if (newStatus === "FAILED") {
      await notifyPaymentFailed(
        payment.user.id,
        Number(payment.amount),
        verification.error || "Payment failed"
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Yoco webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// GET /api/payments/webhook/yoco - Verify payment (for return URL)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkoutId = searchParams.get("id");

    if (!checkoutId) {
      return NextResponse.json(
        { error: "Missing checkout ID" },
        { status: 400 }
      );
    }

    const verification = await verifyYocoPayment(checkoutId);

    return NextResponse.json({
      success: verification.success,
      status: verification.status,
      amount: verification.amount,
    });
  } catch (error) {
    console.error("Yoco verification error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
