import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const withdrawalSchema = z.object({
  amount: z.number().positive().min(50, "Minimum withdrawal is R50"),
  bankName: z.string().min(1, "Bank name is required"),
  accountNumber: z.string().min(5, "Valid account number is required"),
  accountHolder: z.string().min(1, "Account holder name is required"),
  branchCode: z.string().optional(),
});

// GET /api/wallet/withdraw - Get user's withdrawal requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (status) {
      where.status = status;
    }

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.withdrawalRequest.count({ where }),
    ]);

    return NextResponse.json({
      withdrawals: withdrawals.map((w) => ({
        id: w.id,
        amount: Number(w.amount),
        status: w.status,
        bankName: w.bankName,
        accountNumber: `****${w.accountNumber.slice(-4)}`,
        accountHolder: w.accountHolder,
        reference: w.reference,
        rejectionReason: w.rejectionReason,
        processedAt: w.processedAt,
        createdAt: w.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching withdrawals:", error);
    return NextResponse.json(
      { error: "Failed to fetch withdrawals" },
      { status: 500 }
    );
  }
}

// POST /api/wallet/withdraw - Request a withdrawal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = withdrawalSchema.parse(body);

    // Get user's wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const currentBalance = Number(wallet.balance);

    // Check if user has sufficient balance
    if (currentBalance < data.amount) {
      return NextResponse.json(
        {
          error: `Insufficient balance. Available: R${currentBalance.toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    // Check for pending withdrawals
    const pendingWithdrawals = await prisma.withdrawalRequest.findMany({
      where: {
        userId: session.user.id,
        status: { in: ["PENDING", "APPROVED", "PROCESSING"] },
      },
    });

    const pendingAmount = pendingWithdrawals.reduce(
      (sum, w) => sum + Number(w.amount),
      0
    );

    if (currentBalance - pendingAmount < data.amount) {
      return NextResponse.json(
        {
          error: `You have R${pendingAmount.toFixed(2)} in pending withdrawals. Available for withdrawal: R${(currentBalance - pendingAmount).toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    // Create withdrawal request
    const withdrawal = await prisma.withdrawalRequest.create({
      data: {
        userId: session.user.id,
        amount: data.amount,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountHolder: data.accountHolder,
        branchCode: data.branchCode,
        status: "PENDING",
      },
    });

    // Create a notification for admin
    await prisma.notification.create({
      data: {
        userId: session.user.id, // For now, notify the user. In production, notify admins
        type: "SYSTEM",
        title: "Withdrawal Request Submitted",
        message: `Your withdrawal request for R${data.amount.toFixed(2)} has been submitted and is pending review.`,
        metadata: JSON.parse(
          JSON.stringify({
            withdrawalId: withdrawal.id,
            amount: data.amount,
          })
        ),
      },
    });

    // Get user for email
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, username: true },
    });

    // Send confirmation email
    if (user?.email) {
      const { sendEmail } = await import("@/lib/email");
      await sendEmail(
        user.email,
        "Withdrawal Request Received",
        `
        <h2>Withdrawal Request Received</h2>
        <p>Hi ${user.username},</p>
        <p>We have received your withdrawal request for <strong>R${data.amount.toFixed(2)}</strong>.</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <p><strong>Amount:</strong> R${data.amount.toFixed(2)}</p>
          <p><strong>Bank:</strong> ${data.bankName}</p>
          <p><strong>Account:</strong> ****${data.accountNumber.slice(-4)}</p>
          <p><strong>Status:</strong> Pending Review</p>
        </div>
        <p>Your request will be reviewed within 1-3 business days. You will receive an email once it has been processed.</p>
        <p>Best regards,<br>Mzansi Market Team</p>
        `
      );
    }

    return NextResponse.json({
      success: true,
      message: "Withdrawal request submitted successfully",
      withdrawal: {
        id: withdrawal.id,
        amount: Number(withdrawal.amount),
        status: withdrawal.status,
        createdAt: withdrawal.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating withdrawal request:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to submit withdrawal request" },
      { status: 500 }
    );
  }
}

// DELETE /api/wallet/withdraw - Cancel a pending withdrawal request
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Withdrawal ID is required" },
        { status: 400 }
      );
    }

    // Find the withdrawal request
    const withdrawal = await prisma.withdrawalRequest.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!withdrawal) {
      return NextResponse.json(
        { error: "Withdrawal request not found" },
        { status: 404 }
      );
    }

    // Can only cancel pending requests
    if (withdrawal.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending requests can be cancelled" },
        { status: 400 }
      );
    }

    // Update status to cancelled
    await prisma.withdrawalRequest.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({
      success: true,
      message: "Withdrawal request cancelled",
    });
  } catch (error) {
    console.error("Error cancelling withdrawal:", error);
    return NextResponse.json(
      { error: "Failed to cancel withdrawal request" },
      { status: 500 }
    );
  }
}
