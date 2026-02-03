import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET /api/conversations - Get all conversations (grouped by user)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all unique conversation partners
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
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
        receiver: {
          select: {
            id: true,
            username: true,
            picture: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group messages by conversation partner
    const conversationsMap = new Map<string, {
      partnerId: string;
      partner: { id: string; username: string; picture: string | null };
      lastMessage: typeof messages[0];
      unreadCount: number;
      messageCount: number;
    }>();

    for (const message of messages) {
      const partnerId = message.senderId === userId ? message.receiverId : message.senderId;
      const partner = message.senderId === userId ? message.receiver : message.sender;

      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          partnerId,
          partner,
          lastMessage: message,
          unreadCount: 0,
          messageCount: 0,
        });
      }

      const conv = conversationsMap.get(partnerId)!;
      conv.messageCount++;

      // Count unread messages (only those received by current user)
      if (message.receiverId === userId && message.status === "UNREAD") {
        conv.unreadCount++;
      }
    }

    // Convert to array and sort by last message date
    const conversations = Array.from(conversationsMap.values()).sort(
      (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );

    // Get total unread count
    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

    return NextResponse.json({
      conversations,
      totalUnread,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
