import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createShareSchema = z.object({
  platform: z.enum(["whatsapp", "facebook", "twitter", "email", "copy"]).optional(),
});

// GET /api/services/[id]/share - Get share stats for a service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serviceId } = await params;

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        name: true,
        providerId: true,
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const shares = await prisma.serviceShare.findMany({
      where: { serviceId },
      select: {
        id: true,
        shareToken: true,
        clickCount: true,
        platform: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const totalClicks = shares.reduce((sum, s) => sum + s.clickCount, 0);
    const byPlatform: Record<string, { shares: number; clicks: number }> = {};

    shares.forEach((s) => {
      const platform = s.platform || "unknown";
      if (!byPlatform[platform]) {
        byPlatform[platform] = { shares: 0, clicks: 0 };
      }
      byPlatform[platform].shares += 1;
      byPlatform[platform].clicks += s.clickCount;
    });

    return NextResponse.json({
      serviceId,
      serviceName: service.name,
      totalShares: shares.length,
      totalClicks,
      byPlatform,
      shares: shares.map((s) => ({
        id: s.id,
        token: s.shareToken,
        clicks: s.clickCount,
        platform: s.platform,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching share stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch share stats" },
      { status: 500 }
    );
  }
}

// POST /api/services/[id]/share - Create a shareable link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: serviceId } = await params;
    const body = await request.json();
    const { platform } = createShareSchema.parse(body);

    const service = await prisma.service.findUnique({
      where: { id: serviceId, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        picture: true,
        provider: {
          select: {
            username: true,
            shop: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found or inactive" },
        { status: 404 }
      );
    }

    const share = await prisma.serviceShare.create({
      data: {
        serviceId,
        createdById: session.user.id,
        platform,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const shareUrl = `${baseUrl}/s/${share.shareToken}`;

    // Generate platform-specific share URLs
    const shareText = `Check out ${service.name} by ${service.provider.shop?.name || service.provider.username}`;
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);

    const platformUrls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      email: `mailto:?subject=${encodedText}&body=${encodedText}%0A%0A${encodedUrl}`,
    };

    return NextResponse.json({
      success: true,
      shareId: share.id,
      token: share.shareToken,
      url: shareUrl,
      platformUrl: platform && platform !== "copy" ? platformUrls[platform] : null,
      service: {
        id: service.id,
        name: service.name,
        description: service.description?.substring(0, 150),
        image: service.picture,
        provider: service.provider.shop?.name || service.provider.username,
      },
    });
  } catch (error) {
    console.error("Error creating share:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create share link" },
      { status: 500 }
    );
  }
}
