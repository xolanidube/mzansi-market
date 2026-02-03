import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ReportStatus } from "@prisma/client";

const updateReportSchema = z.object({
  reportId: z.string(),
  status: z.nativeEnum(ReportStatus),
  adminNotes: z.string().optional(),
  // Actions to take
  action: z.enum([
    "NONE",
    "WARN_USER",
    "SUSPEND_USER",
    "BAN_USER",
    "HIDE_CONTENT",
    "DELETE_CONTENT",
  ]).optional(),
});

// GET /api/admin/reports - Get all reports (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userType: true },
    });

    if (user?.userType !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const [reports, total, statusCounts] = await Promise.all([
      prisma.contentReport.findMany({
        where,
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
              email: true,
              picture: true,
            },
          },
          reportedUser: {
            select: {
              id: true,
              username: true,
              email: true,
              picture: true,
              userType: true,
            },
          },
          reportedService: {
            select: {
              id: true,
              name: true,
              provider: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
          reportedReview: {
            select: {
              id: true,
              text: true,
              rating: true,
              sender: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
          resolvedBy: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: [
          { status: "asc" }, // Pending first
          { createdAt: "desc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contentReport.count({ where }),
      prisma.contentReport.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]);

    return NextResponse.json({
      reports: reports.map((r) => ({
        id: r.id,
        type: r.type,
        description: r.description,
        evidence: r.evidence,
        status: r.status,
        adminNotes: r.adminNotes,
        createdAt: r.createdAt,
        resolvedAt: r.resolvedAt,
        reporter: r.reporter,
        reportedUser: r.reportedUser,
        reportedService: r.reportedService,
        reportedReview: r.reportedReview,
        resolvedBy: r.resolvedBy,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      statusCounts: statusCounts.reduce(
        (acc, item) => {
          acc[item.status] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/reports - Update report status (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userType: true },
    });

    if (adminUser?.userType !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { reportId, status, adminNotes, action } = updateReportSchema.parse(body);

    // Get the report
    const report = await prisma.contentReport.findUnique({
      where: { id: reportId },
      include: {
        reportedUser: true,
        reportedService: true,
        reportedReview: true,
        reporter: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Handle actions
    if (action && action !== "NONE") {
      switch (action) {
        case "WARN_USER":
          if (report.reportedUserId) {
            // Create a warning notification
            await prisma.notification.create({
              data: {
                userId: report.reportedUserId,
                type: "SYSTEM",
                title: "Account Warning",
                message: "Your account has received a warning due to a policy violation. Please review our community guidelines.",
                metadata: {
                  reportType: report.type,
                  isWarning: true,
                },
              },
            });
          }
          break;

        case "SUSPEND_USER":
          if (report.reportedUserId) {
            await prisma.user.update({
              where: { id: report.reportedUserId },
              data: {
                isActive: false,
              },
            });
            await prisma.notification.create({
              data: {
                userId: report.reportedUserId,
                type: "SYSTEM",
                title: "Account Suspended",
                message: "Your account has been suspended due to policy violations. Contact support for more information.",
                metadata: {
                  reportType: report.type,
                  isSuspension: true,
                },
              },
            });
          }
          break;

        case "BAN_USER":
          if (report.reportedUserId) {
            await prisma.user.update({
              where: { id: report.reportedUserId },
              data: {
                isActive: false,
              },
            });
          }
          break;

        case "HIDE_CONTENT":
          if (report.reportedServiceId) {
            await prisma.service.update({
              where: { id: report.reportedServiceId },
              data: { isActive: false },
            });
          }
          if (report.reportedReviewId) {
            // Delete the review since there's no hidden status
            await prisma.review.delete({
              where: { id: report.reportedReviewId },
            });
          }
          break;

        case "DELETE_CONTENT":
          if (report.reportedServiceId) {
            await prisma.service.delete({
              where: { id: report.reportedServiceId },
            });
          }
          if (report.reportedReviewId) {
            await prisma.review.delete({
              where: { id: report.reportedReviewId },
            });
          }
          break;
      }
    }

    // Update the report
    const updatedReport = await prisma.contentReport.update({
      where: { id: reportId },
      data: {
        status,
        adminNotes,
        resolvedAt: ["RESOLVED", "DISMISSED"].includes(status) ? new Date() : null,
        resolvedById: ["RESOLVED", "DISMISSED"].includes(status) ? session.user.id : null,
      },
    });

    // Notify the reporter
    if (["RESOLVED", "DISMISSED"].includes(status)) {
      await prisma.notification.create({
        data: {
          userId: report.reporterId,
          type: "SYSTEM",
          title: "Report Update",
          message: status === "RESOLVED"
            ? "Your report has been reviewed and action has been taken. Thank you for helping keep our community safe."
            : "Your report has been reviewed. After investigation, no action was taken at this time.",
          metadata: {
            reportId: report.id,
            status,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      report: {
        id: updatedReport.id,
        status: updatedReport.status,
        adminNotes: updatedReport.adminNotes,
        resolvedAt: updatedReport.resolvedAt,
      },
    });
  } catch (error) {
    console.error("Error updating report:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    );
  }
}
