import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/featured - Get featured services and shops
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "services", "shops", or "all"
    const limit = parseInt(searchParams.get("limit") || "6");

    const results: {
      services?: unknown[];
      shops?: unknown[];
    } = {};

    // Get featured services (using FeaturedService relation)
    if (!type || type === "services" || type === "all") {
      try {
        const featuredServiceEntries = await prisma.featuredService.findMany({
          where: {
            isActive: true,
            startTime: {
              lte: new Date(),
            },
          },
          include: {
            service: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                chargeTime: true,
                picture: true,
                isActive: true,
                categoryId: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                provider: {
                  select: {
                    id: true,
                    username: true,
                    picture: true,
                    shop: {
                      select: {
                        id: true,
                        name: true,
                        rating: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            startTime: "desc",
          },
          take: limit,
        });

        // Filter to only include services that are still within their featured period
        const now = new Date();
        const validFeaturedServices = featuredServiceEntries.filter((entry) => {
          const endDate = new Date(entry.startTime);
          endDate.setDate(endDate.getDate() + entry.days);
          return endDate > now && entry.service.isActive;
        });

        results.services = validFeaturedServices.map((entry) => ({
          id: entry.service.id,
          name: entry.service.name,
          description: entry.service.description,
          price: entry.service.price ? Number(entry.service.price) : null,
          chargeTime: entry.service.chargeTime,
          picture: entry.service.picture,
          category: entry.service.category,
          provider: {
            id: entry.service.provider.id,
            name: entry.service.provider.username,
            picture: entry.service.provider.picture,
            shop: entry.service.provider.shop,
          },
          featuredUntil: (() => {
            const endDate = new Date(entry.startTime);
            endDate.setDate(endDate.getDate() + entry.days);
            return endDate;
          })(),
        }));
      } catch (serviceError) {
        console.error("Error fetching featured services:", serviceError);
        results.services = [];
      }
    }

    // Get top-rated approved shops
    if (!type || type === "shops" || type === "all") {
      const featuredShops = await prisma.shop.findMany({
        where: {
          isApproved: true,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              _count: {
                select: {
                  services: true,
                },
              },
            },
          },
        },
        orderBy: [
          { rating: "desc" },
          { totalReviews: "desc" },
          { createdAt: "desc" },
        ],
        take: limit,
      });

      results.shops = featuredShops.map((shop) => ({
        id: shop.id,
        name: shop.name,
        description: shop.description,
        address: shop.address,
        rating: shop.rating,
        reviewCount: shop.totalReviews,
        logo: shop.profileUrl,
        coverImage: shop.coverUrl,
        serviceCount: shop.user._count.services,
        owner: {
          id: shop.user.id,
          username: shop.user.username,
        },
      }));
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching featured items:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured items" },
      { status: 500 }
    );
  }
}
