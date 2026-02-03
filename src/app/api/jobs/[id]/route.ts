import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const updateJobSchema = z.object({
  title: z.string().min(5).optional(),
  description: z.string().min(20).optional(),
  categoryId: z.string().optional(),
  subCategory: z.string().optional(),
  skills: z.array(z.string()).optional(),
  jobType: z.enum(["FIX", "HOURLY", "FREELANCE", "FULLTIME", "PARTTIME", "INTERNSHIP", "TEMPORARY", "CUSTOM"]).optional(),
  customJobType: z.string().optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  estimatedBudget: z.string().optional(),
  deliveryDays: z.number().optional(),
  preferredLocation: z.string().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED", "CLOSED"]).optional(),
});

// GET /api/jobs/[id] - Get a specific job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        poster: {
          select: {
            id: true,
            username: true,
            picture: true,
            createdAt: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        applications: {
          include: {
            applicant: {
              select: {
                id: true,
                username: true,
                picture: true,
                shop: {
                  select: {
                    id: true,
                    name: true,
                    rating: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Get similar jobs
    const similarJobs = await prisma.job.findMany({
      where: {
        id: { not: job.id },
        status: "OPEN",
        OR: [
          { categoryId: job.categoryId },
          { skills: { hasSome: job.skills } },
        ],
      },
      include: {
        poster: {
          select: {
            id: true,
            username: true,
            picture: true,
          },
        },
        _count: {
          select: { applications: true },
        },
      },
      take: 4,
    });

    // Transform job
    const transformedJob = {
      id: job.id,
      title: job.title,
      description: job.description,
      category: job.category?.name || "Other",
      categoryId: job.categoryId,
      subCategory: job.subCategory,
      skills: job.skills,
      jobType: job.jobType,
      customJobType: job.customJobType,
      budgetMin: job.budgetMin ? Number(job.budgetMin) : null,
      budgetMax: job.budgetMax ? Number(job.budgetMax) : null,
      estimatedBudget: job.estimatedBudget,
      deliveryDays: job.deliveryDays,
      preferredLocation: job.preferredLocation,
      featuredImage: job.featuredImage,
      attachments: job.attachments,
      status: job.status,
      createdAt: job.createdAt,
      poster: job.poster,
      applications: job.applications.map((app) => ({
        id: app.id,
        proposal: app.proposal,
        bidAmount: app.bidAmount ? Number(app.bidAmount) : null,
        status: app.status,
        createdAt: app.createdAt,
        applicant: app.applicant,
      })),
    };

    return NextResponse.json({
      job: transformedJob,
      similarJobs: similarJobs.map((j) => ({
        id: j.id,
        title: j.title,
        budgetMin: j.budgetMin ? Number(j.budgetMin) : null,
        budgetMax: j.budgetMax ? Number(j.budgetMax) : null,
        jobType: j.jobType,
        createdAt: j.createdAt,
        poster: j.poster,
        applicationCount: j._count.applications,
      })),
    });
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { error: "Failed to fetch job" },
      { status: 500 }
    );
  }
}

// PATCH /api/jobs/[id] - Update a job
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if job belongs to user
    const job = await prisma.job.findUnique({
      where: { id },
      select: { posterId: true, status: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.posterId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only update your own jobs" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateJobSchema.parse(body);

    const updatedJob = await prisma.job.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      message: "Job updated successfully",
      job: {
        ...updatedJob,
        budgetMin: updatedJob.budgetMin ? Number(updatedJob.budgetMin) : null,
        budgetMax: updatedJob.budgetMax ? Number(updatedJob.budgetMax) : null,
      },
    });
  } catch (error) {
    console.error("Error updating job:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update job" },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/[id] - Delete a job
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if job belongs to user
    const job = await prisma.job.findUnique({
      where: { id },
      select: { posterId: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.posterId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only delete your own jobs" },
        { status: 403 }
      );
    }

    // Soft delete - close the job
    await prisma.job.update({
      where: { id },
      data: { status: "CLOSED" },
    });

    return NextResponse.json({
      success: true,
      message: "Job closed successfully",
    });
  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json(
      { error: "Failed to delete job" },
      { status: 500 }
    );
  }
}
