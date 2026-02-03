import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const processWithdrawalSchema = z.object({
  withdrawalId: z.string(),
  action: z.enum(["approve", "reject", "complete"]),
  rejectionReason: z.string().optional(),
  reference: z.string().optional(),
});

// GET /api/admin/withdrawals - Get all withdrawal requests (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userType: true },
    });

    if (user?.userType !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    const [withdrawals, total, stats] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.withdrawalRequest.count({ where }),
      prisma.withdrawalRequest.groupBy({
        by: ["status"],
        _count: { id: true },
        _sum: { amount: true },
      }),
    ]);

    // Calculate totals by status
    const statusStats = stats.reduce(
      (acc, stat) => {
        acc[stat.status] = {
          count: stat._count.id,
          total: Number(stat._sum.amount || 0),
        };
        return acc;
      },
      {} as Record<string, { count: number; total: number }>
    );

    return NextResponse.json({
      withdrawals: withdrawals.map((w) => ({
        id: w.id,
        amount: Number(w.amount),
        status: w.status,
        bankName: w.bankName,
        accountNumber: w.accountNumber,
        accountHolder: w.accountHolder,
        branchCode: w.branchCode,
        reference: w.reference,
        rejectionReason: w.rejectionReason,
        processedAt: w.processedAt,
        createdAt: w.createdAt,
        user: w.user,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: statusStats,
    });
  } catch (error) {
    console.error("Error fetching withdrawals:", error);
    return NextResponse.json(
      { error: "Failed to fetch withdrawals" },
      { status: 500 }
    );
  }
}

// POST /api/admin/withdrawals - Process a withdrawal request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userType: true },
    });

    if (admin?.userType !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { withdrawalId, action, rejectionReason, reference } =
      processWithdrawalSchema.parse(body);

    // Find the withdrawal request
    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
    });

    if (!withdrawal) {
      return NextResponse.json(
        { error: "Withdrawal request not found" },
        { status: 404 }
      );
    }

    // Process based on action
    if (action === "approve") {
      if (withdrawal.status !== "PENDING") {
        return NextResponse.json(
          { error: "Only pending requests can be approved" },
          { status: 400 }
        );
      }

      await prisma.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: { status: "APPROVED" },
      });

      // Notify user
      await prisma.notification.create({
        data: {
          userId: withdrawal.userId,
          type: "SYSTEM",
          title: "Withdrawal Approved",
          message: `Your withdrawal request for R${Number(withdrawal.amount).toFixed(2)} has been approved and will be processed shortly.`,
          metadata: JSON.parse(JSON.stringify({ withdrawalId })),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Withdrawal approved",
      });
    }

    if (action === "reject") {
      if (!["PENDING", "APPROVED"].includes(withdrawal.status)) {
        return NextResponse.json(
          { error: "This request cannot be rejected" },
          { status: 400 }
        );
      }

      await prisma.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: "REJECTED",
          rejectionReason: rejectionReason || "Request rejected by admin",
        },
      });

      // Notify user
      await prisma.notification.create({
        data: {
          userId: withdrawal.userId,
          type: "SYSTEM",
          title: "Withdrawal Rejected",
          message: `Your withdrawal request for R${Number(withdrawal.amount).toFixed(2)} has been rejected. Reason: ${rejectionReason || "Request rejected by admin"}`,
          metadata: JSON.parse(JSON.stringify({ withdrawalId })),
        },
      });

      // Send email
      if (withdrawal.user.email) {
        const { sendEmail } = await import("@/lib/email");
        await sendEmail(
          withdrawal.user.email,
          "Withdrawal Request Rejected",
          `
          <h2>Withdrawal Request Rejected</h2>
          <p>Hi ${withdrawal.user.username},</p>
          <p>Unfortunately, your withdrawal request for <strong>R${Number(withdrawal.amount).toFixed(2)}</strong> has been rejected.</p>
          <div style="background: #fef2f2; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #ef4444;">
            <p><strong>Reason:</strong> ${rejectionReason || "Request rejected by admin"}</p>
          </div>
          <p>If you believe this was an error, please contact our support team.</p>
          <p>Best regards,<br>Mzansi Market Team</p>
          `
        );
      }

      return NextResponse.json({
        success: true,
        message: "Withdrawal rejected",
      });
    }

    if (action === "complete") {
      if (withdrawal.status !== "APPROVED") {
        return NextResponse.json(
          { error: "Only approved requests can be completed" },
          { status: 400 }
        );
      }

      // Get user's wallet
      const wallet = await prisma.wallet.findUnique({
        where: { userId: withdrawal.userId },
      });

      if (!wallet) {
        return NextResponse.json(
          { error: "User wallet not found" },
          { status: 404 }
        );
      }

      const currentBalance = Number(wallet.balance);
      const withdrawalAmount = Number(withdrawal.amount);

      if (currentBalance < withdrawalAmount) {
        return NextResponse.json(
          { error: "Insufficient wallet balance" },
          { status: 400 }
        );
      }

      // Use transaction to ensure atomicity
      await prisma.$transaction([
        // Deduct from wallet
        prisma.wallet.update({
          where: { userId: withdrawal.userId },
          data: {
            balance: { decrement: withdrawalAmount },
          },
        }),
        // Create transaction record
        prisma.transaction.create({
          data: {
            walletId: wallet.id,
            amount: withdrawalAmount,
            type: "WITHDRAWAL",
            description: `Withdrawal to ${withdrawal.bankName} ****${withdrawal.accountNumber.slice(-4)}`,
            reference: reference || `WD-${withdrawal.id.slice(0, 8).toUpperCase()}`,
          },
        }),
        // Update withdrawal status
        prisma.withdrawalRequest.update({
          where: { id: withdrawalId },
          data: {
            status: "COMPLETED",
            reference: reference || `WD-${withdrawal.id.slice(0, 8).toUpperCase()}`,
            processedAt: new Date(),
          },
        }),
        // Create notification
        prisma.notification.create({
          data: {
            userId: withdrawal.userId,
            type: "PAYMENT_RECEIVED",
            title: "Withdrawal Completed",
            message: `Your withdrawal of R${withdrawalAmount.toFixed(2)} has been processed and sent to your bank account.`,
            metadata: JSON.parse(JSON.stringify({ withdrawalId, reference })),
          },
        }),
      ]);

      // Send email
      if (withdrawal.user.email) {
        const { sendEmail } = await import("@/lib/email");
        await sendEmail(
          withdrawal.user.email,
          "Withdrawal Completed",
          `
          <h2>Withdrawal Completed ✓</h2>
          <p>Hi ${withdrawal.user.username},</p>
          <p>Great news! Your withdrawal has been processed successfully.</p>
          <div style="background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #22c55e;">
            <p><strong>Amount:</strong> R${withdrawalAmount.toFixed(2)}</p>
            <p><strong>Bank:</strong> ${withdrawal.bankName}</p>
            <p><strong>Account:</strong> ****${withdrawal.accountNumber.slice(-4)}</p>
            <p><strong>Reference:</strong> ${reference || `WD-${withdrawal.id.slice(0, 8).toUpperCase()}`}</p>
          </div>
          <p>The funds should reflect in your bank account within 1-3 business days depending on your bank.</p>
          <p>Best regards,<br>Mzansi Market Team</p>
          `
        );
      }

      return NextResponse.json({
        success: true,
        message: "Withdrawal completed successfully",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing withdrawal:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process withdrawal" },
      { status: 500 }
    );
  }
}
