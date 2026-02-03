import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPayFastITN, getPayFastAllowedIPs } from "@/lib/payments/payfast";
import { notifyPaymentReceived, notifyPaymentFailed } from "@/lib/notifications";

// POST /api/payments/webhook/payfast - PayFast ITN webhook
export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor?.split(",")[0]?.trim() || "unknown";

    // Verify IP is from PayFast (optional but recommended)
    const allowedIPs = getPayFastAllowedIPs();
    if (!allowedIPs.includes(clientIp) && process.env.NODE_ENV === "production") {
      console.warn(`PayFast webhook from unauthorized IP: ${clientIp}`);
      // Don't reject in development, just warn
    }

    // Parse form data
    const formData = await request.formData();
    const itnData: Record<string, string> = {};
    formData.forEach((value, key) => {
      itnData[key] = value.toString();
    });

    console.log("PayFast ITN received:", itnData);

    // Verify the ITN
    const verification = await verifyPayFastITN(
      itnData as unknown as Parameters<typeof verifyPayFastITN>[0],
      clientIp
    );

    if (!verification.success && verification.status === "FAILED") {
      console.error("PayFast ITN verification failed:", verification.error);
      return new NextResponse("ITN verification failed", { status: 400 });
    }

    // Find the payment by m_payment_id (our payment ID)
    const paymentId = itnData.m_payment_id;
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { id: paymentId },
          { providerRef: itnData.pf_payment_id },
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
      console.error(`Payment not found: ${paymentId}`);
      return new NextResponse("Payment not found", { status: 404 });
    }

    // Update payment status
    const statusMap: Record<string, string> = {
      COMPLETE: "COMPLETED",
      FAILED: "FAILED",
      PENDING: "PROCESSING",
      CANCELLED: "CANCELLED",
    };

    const newStatus = statusMap[itnData.payment_status] || "PROCESSING";

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus as "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED" | "CANCELLED",
        providerRef: itnData.pf_payment_id,
        providerData: itnData,
        completedAt: newStatus === "COMPLETED" ? new Date() : undefined,
        failureReason: newStatus === "FAILED" ? "Payment failed" : undefined,
      },
    });

    // Send notifications
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
              description: "Wallet deposit via PayFast",
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
        // Update related order/appointment status if needed
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
        "Payment was declined"
      );
    }

    // PayFast expects a 200 OK response
    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("PayFast webhook error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
