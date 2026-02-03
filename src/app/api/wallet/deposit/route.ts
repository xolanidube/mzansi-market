import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { initiateYocoPayment } from "@/lib/payments/yoco";
import { initiatePayFastPayment } from "@/lib/payments/payfast";

const depositSchema = z.object({
  amount: z.number().positive().min(10, "Minimum deposit is R10"),
  provider: z.enum(["yoco", "payfast"]).default("yoco"),
});

// POST /api/wallet/deposit - Initiate wallet deposit
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, provider } = depositSchema.parse(body);

    // Get or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: session.user.id,
          balance: 0,
          currency: "ZAR",
        },
      });
    }

    // Get user details for payment
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, username: true, phone: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create a pending payment record
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        amount,
        provider: provider.toUpperCase() as "YOCO" | "PAYFAST",
        status: "PENDING",
        type: "WALLET_DEPOSIT",
      },
    });

    // Initiate payment with the selected provider
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const returnUrl = `${baseUrl}/dashboard/wallet?deposit=success&payment=${payment.id}`;
    const cancelUrl = `${baseUrl}/dashboard/wallet?deposit=cancelled`;

    let result;

    if (provider === "yoco") {
      result = await initiateYocoPayment({
        amount,
        currency: "ZAR",
        description: `Wallet deposit - R${amount.toFixed(2)}`,
        reference: payment.id,
        returnUrl,
        cancelUrl,
        metadata: { paymentId: payment.id, type: "WALLET_DEPOSIT" },
      });
    } else {
      result = await initiatePayFastPayment({
        amount,
        description: `Wallet Deposit - R${amount.toFixed(2)}`,
        reference: payment.id,
        returnUrl,
        cancelUrl,
        notifyUrl: `${baseUrl}/api/payments/webhook/payfast`,
        customerEmail: user.email,
        customerFirstName: user.username.split(" ")[0] || user.username,
        customerLastName: user.username.split(" ")[1] || "",
        metadata: { paymentId: payment.id, type: "WALLET_DEPOSIT" },
      });
    }

    if (!result.success) {
      // Mark payment as failed
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
        providerData: result.providerData
          ? JSON.parse(JSON.stringify(result.providerData))
          : undefined,
        status: "PROCESSING",
      },
    });

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      redirectUrl: result.redirectUrl,
    });
  } catch (error) {
    console.error("Error initiating deposit:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to initiate deposit" },
      { status: 500 }
    );
  }
}

// GET /api/wallet/deposit - Check deposit status and complete if successful
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 }
      );
    }

    // Find the payment
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId: session.user.id,
        type: "WALLET_DEPOSIT",
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // If already completed, just return the status
    if (payment.status === "COMPLETED") {
      return NextResponse.json({
        success: true,
        status: "COMPLETED",
        amount: Number(payment.amount),
        message: "Deposit already credited to wallet",
      });
    }

    // If still processing, check with provider
    if (payment.status === "PROCESSING") {
      // For now, return the current status
      // In production, you would verify with the payment provider
      return NextResponse.json({
        success: true,
        status: payment.status,
        message: "Payment is being processed",
      });
    }

    return NextResponse.json({
      success: false,
      status: payment.status,
      message:
        payment.status === "FAILED"
          ? payment.failureReason || "Payment failed"
          : "Payment is pending",
    });
  } catch (error) {
    console.error("Error checking deposit status:", error);
    return NextResponse.json(
      { error: "Failed to check deposit status" },
      { status: 500 }
    );
  }
}
