import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/dashboard/analytics - Get provider analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30"; // days
    const type = searchParams.get("type"); // "revenue", "bookings", "services", "satisfaction"

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const analytics: Record<string, unknown> = {};

    // Revenue Analytics
    if (!type || type === "revenue") {
      const payments = await prisma.payment.findMany({
        where: {
          OR: [
            // As provider (appointments)
            {
              appointment: {
                providerId: session.user.id,
              },
            },
            // Direct payments
            { userId: session.user.id },
          ],
          status: "COMPLETED",
          completedAt: { gte: startDate },
        },
        select: {
          amount: true,
          completedAt: true,
          provider: true,
        },
        orderBy: { completedAt: "asc" },
      });

      // Group by day
      const revenueByDay: Record<string, number> = {};
      let totalRevenue = 0;

      payments.forEach((p) => {
        if (p.completedAt) {
          const day = p.completedAt.toISOString().split("T")[0];
          revenueByDay[day] = (revenueByDay[day] || 0) + Number(p.amount);
          totalRevenue += Number(p.amount);
        }
      });

      // Group by payment provider
      const revenueByProvider: Record<string, number> = {};
      payments.forEach((p) => {
        revenueByProvider[p.provider] = (revenueByProvider[p.provider] || 0) + Number(p.amount);
      });

      analytics.revenue = {
        total: totalRevenue,
        byDay: Object.entries(revenueByDay).map(([date, amount]) => ({
          date,
          amount,
        })),
        byProvider: revenueByProvider,
        averagePerDay: Object.keys(revenueByDay).length > 0
          ? totalRevenue / Object.keys(revenueByDay).length
          : 0,
      };
    }

    // Booking Analytics
    if (!type || type === "bookings") {
      const appointments = await prisma.appointment.findMany({
        where: {
          providerId: session.user.id,
          createdAt: { gte: startDate },
        },
        select: {
          status: true,
          date: true,
          createdAt: true,
          service: {
            select: { name: true },
          },
        },
      });

      // Group by status
      const byStatus: Record<string, number> = {};
      appointments.forEach((a) => {
        byStatus[a.status] = (byStatus[a.status] || 0) + 1;
      });

      // Group by day
      const byDay: Record<string, number> = {};
      appointments.forEach((a) => {
        const day = a.createdAt.toISOString().split("T")[0];
        byDay[day] = (byDay[day] || 0) + 1;
      });

      // Group by service
      const byService: Record<string, number> = {};
      appointments.forEach((a) => {
        const serviceName = a.service?.name || "Unknown";
        byService[serviceName] = (byService[serviceName] || 0) + 1;
      });

      const completedCount = byStatus["COMPLETED"] || 0;
      const cancelledCount = byStatus["CANCELLED"] || 0;

      analytics.bookings = {
        total: appointments.length,
        byStatus,
        byDay: Object.entries(byDay).map(([date, count]) => ({ date, count })),
        byService: Object.entries(byService)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([service, count]) => ({ service, count })),
        completionRate: appointments.length > 0
          ? Math.round((completedCount / appointments.length) * 100)
          : 0,
        cancellationRate: appointments.length > 0
          ? Math.round((cancelledCount / appointments.length) * 100)
          : 0,
      };
    }

    // Service Performance
    if (!type || type === "services") {
      const services = await prisma.service.findMany({
        where: {
          providerId: session.user.id,
        },
        include: {
          _count: {
            select: {
              appointments: true,
              savedBy: true,
            },
          },
          appointments: {
            where: {
              createdAt: { gte: startDate },
            },
            select: { status: true },
          },
          recentlyViewed: {
            where: {
              lastViewed: { gte: startDate },
            },
            select: { viewCount: true },
          },
        },
      });

      analytics.services = {
        total: services.length,
        active: services.filter((s) => s.isActive).length,
        topPerforming: services
          .map((s) => ({
            id: s.id,
            name: s.name,
            bookings: s._count.appointments,
            recentBookings: s.appointments.length,
            savedCount: s._count.savedBy,
            views: s.recentlyViewed.reduce((sum, rv) => sum + rv.viewCount, 0),
            conversionRate: s.recentlyViewed.length > 0
              ? Math.round(
                  (s.appointments.length /
                    s.recentlyViewed.reduce((sum, rv) => sum + rv.viewCount, 0)) *
                    100
                )
              : 0,
          }))
          .sort((a, b) => b.recentBookings - a.recentBookings)
          .slice(0, 10),
      };
    }

    // Customer Satisfaction
    if (!type || type === "satisfaction") {
      const reviews = await prisma.review.findMany({
        where: {
          receiverId: session.user.id,
          createdAt: { gte: startDate },
        },
        select: {
          rating: true,
          createdAt: true,
          text: true,
        },
        orderBy: { createdAt: "desc" },
      });

      // Rating distribution
      const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews.forEach((r) => {
        ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
      });

      // Rating by day
      const ratingByDay: Record<string, { total: number; count: number }> = {};
      reviews.forEach((r) => {
        const day = r.createdAt.toISOString().split("T")[0];
        if (!ratingByDay[day]) {
          ratingByDay[day] = { total: 0, count: 0 };
        }
        ratingByDay[day].total += r.rating;
        ratingByDay[day].count += 1;
      });

      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);

      analytics.satisfaction = {
        totalReviews: reviews.length,
        averageRating: reviews.length > 0
          ? Math.round((totalRating / reviews.length) * 10) / 10
          : 0,
        ratingDistribution,
        ratingTrend: Object.entries(ratingByDay).map(([date, data]) => ({
          date,
          average: Math.round((data.total / data.count) * 10) / 10,
          count: data.count,
        })),
        recentReviews: reviews.slice(0, 5).map((r) => ({
          rating: r.rating,
          text: r.text?.substring(0, 100),
          date: r.createdAt,
        })),
        positiveRate: reviews.length > 0
          ? Math.round(
              ((ratingDistribution[4] + ratingDistribution[5]) / reviews.length) *
                100
            )
          : 0,
      };
    }

    return NextResponse.json({
      period: parseInt(period),
      startDate,
      endDate: new Date(),
      analytics,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
