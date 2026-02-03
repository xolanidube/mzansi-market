import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const jobSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  categoryId: z.string().optional(),
  subCategory: z.string().optional(),
  skills: z.array(z.string()).optional(),
  jobType: z.enum(["FIX", "HOURLY", "FREELANCE", "FULLTIME", "PARTTIME", "INTERNSHIP", "TEMPORARY", "CUSTOM"]),
  customJobType: z.string().optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  estimatedBudget: z.string().optional(),
  deliveryDays: z.number().optional(),
  preferredLocation: z.string().optional(),
});

// GET /api/jobs - Get jobs with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const posterId = searchParams.get("posterId");
    const categoryId = searchParams.get("categoryId");
    const jobType = searchParams.get("jobType");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const minBudget = searchParams.get("minBudget");
    const maxBudget = searchParams.get("maxBudget");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    // Build filter conditions
    const where: Record<string, unknown> = {};

    // Default to open jobs for public listing
    if (status) {
      where.status = status;
    } else if (!posterId) {
      where.status = "OPEN";
    }

    if (posterId) {
      where.posterId = posterId;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (jobType) {
      where.jobType = jobType;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { skills: { hasSome: [search] } },
      ];
    }

    if (minBudget || maxBudget) {
      where.budgetMax = {};
      if (minBudget) (where.budgetMax as Record<string, number>).gte = parseFloat(minBudget);
      if (maxBudget) (where.budgetMax as Record<string, number>).lte = parseFloat(maxBudget);
    }

    // Get total count
    const total = await prisma.job.count({ where });

    // Get jobs
    const jobs = await prisma.job.findMany({
      where,
      include: {
        poster: {
          select: {
            id: true,
            username: true,
            picture: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Transform jobs
    const transformedJobs = jobs.map((job) => ({
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
      status: job.status,
      createdAt: job.createdAt,
      poster: job.poster,
      applicationCount: job._count.applications,
    }));

    return NextResponse.json({
      jobs: transformedJobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Create a new job
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = jobSchema.parse(body);

    const job = await prisma.job.create({
      data: {
        posterId: session.user.id,
        title: validatedData.title,
        description: validatedData.description,
        categoryId: validatedData.categoryId,
        subCategory: validatedData.subCategory,
        skills: validatedData.skills || [],
        jobType: validatedData.jobType,
        customJobType: validatedData.customJobType,
        budgetMin: validatedData.budgetMin,
        budgetMax: validatedData.budgetMax,
        estimatedBudget: validatedData.estimatedBudget,
        deliveryDays: validatedData.deliveryDays,
        preferredLocation: validatedData.preferredLocation,
        status: "OPEN",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Job posted successfully",
        job: {
          ...job,
          budgetMin: job.budgetMin ? Number(job.budgetMin) : null,
          budgetMax: job.budgetMax ? Number(job.budgetMax) : null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating job:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}
