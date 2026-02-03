import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ReportType } from "@prisma/client";

const createReportSchema = z.object({
  type: z.nativeEnum(ReportType),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000, "Description must be less than 2000 characters"),
  evidence: z.array(z.string().url()).optional(),
  // One of these must be provided
  reportedUserId: z.string().optional(),
  reportedServiceId: z.string().optional(),
  reportedReviewId: z.string().optional(),
}).refine(
  (data) => data.reportedUserId || data.reportedServiceId || data.reportedReviewId,
  { message: "Must specify what you are reporting (user, service, or review)" }
);

// GET /api/reports - Get user's submitted reports
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {
      reporterId: session.user.id,
    };

    if (status) {
      where.status = status;
    }

    const [reports, total] = await Promise.all([
      prisma.contentReport.findMany({
        where,
        include: {
          reportedUser: {
            select: {
              id: true,
              username: true,
              picture: true,
            },
          },
          reportedService: {
            select: {
              id: true,
              name: true,
            },
          },
          reportedReview: {
            select: {
              id: true,
              text: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contentReport.count({ where }),
    ]);

    return NextResponse.json({
      reports: reports.map((r) => ({
        id: r.id,
        type: r.type,
        description: r.description,
        status: r.status,
        createdAt: r.createdAt,
        resolvedAt: r.resolvedAt,
        reportedUser: r.reportedUser,
        reportedService: r.reportedService,
        reportedReview: r.reportedReview
          ? {
              id: r.reportedReview.id,
              preview: r.reportedReview.text?.substring(0, 100),
            }
          : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

// POST /api/reports - Submit a new report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createReportSchema.parse(body);

    // Validate the reported entity exists
    if (validatedData.reportedUserId) {
      const user = await prisma.user.findUnique({
        where: { id: validatedData.reportedUserId },
      });
      if (!user) {
        return NextResponse.json({ error: "Reported user not found" }, { status: 404 });
      }
      // Can't report yourself
      if (validatedData.reportedUserId === session.user.id) {
        return NextResponse.json({ error: "Cannot report yourself" }, { status: 400 });
      }
    }

    if (validatedData.reportedServiceId) {
      const service = await prisma.service.findUnique({
        where: { id: validatedData.reportedServiceId },
      });
      if (!service) {
        return NextResponse.json({ error: "Reported service not found" }, { status: 404 });
      }
    }

    if (validatedData.reportedReviewId) {
      const review = await prisma.review.findUnique({
        where: { id: validatedData.reportedReviewId },
      });
      if (!review) {
        return NextResponse.json({ error: "Reported review not found" }, { status: 404 });
      }
      // Can't report your own review
      if (review.senderId === session.user.id) {
        return NextResponse.json({ error: "Cannot report your own review" }, { status: 400 });
      }
    }

    // Check for duplicate reports
    const existingReport = await prisma.contentReport.findFirst({
      where: {
        reporterId: session.user.id,
        reportedUserId: validatedData.reportedUserId || undefined,
        reportedServiceId: validatedData.reportedServiceId || undefined,
        reportedReviewId: validatedData.reportedReviewId || undefined,
        status: { in: ["PENDING", "UNDER_REVIEW"] },
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { error: "You have already reported this content and it is under review" },
        { status: 400 }
      );
    }

    // Create the report
    const report = await prisma.contentReport.create({
      data: {
        type: validatedData.type,
        description: validatedData.description,
        evidence: validatedData.evidence || [],
        reporterId: session.user.id,
        reportedUserId: validatedData.reportedUserId,
        reportedServiceId: validatedData.reportedServiceId,
        reportedReviewId: validatedData.reportedReviewId,
      },
    });

    // Notify admins (create a system notification)
    try {
      const admins = await prisma.user.findMany({
        where: { userType: "ADMIN" },
        select: { id: true },
      });

      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            type: "SYSTEM" as const,
            title: "New Content Report",
            message: `A new ${validatedData.type.toLowerCase().replace("_", " ")} report has been submitted`,
            metadata: {
              reportId: report.id,
              type: validatedData.type,
            },
          })),
        });
      }
    } catch (notificationError) {
      console.error("Failed to notify admins:", notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: "Report submitted successfully. Our team will review it.",
    });
  } catch (error) {
    console.error("Error creating report:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to submit report" },
      { status: 500 }
    );
  }
}
