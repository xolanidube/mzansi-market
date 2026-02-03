import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const compareSchema = z.object({
  serviceIds: z.array(z.string()).min(2).max(4),
});

// POST /api/services/compare - Compare multiple services
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceIds } = compareSchema.parse(body);

    const services = await prisma.service.findMany({
      where: {
        id: { in: serviceIds },
        isActive: true,
      },
      include: {
        provider: {
          select: {
            id: true,
            username: true,
            picture: true,
            isVerified: true,
            shop: {
              select: {
                id: true,
                name: true,
                rating: true,
                totalReviews: true,
                address: true,
              },
            },
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            appointments: true,
            savedBy: true,
          },
        },
      },
    });

    if (services.length < 2) {
      return NextResponse.json(
        { error: "At least 2 active services are required for comparison" },
        { status: 400 }
      );
    }

    // Calculate additional metrics
    const servicesWithMetrics = await Promise.all(
      services.map(async (service) => {
        // Get average rating from reviews
        const reviewStats = await prisma.review.aggregate({
          where: {
            receiverId: service.providerId,
          },
          _avg: { rating: true },
          _count: true,
        });

        // Get completed appointments count
        const completedAppointments = await prisma.appointment.count({
          where: {
            serviceId: service.id,
            status: "COMPLETED",
          },
        });

        return {
          id: service.id,
          name: service.name,
          description: service.description,
          price: Number(service.price),
          chargeTime: service.chargeTime,
          picture: service.picture,
          category: service.category,
          provider: {
            id: service.provider.id,
            name: service.provider.username,
            picture: service.provider.picture,
            isVerified: service.provider.isVerified,
            shop: service.provider.shop
              ? {
                  ...service.provider.shop,
                  rating: service.provider.shop.rating
                    ? Number(service.provider.shop.rating)
                    : null,
                }
              : null,
          },
          metrics: {
            totalBookings: service._count.appointments,
            completedBookings: completedAppointments,
            savedCount: service._count.savedBy,
            providerRating: reviewStats._avg.rating
              ? Number(reviewStats._avg.rating.toFixed(1))
              : null,
            providerReviewCount: reviewStats._count,
          },
        };
      })
    );

    // Generate comparison summary
    const prices = servicesWithMetrics.map((s) => s.price);
    const ratings = servicesWithMetrics
      .map((s) => s.metrics.providerRating)
      .filter((r): r is number => r !== null);

    const comparison = {
      services: servicesWithMetrics,
      summary: {
        priceRange: {
          min: Math.min(...prices),
          max: Math.max(...prices),
          average: prices.reduce((a, b) => a + b, 0) / prices.length,
        },
        ratingRange: ratings.length > 0
          ? {
              min: Math.min(...ratings),
              max: Math.max(...ratings),
              average: ratings.reduce((a, b) => a + b, 0) / ratings.length,
            }
          : null,
        bestValue: servicesWithMetrics.reduce((best, current) => {
          const bestScore = best.metrics.providerRating || 0;
          const currentScore = current.metrics.providerRating || 0;
          const bestValueRatio = bestScore / best.price;
          const currentValueRatio = currentScore / current.price;
          return currentValueRatio > bestValueRatio ? current : best;
        }).id,
        mostBooked: servicesWithMetrics.reduce((most, current) =>
          current.metrics.completedBookings > most.metrics.completedBookings
            ? current
            : most
        ).id,
      },
    };

    return NextResponse.json(comparison);
  } catch (error) {
    console.error("Error comparing services:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to compare services" },
      { status: 500 }
    );
  }
}
