import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/s/[token] - Handle share link redirect and tracking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const share = await prisma.serviceShare.findUnique({
      where: { shareToken: token },
      include: {
        service: {
          select: {
            id: true,
            uniqueKey: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    if (!share) {
      // Redirect to home with error
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      return NextResponse.redirect(`${baseUrl}?error=invalid-share`);
    }

    if (share.expiresAt && share.expiresAt < new Date()) {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      return NextResponse.redirect(`${baseUrl}?error=share-expired`);
    }

    if (!share.service.isActive) {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      return NextResponse.redirect(`${baseUrl}?error=service-unavailable`);
    }

    // Increment click count
    await prisma.serviceShare.update({
      where: { id: share.id },
      data: {
        clickCount: { increment: 1 },
      },
    });

    // Redirect to service page
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const serviceUrl = `${baseUrl}/services/${share.service.id}?ref=${token}`;

    return NextResponse.redirect(serviceUrl);
  } catch (error) {
    console.error("Error handling share redirect:", error);
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}?error=share-error`);
  }
}
