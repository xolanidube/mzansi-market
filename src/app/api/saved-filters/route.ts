import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createFilterSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["services", "products", "providers"]),
  filters: z.record(z.string(), z.unknown()),
  isDefault: z.boolean().optional(),
});

const updateFilterSchema = createFilterSchema.partial().extend({
  id: z.string(),
});

// GET /api/saved-filters - Get user's saved filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (type) {
      where.type = type;
    }

    const filters = await prisma.savedFilter.findMany({
      where,
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({
      filters: filters.map((f) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        filters: f.filters,
        isDefault: f.isDefault,
        createdAt: f.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching saved filters:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved filters" },
      { status: 500 }
    );
  }
}

// POST /api/saved-filters - Create a saved filter
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, filters, isDefault } = createFilterSchema.parse(body);

    // If setting as default, unset other defaults of same type
    if (isDefault) {
      await prisma.savedFilter.updateMany({
        where: {
          userId: session.user.id,
          type,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Limit to 20 saved filters per user
    const count = await prisma.savedFilter.count({
      where: { userId: session.user.id },
    });

    if (count >= 20) {
      return NextResponse.json(
        { error: "Maximum 20 saved filters allowed" },
        { status: 400 }
      );
    }

    const savedFilter = await prisma.savedFilter.create({
      data: {
        userId: session.user.id,
        name,
        type,
        filters: JSON.parse(JSON.stringify(filters)),
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json({
      success: true,
      filter: {
        id: savedFilter.id,
        name: savedFilter.name,
        type: savedFilter.type,
        filters: savedFilter.filters,
        isDefault: savedFilter.isDefault,
      },
    });
  } catch (error) {
    console.error("Error creating saved filter:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create saved filter" },
      { status: 500 }
    );
  }
}

// PATCH /api/saved-filters - Update a saved filter
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = updateFilterSchema.parse(body);

    // Verify ownership
    const existing = await prisma.savedFilter.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Filter not found" },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults
    if (updates.isDefault) {
      await prisma.savedFilter.updateMany({
        where: {
          userId: session.user.id,
          type: updates.type || existing.type,
          isDefault: true,
          id: { not: id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.filters !== undefined) updateData.filters = JSON.parse(JSON.stringify(updates.filters));
    if (updates.isDefault !== undefined) updateData.isDefault = updates.isDefault;

    const updated = await prisma.savedFilter.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      filter: {
        id: updated.id,
        name: updated.name,
        type: updated.type,
        filters: updated.filters,
        isDefault: updated.isDefault,
      },
    });
  } catch (error) {
    console.error("Error updating saved filter:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update saved filter" },
      { status: 500 }
    );
  }
}

// DELETE /api/saved-filters - Delete a saved filter
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Filter ID is required" },
        { status: 400 }
      );
    }

    const result = await prisma.savedFilter.deleteMany({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Filter not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Filter deleted",
    });
  } catch (error) {
    console.error("Error deleting saved filter:", error);
    return NextResponse.json(
      { error: "Failed to delete saved filter" },
      { status: 500 }
    );
  }
}
