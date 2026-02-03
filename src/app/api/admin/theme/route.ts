import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { DEFAULT_THEME } from "@/types/theme";

const themeColorsSchema = z.object({
  background: z.string(),
  foreground: z.string(),
  primary: z.string(),
  primaryForeground: z.string(),
  secondary: z.string(),
  secondaryForeground: z.string(),
  accent: z.string(),
  accentForeground: z.string(),
  muted: z.string(),
  mutedForeground: z.string(),
  border: z.string(),
  input: z.string(),
  ring: z.string(),
  success: z.string(),
  warning: z.string(),
  error: z.string(),
});

const themeFontsSchema = z.object({
  sans: z.string(),
  mono: z.string(),
});

const themeBorderRadiusSchema = z.object({
  sm: z.string(),
  md: z.string(),
  lg: z.string(),
  xl: z.string(),
  full: z.string(),
});

const createThemeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  colors: themeColorsSchema,
  fonts: themeFontsSchema,
  borderRadius: themeBorderRadiusSchema,
  spacing: z.any().optional(),
  darkMode: themeColorsSchema.optional(),
  isActive: z.boolean().optional(),
});

// GET /api/admin/theme - Fetch all themes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
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

    const themes = await prisma.themeConfig.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: [{ isActive: "desc" }, { isDefault: "desc" }, { name: "asc" }],
    });

    return NextResponse.json(themes);
  } catch (error) {
    console.error("Error fetching themes:", error);
    return NextResponse.json(
      { error: "Failed to fetch themes" },
      { status: 500 }
    );
  }
}

// POST /api/admin/theme - Create new theme
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
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

    const body = await request.json();
    const data = createThemeSchema.parse(body);

    // Check for duplicate name
    const existing = await prisma.themeConfig.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A theme with this name already exists" },
        { status: 400 }
      );
    }

    // If this theme should be active, deactivate others
    if (data.isActive) {
      await prisma.themeConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    const theme = await prisma.themeConfig.create({
      data: {
        name: data.name,
        description: data.description,
        colors: data.colors,
        fonts: data.fonts,
        borderRadius: data.borderRadius,
        spacing: data.spacing,
        darkMode: data.darkMode,
        isActive: data.isActive || false,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      theme,
    });
  } catch (error) {
    console.error("Error creating theme:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create theme" },
      { status: 500 }
    );
  }
}
