import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const blockedTimeSchema = z.object({
  date: z.string().min(1, "Date is required"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional().nullable(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional().nullable(),
  reason: z.string().max(200).optional(),
});

// GET /api/availability/blocked - Get blocked times
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = {
      providerId: session.user.id,
    };

    if (startDate) {
      where.date = { gte: new Date(startDate) };
    }
    if (endDate) {
      where.date = {
        ...(where.date as Record<string, unknown>),
        lte: new Date(endDate),
      };
    }

    const blockedTimes = await prisma.blockedTime.findMany({
      where,
      orderBy: { date: "asc" },
    });

    return NextResponse.json({
      blockedTimes: blockedTimes.map((b) => ({
        id: b.id,
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
        reason: b.reason,
        isWholeDay: !b.startTime && !b.endTime,
      })),
    });
  } catch (error) {
    console.error("Error fetching blocked times:", error);
    return NextResponse.json(
      { error: "Failed to fetch blocked times" },
      { status: 500 }
    );
  }
}

// POST /api/availability/blocked - Add blocked time
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a service provider
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userType: true },
    });

    if (user?.userType !== "SERVICE_PROVIDER") {
      return NextResponse.json(
        { error: "Only service providers can block times" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = blockedTimeSchema.parse(body);

    // Check if date is in the future
    const blockDate = new Date(validatedData.date);
    if (blockDate < new Date()) {
      return NextResponse.json(
        { error: "Cannot block times in the past" },
        { status: 400 }
      );
    }

    const blockedTime = await prisma.blockedTime.create({
      data: {
        providerId: session.user.id,
        date: blockDate,
        startTime: validatedData.startTime || null,
        endTime: validatedData.endTime || null,
        reason: validatedData.reason,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Time blocked successfully",
      blockedTime: {
        id: blockedTime.id,
        date: blockedTime.date,
        startTime: blockedTime.startTime,
        endTime: blockedTime.endTime,
        reason: blockedTime.reason,
        isWholeDay: !blockedTime.startTime && !blockedTime.endTime,
      },
    });
  } catch (error) {
    console.error("Error blocking time:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to block time" },
      { status: 500 }
    );
  }
}

// DELETE /api/availability/blocked - Remove blocked time
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
        { error: "Blocked time ID is required" },
        { status: 400 }
      );
    }

    await prisma.blockedTime.deleteMany({
      where: {
        id,
        providerId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Blocked time removed",
    });
  } catch (error) {
    console.error("Error removing blocked time:", error);
    return NextResponse.json(
      { error: "Failed to remove blocked time" },
      { status: 500 }
    );
  }
}
