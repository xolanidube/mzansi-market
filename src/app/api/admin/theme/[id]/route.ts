import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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

const updateThemeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  colors: themeColorsSchema.optional(),
  fonts: themeFontsSchema.optional(),
  borderRadius: themeBorderRadiusSchema.optional(),
  spacing: z.any().optional(),
  darkMode: themeColorsSchema.optional(),
});

// GET /api/admin/theme/[id] - Get single theme
export async function GET(
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
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!theme) {
      return NextResponse.json({ error: "Theme not found" }, { status: 404 });
    }

    return NextResponse.json(theme);
  } catch (error) {
    console.error("Error fetching theme:", error);
    return NextResponse.json(
      { error: "Failed to fetch theme" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/theme/[id] - Update theme
export async function PUT(
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

    const existing = await prisma.themeConfig.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Theme not found" }, { status: 404 });
    }

    const body = await request.json();
    const data = updateThemeSchema.parse(body);

    // Check for duplicate name if name is being changed
    if (data.name && data.name !== existing.name) {
      const duplicate = await prisma.themeConfig.findUnique({
        where: { name: data.name },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "A theme with this name already exists" },
          { status: 400 }
        );
      }
    }

    const theme = await prisma.themeConfig.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.colors !== undefined && { colors: data.colors }),
        ...(data.fonts !== undefined && { fonts: data.fonts }),
        ...(data.borderRadius !== undefined && { borderRadius: data.borderRadius }),
        ...(data.spacing !== undefined && { spacing: data.spacing }),
        ...(data.darkMode !== undefined && { darkMode: data.darkMode }),
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
    console.error("Error updating theme:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update theme" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/theme/[id] - Delete theme
export async function DELETE(
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

    if (theme.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete the default theme" },
        { status: 400 }
      );
    }

    if (theme.isActive) {
      return NextResponse.json(
        { error: "Cannot delete an active theme. Activate another theme first." },
        { status: 400 }
      );
    }

    await prisma.themeConfig.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Theme deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting theme:", error);
    return NextResponse.json(
      { error: "Failed to delete theme" },
      { status: 500 }
    );
  }
}
