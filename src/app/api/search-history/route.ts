import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addSearchSchema = z.object({
  query: z.string().min(1).max(200),
  filters: z.record(z.string(), z.unknown()).optional(),
  results: z.number().int().min(0).optional(),
});

// GET /api/search-history - Get user's search history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    const history = await prisma.searchHistory.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        query: true,
        filters: true,
        results: true,
        createdAt: true,
      },
    });

    // Get unique queries for suggestions
    const uniqueQueries = [...new Set(history.map((h) => h.query))].slice(0, 10);

    return NextResponse.json({
      history,
      suggestions: uniqueQueries,
    });
  } catch (error) {
    console.error("Error fetching search history:", error);
    return NextResponse.json(
      { error: "Failed to fetch search history" },
      { status: 500 }
    );
  }
}

// POST /api/search-history - Add search to history
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { query, filters, results } = addSearchSchema.parse(body);

    // Don't add duplicate recent searches (within last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existingRecent = await prisma.searchHistory.findFirst({
      where: {
        userId: session.user.id,
        query,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (existingRecent) {
      return NextResponse.json({
        success: true,
        id: existingRecent.id,
        message: "Search already in recent history",
      });
    }

    const entry = await prisma.searchHistory.create({
      data: {
        userId: session.user.id,
        query,
        filters: filters ? JSON.parse(JSON.stringify(filters)) : undefined,
        results: results || 0,
      },
    });

    // Keep only last 100 searches per user
    const oldSearches = await prisma.searchHistory.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip: 100,
      select: { id: true },
    });

    if (oldSearches.length > 0) {
      await prisma.searchHistory.deleteMany({
        where: {
          id: { in: oldSearches.map((s) => s.id) },
        },
      });
    }

    return NextResponse.json({
      success: true,
      id: entry.id,
    });
  } catch (error) {
    console.error("Error adding search history:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to add search history" },
      { status: 500 }
    );
  }
}

// DELETE /api/search-history - Clear search history
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      // Delete specific entry
      await prisma.searchHistory.deleteMany({
        where: {
          id,
          userId: session.user.id,
        },
      });
    } else {
      // Clear all history
      await prisma.searchHistory.deleteMany({
        where: { userId: session.user.id },
      });
    }

    return NextResponse.json({
      success: true,
      message: id ? "Search entry deleted" : "Search history cleared",
    });
  } catch (error) {
    console.error("Error deleting search history:", error);
    return NextResponse.json(
      { error: "Failed to delete search history" },
      { status: 500 }
    );
  }
}
