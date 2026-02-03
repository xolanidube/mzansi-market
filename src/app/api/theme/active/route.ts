import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_THEME, ThemeColors, ThemeTemplate } from "@/types/theme";

// GET /api/theme/active - Fetch currently active theme (public)
export async function GET() {
  try {
    const theme = await prisma.themeConfig.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        isDefault: true,
        colors: true,
        fonts: true,
        borderRadius: true,
        spacing: true,
        darkMode: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!theme) {
      // Return default theme if none active
      return NextResponse.json(
        {
          id: "default",
          ...DEFAULT_THEME,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          },
        }
      );
    }

    return NextResponse.json(
      {
        id: theme.id,
        name: theme.name,
        description: theme.description,
        isActive: theme.isActive,
        isDefault: theme.isDefault,
        colors: theme.colors as ThemeColors,
        fonts: theme.fonts as ThemeTemplate["fonts"],
        borderRadius: theme.borderRadius as ThemeTemplate["borderRadius"],
        spacing: theme.spacing as ThemeTemplate["spacing"],
        darkMode: theme.darkMode as ThemeColors,
        createdAt: theme.createdAt,
        updatedAt: theme.updatedAt,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching active theme:", error);
    return NextResponse.json(
      { error: "Failed to fetch active theme" },
      { status: 500 }
    );
  }
}
