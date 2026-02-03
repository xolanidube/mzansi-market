import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/search/suggestions - Get search suggestions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "10");

    const suggestions: {
      type: string;
      text: string;
      count?: number;
      data?: Record<string, unknown>;
    }[] = [];

    // 1. User's recent searches (if logged in)
    if (session?.user?.id) {
      const recentSearches = await prisma.searchHistory.findMany({
        where: {
          userId: session.user.id,
          query: query ? { contains: query, mode: "insensitive" } : undefined,
        },
        select: {
          query: true,
          results: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        distinct: ["query"],
      });

      recentSearches.forEach((search) => {
        suggestions.push({
          type: "recent",
          text: search.query,
          count: search.results,
        });
      });
    }

    // 2. Trending searches (from all users in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendingSearches = await prisma.searchHistory.groupBy({
      by: ["query"],
      where: {
        createdAt: { gte: sevenDaysAgo },
        query: query ? { contains: query, mode: "insensitive" } : undefined,
      },
      _count: { query: true },
      orderBy: { _count: { query: "desc" } },
      take: 5,
    });

    trendingSearches.forEach((search) => {
      // Avoid duplicates with recent searches
      if (!suggestions.find((s) => s.text.toLowerCase() === search.query.toLowerCase())) {
        suggestions.push({
          type: "trending",
          text: search.query,
          count: search._count.query,
        });
      }
    });

    // 3. Category suggestions
    if (query) {
      const categories = await prisma.category.findMany({
        where: {
          name: { contains: query, mode: "insensitive" },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          _count: {
            select: { services: true },
          },
        },
        take: 3,
      });

      categories.forEach((cat) => {
        suggestions.push({
          type: "category",
          text: cat.name,
          count: cat._count.services,
          data: { categoryId: cat.id },
        });
      });
    }

    // 4. Service name suggestions
    if (query && query.length >= 2) {
      const services = await prisma.service.findMany({
        where: {
          name: { contains: query, mode: "insensitive" },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          provider: {
            select: {
              shop: {
                select: { name: true },
              },
            },
          },
        },
        take: 5,
      });

      services.forEach((service) => {
        if (!suggestions.find((s) => s.text.toLowerCase() === service.name.toLowerCase())) {
          suggestions.push({
            type: "service",
            text: service.name,
            data: {
              serviceId: service.id,
              provider: service.provider.shop?.name,
            },
          });
        }
      });
    }

    // 5. Provider/Shop suggestions
    if (query && query.length >= 2) {
      const shops = await prisma.shop.findMany({
        where: {
          name: { contains: query, mode: "insensitive" },
          isApproved: true,
        },
        select: {
          id: true,
          name: true,
          rating: true,
        },
        take: 3,
      });

      shops.forEach((shop) => {
        suggestions.push({
          type: "provider",
          text: shop.name,
          data: {
            shopId: shop.id,
            rating: shop.rating ? Number(shop.rating) : null,
          },
        });
      });
    }

    // Limit total suggestions
    const limitedSuggestions = suggestions.slice(0, limit);

    return NextResponse.json({
      query,
      suggestions: limitedSuggestions,
    });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}
