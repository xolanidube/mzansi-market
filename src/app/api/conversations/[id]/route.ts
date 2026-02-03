import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET /api/conversations/[id] - Get all messages with a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: partnerId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get partner info
    const partner = await prisma.user.findUnique({
      where: { id: partnerId },
      select: {
        id: true,
        username: true,
        picture: true,
        email: true,
        shop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!partner) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all messages between these two users
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            picture: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Mark all unread messages from partner as read
    await prisma.message.updateMany({
      where: {
        senderId: partnerId,
        receiverId: userId,
        status: "UNREAD",
      },
      data: { status: "READ" },
    });

    return NextResponse.json({
      partner,
      messages,
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}
