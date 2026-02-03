import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const isProvider = session.user.userType === "SERVICE_PROVIDER";

    if (isProvider) {
      // Provider stats
      const [
        pendingBookings,
        activeServices,
        completedBookings,
        reviews,
        wallet,
      ] = await Promise.all([
        prisma.appointment.count({
          where: {
            providerId: userId,
            status: "PENDING",
          },
        }),
        prisma.service.count({
          where: {
            providerId: userId,
            isActive: true,
          },
        }),
        prisma.appointment.count({
          where: {
            providerId: userId,
            status: "COMPLETED",
          },
        }),
        prisma.review.aggregate({
          where: {
            receiverId: userId,
          },
          _avg: {
            rating: true,
          },
          _count: true,
        }),
        prisma.wallet.findUnique({
          where: { userId },
          select: { balance: true },
        }),
      ]);

      return NextResponse.json({
        pendingBookings,
        activeServices,
        totalEarnings: wallet?.balance?.toString() || "0",
        avgRating: reviews._avg.rating?.toFixed(1) || "0.0",
        reviewCount: reviews._count,
        completedBookings,
      });
    } else {
      // Client stats
      const [
        activeBookings,
        postedJobs,
        unreadMessages,
        completedBookings,
      ] = await Promise.all([
        prisma.appointment.count({
          where: {
            requesterId: userId,
            status: {
              in: ["PENDING", "CONFIRMED"],
            },
          },
        }),
        prisma.job.count({
          where: {
            posterId: userId,
            status: "OPEN",
          },
        }),
        prisma.message.count({
          where: {
            receiverId: userId,
            status: "UNREAD",
          },
        }),
        prisma.appointment.count({
          where: {
            requesterId: userId,
            status: "COMPLETED",
          },
        }),
      ]);

      return NextResponse.json({
        activeBookings,
        postedJobs,
        unreadMessages,
        completedBookings,
      });
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
