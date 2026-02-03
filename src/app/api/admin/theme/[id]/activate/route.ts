import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/admin/theme/[id]/activate - Activate a theme
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userType: true },
    });

    if (user?.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const theme = await prisma.themeConfig.findUnique({
      where: { id },
    });

    if (!theme) {
      return NextResponse.json({ error: "Theme not found" }, { status: 404 });
    }

    // Use transaction to ensure atomicity
    await prisma.$transaction([
      // Deactivate all themes
      prisma.themeConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      }),
      // Activate the selected theme
      prisma.themeConfig.update({
        where: { id },
        data: { isActive: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Theme "${theme.name}" activated successfully`,
    });
  } catch (error) {
    console.error("Error activating theme:", error);
    return NextResponse.json(
      { error: "Failed to activate theme" },
      { status: 500 }
    );
  }
}
