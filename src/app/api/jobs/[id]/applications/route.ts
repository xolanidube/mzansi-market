import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const applicationSchema = z.object({
  proposal: z.string().min(20, "Proposal must be at least 20 characters"),
  bidAmount: z.number().optional(),
});

const updateApplicationSchema = z.object({
  status: z.enum(["PENDING", "ACCEPTED", "REJECTED", "WITHDRAWN"]),
});

// GET /api/jobs/[id]/applications - Get applications for a job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is the job poster
    const job = await prisma.job.findUnique({
      where: { id },
      select: { posterId: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.posterId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only view applications for your own jobs" },
        { status: 403 }
      );
    }

    const applications = await prisma.jobApplication.findMany({
      where: { jobId: id },
      include: {
        applicant: {
          select: {
            id: true,
            username: true,
            picture: true,
            phone: true,
            shop: {
              select: {
                id: true,
                name: true,
                rating: true,
                totalReviews: true,
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
        applicant: app.applicant,
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

// POST /api/jobs/[id]/applications - Apply to a job
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

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
        { error: "Only service providers can apply to jobs" },
        { status: 403 }
      );
    }

    // Check if job exists and is open
    const job = await prisma.job.findUnique({
      where: { id },
      select: { id: true, posterId: true, status: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== "OPEN") {
      return NextResponse.json(
        { error: "This job is no longer accepting applications" },
        { status: 400 }
      );
    }

    if (job.posterId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot apply to your own job" },
        { status: 400 }
      );
    }

    // Check if already applied
    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        jobId_applicantId: {
          jobId: id,
          applicantId: session.user.id,
        },
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: "You have already applied to this job" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = applicationSchema.parse(body);

    const application = await prisma.jobApplication.create({
      data: {
        jobId: id,
        applicantId: session.user.id,
        proposal: validatedData.proposal,
        bidAmount: validatedData.bidAmount,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Application submitted successfully",
        application: {
          ...application,
          bidAmount: application.bidAmount ? Number(application.bidAmount) : null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting application:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}

// PATCH /api/jobs/[id]/applications - Update application status (for job poster)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("applicationId");

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!applicationId) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      );
    }

    // Check if user is the job poster
    const job = await prisma.job.findUnique({
      where: { id },
      select: { posterId: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Get the application
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      select: { jobId: true, applicantId: true },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Check permissions - job poster can accept/reject, applicant can withdraw
    const isJobPoster = job.posterId === session.user.id;
    const isApplicant = application.applicantId === session.user.id;

    if (!isJobPoster && !isApplicant) {
      return NextResponse.json(
        { error: "You don't have permission to update this application" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateApplicationSchema.parse(body);

    // Applicants can only withdraw
    if (isApplicant && validatedData.status !== "WITHDRAWN") {
      return NextResponse.json(
        { error: "You can only withdraw your application" },
        { status: 403 }
      );
    }

    // Job posters can accept or reject
    if (isJobPoster && validatedData.status === "WITHDRAWN") {
      return NextResponse.json(
        { error: "Only the applicant can withdraw" },
        { status: 403 }
      );
    }

    const updatedApplication = await prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status: validatedData.status },
    });

    // If accepting an application, update job status to IN_PROGRESS
    if (validatedData.status === "ACCEPTED") {
      await prisma.job.update({
        where: { id },
        data: { status: "IN_PROGRESS" },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Application ${validatedData.status.toLowerCase()} successfully`,
      application: updatedApplication,
    });
  } catch (error) {
    console.error("Error updating application:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}
