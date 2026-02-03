import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createReferralSchema = z.object({
  shareId: z.string().optional(),
  sourceServiceId: z.string().optional(),
});

// GET /api/referrals - Get user's referrals
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "made" or "received"
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};

    if (type === "received") {
      where.referredUserId = session.user.id;
    } else {
      where.referrerId = session.user.id;
    }

    if (status) {
      where.status = status;
    }

    const referrals = await prisma.referral.findMany({
      where,
      include: {
        referrer: {
          select: {
            id: true,
            username: true,
            picture: true,
          },
        },
        referredUser: {
          select: {
            id: true,
            username: true,
            picture: true,
          },
        },
        sourceService: {
          select: {
            id: true,
            name: true,
          },
        },
        share: {
          select: {
            clickCount: true,
            platform: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate statistics
    const stats = {
      total: referrals.length,
      pending: referrals.filter((r) => r.status === "PENDING").length,
      converted: referrals.filter((r) => r.status === "CONVERTED").length,
      rewarded: referrals.filter((r) => r.status === "REWARDED").length,
      totalRewards: referrals
        .filter((r) => r.status === "REWARDED")
        .reduce((sum, r) => sum + Number(r.rewardAmount || 0), 0),
      conversionRate:
        referrals.length > 0
          ? Math.round(
              (referrals.filter((r) => ["CONVERTED", "REWARDED"].includes(r.status)).length /
                referrals.length) *
                100
            )
          : 0,
    };

    return NextResponse.json({
      referrals: referrals.map((r) => ({
        id: r.id,
        status: r.status,
        rewardAmount: r.rewardAmount ? Number(r.rewardAmount) : null,
        rewardPaidAt: r.rewardPaidAt,
        convertedAt: r.convertedAt,
        createdAt: r.createdAt,
        referrer: r.referrer,
        referredUser: r.referredUser,
        sourceService: r.sourceService,
        shareStats: r.share
          ? {
              clicks: r.share.clickCount,
              platform: r.share.platform,
            }
          : null,
      })),
      stats,
    });
  } catch (error) {
    console.error("Error fetching referrals:", error);
    return NextResponse.json(
      { error: "Failed to fetch referrals" },
      { status: 500 }
    );
  }
}

// POST /api/referrals - Register a referral (called when referred user signs up)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { shareId, sourceServiceId } = createReferralSchema.parse(body);

    // Get the share to find the referrer
    let referrerId: string | null = null;

    if (shareId) {
      const share = await prisma.serviceShare.findUnique({
        where: { id: shareId },
        select: {
          createdById: true,
          serviceId: true,
        },
      });

      if (share) {
        referrerId = share.createdById;
      }
    }

    if (!referrerId) {
      return NextResponse.json(
        { error: "Invalid referral" },
        { status: 400 }
      );
    }

    // Can't refer yourself
    if (referrerId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot refer yourself" },
        { status: 400 }
      );
    }

    // Check if referral already exists
    const existing = await prisma.referral.findFirst({
      where: {
        referrerId,
        referredUserId: session.user.id,
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        referralId: existing.id,
        message: "Referral already exists",
      });
    }

    const referral = await prisma.referral.create({
      data: {
        referrerId,
        referredUserId: session.user.id,
        sourceServiceId,
        shareId,
        status: "PENDING",
      },
    });

    // Notify the referrer
    try {
      await prisma.notification.create({
        data: {
          userId: referrerId,
          type: "SYSTEM",
          title: "New Referral",
          message: `Someone signed up using your referral link!`,
          metadata: {
            referralId: referral.id,
          },
        },
      });
    } catch (notificationError) {
      console.error("Failed to notify referrer:", notificationError);
    }

    return NextResponse.json({
      success: true,
      referralId: referral.id,
      message: "Referral registered",
    });
  } catch (error) {
    console.error("Error creating referral:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to register referral" },
      { status: 500 }
    );
  }
}

// PATCH /api/referrals - Convert a referral (when referred user makes a purchase/booking)
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const referralId = searchParams.get("id");
    const action = searchParams.get("action"); // "convert" or "reward"

    if (!referralId) {
      return NextResponse.json(
        { error: "Referral ID is required" },
        { status: 400 }
      );
    }

    const referral = await prisma.referral.findUnique({
      where: { id: referralId },
    });

    if (!referral) {
      return NextResponse.json(
        { error: "Referral not found" },
        { status: 404 }
      );
    }

    if (action === "convert") {
      if (referral.status !== "PENDING") {
        return NextResponse.json(
          { error: "Referral already processed" },
          { status: 400 }
        );
      }

      await prisma.referral.update({
        where: { id: referralId },
        data: {
          status: "CONVERTED",
          convertedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Referral marked as converted",
      });
    }

    if (action === "reward") {
      if (referral.status !== "CONVERTED") {
        return NextResponse.json(
          { error: "Referral must be converted before rewarding" },
          { status: 400 }
        );
      }

      const body = await request.json();
      const rewardAmount = body.rewardAmount;

      await prisma.referral.update({
        where: { id: referralId },
        data: {
          status: "REWARDED",
          rewardAmount,
          rewardPaidAt: new Date(),
        },
      });

      // Notify the referrer
      await prisma.notification.create({
        data: {
          userId: referral.referrerId,
          type: "PAYMENT_RECEIVED",
          title: "Referral Reward",
          message: `You earned R${rewardAmount} from a referral!`,
          metadata: {
            referralId: referral.id,
            rewardAmount,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: "Referral rewarded",
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating referral:", error);
    return NextResponse.json(
      { error: "Failed to update referral" },
      { status: 500 }
    );
  }
}
