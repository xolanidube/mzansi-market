import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/dashboard - Get admin dashboard statistics
export async function GET() {
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

    // Calculate date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Fetch all stats in parallel
    const [
      userStats,
      serviceStats,
      bookingStats,
      reportStats,
      withdrawalStats,
      recentNotifications,
    ] = await Promise.all([
      // User statistics
      prisma.user.groupBy({
        by: ["userType"],
        _count: { id: true },
      }).then(async (groups) => {
        const newUsersThisMonth = await prisma.user.count({
          where: { createdAt: { gte: startOfMonth } },
        });

        return {
          total: groups.reduce((sum, g) => sum + g._count.id, 0),
          clients: groups.find((g) => g.userType === "CLIENT")?._count.id || 0,
          providers: groups.find((g) => g.userType === "SERVICE_PROVIDER")?._count.id || 0,
          admins: groups.find((g) => g.userType === "ADMIN")?._count.id || 0,
          newThisMonth: newUsersThisMonth,
        };
      }),

      // Service statistics
      prisma.service.groupBy({
        by: ["isActive"],
        _count: { id: true },
      }).then(async (groups) => {
        // Count pending services (not approved yet)
        const pendingCount = await prisma.service.count({
          where: { isActive: false },
        });

        return {
          total: groups.reduce((sum, g) => sum + g._count.id, 0),
          active: groups.find((g) => g.isActive === true)?._count.id || 0,
          pending: pendingCount,
        };
      }),

      // Booking statistics
      prisma.appointment.groupBy({
        by: ["status"],
        _count: { id: true },
      }).then(async (groups) => {
        const thisMonthBookings = await prisma.appointment.count({
          where: { createdAt: { gte: startOfMonth } },
        });

        return {
          total: groups.reduce((sum, g) => sum + g._count.id, 0),
          pending: groups.find((g) => g.status === "PENDING")?._count.id || 0,
          completed: groups.find((g) => g.status === "COMPLETED")?._count.id || 0,
          thisMonth: thisMonthBookings,
        };
      }),

      // Report statistics
      prisma.contentReport.groupBy({
        by: ["status"],
        _count: { id: true },
      }).then((groups) => ({
        total: groups.reduce((sum, g) => sum + g._count.id, 0),
        pending: groups.find((g) => g.status === "PENDING")?._count.id || 0,
        resolved: groups.find((g) => g.status === "RESOLVED")?._count.id || 0,
      })),

      // Withdrawal statistics
      prisma.withdrawalRequest.aggregate({
        where: { status: "PENDING" },
        _count: { id: true },
        _sum: { amount: true },
      }).then((result) => ({
        pending: result._count.id,
        pendingAmount: Number(result._sum.amount || 0),
      })),

      // Recent notifications/activity
      prisma.notification.findMany({
        where: {
          type: { in: ["BOOKING_NEW", "REVIEW_NEW", "SYSTEM"] },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          type: true,
          message: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      stats: {
        users: userStats,
        services: serviceStats,
        bookings: bookingStats,
        reports: reportStats,
        withdrawals: withdrawalStats,
        revenue: {
          thisMonth: 0, // TODO: Calculate from completed payments
          lastMonth: 0,
        },
      },
      recentActivity: recentNotifications.map((n) => ({
        id: n.id,
        type: n.type,
        message: n.message,
        createdAt: n.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching admin dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
