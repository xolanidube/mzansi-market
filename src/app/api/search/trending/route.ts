import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/search/trending - Get trending searches and items
export async function GET() {
  try {
    // Get trending searches from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendingSearches = await prisma.searchHistory.groupBy({
      by: ["query"],
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      _count: { query: true },
      orderBy: { _count: { query: "desc" } },
      take: 10,
    });

    // Get most viewed services (from recently viewed)
    const mostViewed = await prisma.recentlyViewed.groupBy({
      by: ["serviceId"],
      where: {
        serviceId: { not: null },
        lastViewed: { gte: sevenDaysAgo },
      },
      _sum: { viewCount: true },
      orderBy: { _sum: { viewCount: "desc" } },
      take: 10,
    });

    // Get service details for most viewed
    const serviceIds = mostViewed
      .map((v) => v.serviceId)
      .filter((id): id is string => id !== null);

    const services = await prisma.service.findMany({
      where: {
        id: { in: serviceIds },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        price: true,
        picture: true,
        provider: {
          select: {
            username: true,
            shop: {
              select: { name: true, rating: true },
            },
          },
        },
        category: {
          select: { name: true },
        },
      },
    });

    // Map services with view counts
    const trendingServices = mostViewed
      .map((v) => {
        const service = services.find((s) => s.id === v.serviceId);
        if (!service) return null;
        return {
          id: service.id,
          name: service.name,
          price: Number(service.price),
          picture: service.picture,
          viewCount: v._sum.viewCount || 0,
          provider: service.provider.shop?.name || service.provider.username,
          rating: service.provider.shop?.rating
            ? Number(service.provider.shop.rating)
            : null,
          category: service.category?.name,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);

    // Get trending categories
    const trendingCategories = await prisma.service.groupBy({
      by: ["categoryId"],
      where: {
        isActive: true,
        categoryId: { not: null },
        appointments: {
          some: {
            createdAt: { gte: sevenDaysAgo },
          },
        },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    const categoryIds = trendingCategories
      .map((c) => c.categoryId)
      .filter((id): id is string => id !== null);

    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: {
        id: true,
        name: true,
        iconPath: true,
        _count: {
          select: { services: true },
        },
      },
    });

    const trendingCategoriesWithDetails = trendingCategories
      .map((tc) => {
        const category = categories.find((c) => c.id === tc.categoryId);
        if (!category) return null;
        return {
          id: category.id,
          name: category.name,
          icon: category.iconPath,
          serviceCount: category._count.services,
          bookingCount: tc._count.id,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

    // Get popular providers
    const popularProviders = await prisma.shop.findMany({
      where: {
        isApproved: true,
      },
      select: {
        id: true,
        name: true,
        profileUrl: true,
        rating: true,
        totalReviews: true,
        user: {
          select: {
            _count: {
              select: { services: true },
            },
          },
        },
      },
      orderBy: [
        { rating: "desc" },
        { totalReviews: "desc" },
      ],
      take: 6,
    });

    return NextResponse.json({
      searches: trendingSearches.map((s) => ({
        query: s.query,
        count: s._count.query,
      })),
      services: trendingServices,
      categories: trendingCategoriesWithDetails,
      providers: popularProviders.map((p) => ({
        id: p.id,
        name: p.name,
        logo: p.profileUrl,
        rating: p.rating ? Number(p.rating) : null,
        reviewCount: p.totalReviews,
        serviceCount: p.user._count.services,
      })),
    });
  } catch (error) {
    console.error("Error fetching trending:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending items" },
      { status: 500 }
    );
  }
}
