import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ActivityItem = {
  id: string;
  type: "booking" | "message" | "review" | "job_application" | "order";
  title: string;
  description: string;
  timestamp: Date;
  status?: string;
  link?: string;
};

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const userId = session.user.id;
    const isProvider = session.user.userType === "SERVICE_PROVIDER";

    const activities: ActivityItem[] = [];

    // Get recent appointments/bookings
    const appointments = await prisma.appointment.findMany({
      where: isProvider
        ? { providerId: userId }
        : { requesterId: userId },
      include: {
        requester: { select: { username: true } },
        provider: { select: { username: true } },
        service: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    appointments.forEach((apt) => {
      const otherUser = isProvider ? apt.requester.username : apt.provider.username;
      const statusMessages: Record<string, string> = {
        PENDING: `Pending appointment with ${otherUser}`,
        CONFIRMED: `Appointment confirmed with ${otherUser}`,
        COMPLETED: `Appointment completed with ${otherUser}`,
        CANCELLED: `Appointment cancelled with ${otherUser}`,
        NO_SHOW: `No-show for appointment with ${otherUser}`,
      };

      activities.push({
        id: `apt-${apt.id}`,
        type: "booking",
        title: apt.status === "CONFIRMED" ? "Booking Confirmed" : `Booking ${apt.status.toLowerCase()}`,
        description: statusMessages[apt.status] || `Appointment for ${apt.service?.name || "service"}`,
        timestamp: apt.updatedAt,
        status: apt.status,
        link: `/dashboard/bookings/${apt.id}`,
      });
    });

    // Get recent messages
    const messages = await prisma.message.findMany({
      where: { receiverId: userId },
      include: {
        sender: { select: { username: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    messages.forEach((msg) => {
      activities.push({
        id: `msg-${msg.id}`,
        type: "message",
        title: msg.status === "UNREAD" ? "New Message" : "Message",
        description: `${msg.sender.username} sent you a message${msg.subject ? `: ${msg.subject}` : ""}`,
        timestamp: msg.createdAt,
        status: msg.status,
        link: `/dashboard/messages/${msg.id}`,
      });
    });

    // Get recent reviews
    const reviews = await prisma.review.findMany({
      where: { receiverId: userId },
      include: {
        sender: { select: { username: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    reviews.forEach((review) => {
      activities.push({
        id: `rev-${review.id}`,
        type: "review",
        title: "New Review",
        description: `${review.sender.username} left a ${review.rating}-star review`,
        timestamp: review.createdAt,
        link: "/dashboard/reviews",
      });
    });

    // Get job applications (for providers or job posters)
    if (isProvider) {
      const applications = await prisma.jobApplication.findMany({
        where: { applicantId: userId },
        include: {
          job: { select: { title: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      });

      applications.forEach((app) => {
        activities.push({
          id: `app-${app.id}`,
          type: "job_application",
          title: `Application ${app.status.toLowerCase()}`,
          description: `Your application for "${app.job.title}"`,
          timestamp: app.updatedAt,
          status: app.status,
          link: "/dashboard/applications",
        });
      });
    } else {
      // For clients - get applications to their jobs
      const jobsWithApplications = await prisma.job.findMany({
        where: { posterId: userId },
        include: {
          applications: {
            include: {
              applicant: { select: { username: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
        take: 5,
      });

      jobsWithApplications.forEach((job) => {
        job.applications.forEach((app) => {
          activities.push({
            id: `app-${app.id}`,
            type: "job_application",
            title: "New Application",
            description: `${app.applicant.username} applied to "${job.title}"`,
            timestamp: app.createdAt,
            status: app.status,
            link: `/dashboard/jobs/${job.id}/applications`,
          });
        });
      });
    }

    // Get recent orders
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });

    orders.forEach((order) => {
      activities.push({
        id: `ord-${order.id}`,
        type: "order",
        title: `Order ${order.status.toLowerCase()}`,
        description: `Order #${order.orderNumber.slice(-8)} - R${order.totalAmount}`,
        timestamp: order.updatedAt,
        status: order.status,
        link: `/dashboard/orders/${order.id}`,
      });
    });

    // Sort all activities by timestamp
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const paginatedActivities = activities.slice(offset, offset + limit);

    return NextResponse.json({
      activities: paginatedActivities,
      total: activities.length,
      hasMore: offset + limit < activities.length,
    });
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}
