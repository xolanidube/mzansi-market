import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET /api/applications/my - Get current user's job applications
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const applications = await prisma.jobApplication.findMany({
      where: { applicantId: session.user.id },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            budgetMax: true,
            status: true,
            poster: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      applications: applications.map((app) => ({
        id: app.id,
        proposal: app.proposal,
        bidAmount: app.bidAmount ? Number(app.bidAmount) : null,
        status: app.status,
        createdAt: app.createdAt,
        job: {
          id: app.job.id,
          title: app.job.title,
          budgetMax: app.job.budgetMax ? Number(app.job.budgetMax) : null,
          status: app.job.status,
          poster: app.job.poster,
        },
      })),
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}
