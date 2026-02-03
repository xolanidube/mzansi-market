import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const compareSchema = z.object({
  shopIds: z.array(z.string()).min(2).max(4),
});

// POST /api/shops/compare - Compare multiple shops/providers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopIds } = compareSchema.parse(body);

    const shops = await prisma.shop.findMany({
      where: {
        id: { in: shopIds },
        isApproved: true,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            picture: true,
            isVerified: true,
            createdAt: true,
            _count: {
              select: {
                services: true,
                reviewsReceived: true,
                appointmentsReceived: true,
              },
            },
          },
        },
      },
    });

    if (shops.length < 2) {
      return NextResponse.json(
        { error: "At least 2 approved shops are required for comparison" },
        { status: 400 }
      );
    }

    // Calculate additional metrics for each shop
    const shopsWithMetrics = await Promise.all(
      shops.map(async (shop) => {
        // Get service statistics
        const serviceStats = await prisma.service.aggregate({
          where: {
            providerId: shop.userId,
            isActive: true,
          },
          _avg: { price: true },
          _min: { price: true },
          _max: { price: true },
          _count: true,
        });

        // Get completed appointments
        const completedAppointments = await prisma.appointment.count({
          where: {
            providerId: shop.userId,
            status: "COMPLETED",
          },
        });

        // Get recent reviews
        const recentReviews = await prisma.review.findMany({
          where: {
            receiverId: shop.userId,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            rating: true,
            text: true,
            createdAt: true,
          },
        });

        // Calculate response rate (appointments confirmed/total)
        const totalAppointments = await prisma.appointment.count({
          where: { providerId: shop.userId },
        });

        const confirmedAppointments = await prisma.appointment.count({
          where: {
            providerId: shop.userId,
            status: { in: ["CONFIRMED", "COMPLETED"] },
          },
        });

        const responseRate = totalAppointments > 0
          ? (confirmedAppointments / totalAppointments) * 100
          : 0;

        return {
          id: shop.id,
          name: shop.name,
          description: shop.description,
          address: shop.address,
          rating: shop.rating ? Number(shop.rating) : null,
          totalReviews: shop.totalReviews,
          logo: shop.profileUrl,
          coverImage: shop.coverUrl,
          openingDays: shop.openingDays,
          operatingHours: shop.startTime && shop.endTime
            ? `${shop.startTime} - ${shop.endTime}`
            : null,
          provider: {
            id: shop.user.id,
            name: shop.user.username,
            picture: shop.user.picture,
            isVerified: shop.user.isVerified,
            memberSince: shop.user.createdAt,
          },
          metrics: {
            activeServices: serviceStats._count,
            totalBookings: shop.user._count.appointmentsReceived,
            completedBookings: completedAppointments,
            totalReviews: shop.user._count.reviewsReceived,
            responseRate: Math.round(responseRate),
            pricing: {
              average: serviceStats._avg.price
                ? Number(serviceStats._avg.price)
                : null,
              min: serviceStats._min.price
                ? Number(serviceStats._min.price)
                : null,
              max: serviceStats._max.price
                ? Number(serviceStats._max.price)
                : null,
            },
          },
          recentReviews: recentReviews.map((r) => ({
            rating: r.rating,
            text: r.text?.substring(0, 100),
            createdAt: r.createdAt,
          })),
        };
      })
    );

    // Generate comparison summary
    const ratings = shopsWithMetrics
      .map((s) => s.rating)
      .filter((r): r is number => r !== null);

    const responseRates = shopsWithMetrics.map((s) => s.metrics.responseRate);

    const comparison = {
      shops: shopsWithMetrics,
      summary: {
        ratingRange: ratings.length > 0
          ? {
              min: Math.min(...ratings),
              max: Math.max(...ratings),
              average: ratings.reduce((a, b) => a + b, 0) / ratings.length,
            }
          : null,
        responseRateRange: {
          min: Math.min(...responseRates),
          max: Math.max(...responseRates),
          average: responseRates.reduce((a, b) => a + b, 0) / responseRates.length,
        },
        highestRated: ratings.length > 0
          ? shopsWithMetrics.reduce((best, current) =>
              (current.rating || 0) > (best.rating || 0) ? current : best
            ).id
          : null,
        mostExperienced: shopsWithMetrics.reduce((most, current) =>
          current.metrics.completedBookings > most.metrics.completedBookings
            ? current
            : most
        ).id,
        mostResponsive: shopsWithMetrics.reduce((most, current) =>
          current.metrics.responseRate > most.metrics.responseRate
            ? current
            : most
        ).id,
      },
    };

    return NextResponse.json(comparison);
  } catch (error) {
    console.error("Error comparing shops:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to compare shops" },
      { status: 500 }
    );
  }
}
