import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  iconPath: z.string().optional(),
  isActive: z.boolean().optional(),
});

const updateCategorySchema = z.object({
  categoryId: z.string(),
  name: z.string().min(2).max(100).optional(),
  description: z.string().optional(),
  iconPath: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/admin/categories - Get all categories with stats (admin only)
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
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (!includeInactive) {
      where.isActive = true;
    }

    const categories = await prisma.category.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        iconPath: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            services: true,
            jobs: true,
            products: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Get totals
    const totals = await prisma.category.aggregate({
      _count: { id: true },
      where: { isActive: true },
    });

    return NextResponse.json({
      categories: categories.map((cat: typeof categories[number]) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        iconPath: cat.iconPath,
        isActive: cat.isActive,
        createdAt: cat.createdAt,
        counts: {
          services: cat._count.services,
          jobs: cat._count.jobs,
          products: cat._count.products,
          total: cat._count.services + cat._count.jobs + cat._count.products,
        },
      })),
      total: totals._count.id,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST /api/admin/categories - Create a new category (admin only)
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
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, iconPath, isActive } = categorySchema.parse(body);

    // Check if category with same name exists
    const existing = await prisma.category.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        iconPath,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      category: {
        id: category.id,
        name: category.name,
        description: category.description,
        iconPath: category.iconPath,
        isActive: category.isActive,
        createdAt: category.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating category:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/categories - Update a category (admin only)
export async function PATCH(request: NextRequest) {
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
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { categoryId, name, description, iconPath, isActive } = updateCategorySchema.parse(body);

    // Check if category exists
    const existing = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // If name is being changed, check for duplicates
    if (name && name !== existing.name) {
      const duplicate = await prisma.category.findUnique({
        where: { name },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "A category with this name already exists" },
          { status: 400 }
        );
      }
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(iconPath !== undefined && { iconPath }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({
      success: true,
      category: {
        id: category.id,
        name: category.name,
        description: category.description,
        iconPath: category.iconPath,
        isActive: category.isActive,
      },
    });
  } catch (error) {
    console.error("Error updating category:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/categories - Delete a category (admin only)
export async function DELETE(request: NextRequest) {
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
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("id");

    if (!categoryId) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    // Check if category exists and has items
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            services: true,
            jobs: true,
            products: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const totalItems = category._count.services + category._count.jobs + category._count.products;

    if (totalItems > 0) {
      return NextResponse.json(
        { error: `Cannot delete category with ${totalItems} associated items. Deactivate it instead.` },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
