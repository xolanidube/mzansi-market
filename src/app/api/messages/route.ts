import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const messageSchema = z.object({
  receiverId: z.string().min(1, "Receiver is required"),
  subject: z.string().optional(),
  content: z.string().min(1, "Message content is required"),
});

// GET /api/messages - Get messages (inbox or sent)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder") || "inbox"; // inbox, sent, all
    const status = searchParams.get("status"); // UNREAD, READ
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build filter conditions
    const where: Record<string, unknown> = {};

    if (folder === "inbox") {
      where.receiverId = session.user.id;
    } else if (folder === "sent") {
      where.senderId = session.user.id;
    } else {
      where.OR = [
        { senderId: session.user.id },
        { receiverId: session.user.id },
      ];
    }

    if (status) {
      where.status = status;
    }

    // Get total count
    const total = await prisma.message.count({ where });

    // Get unread count
    const unreadCount = await prisma.message.count({
      where: {
        receiverId: session.user.id,
        status: "UNREAD",
      },
    });

    // Get messages
    const messages = await prisma.message.findMany({
      where,
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
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      messages,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/messages - Send a new message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = messageSchema.parse(body);

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: validatedData.receiverId },
      select: { id: true, username: true },
    });

    if (!receiver) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }

    // Can't send message to yourself
    if (validatedData.receiverId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot send a message to yourself" },
        { status: 400 }
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId: validatedData.receiverId,
        subject: validatedData.subject,
        content: validatedData.content,
        status: "UNREAD",
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
    });

    return NextResponse.json(
      {
        success: true,
        message: "Message sent successfully",
        data: message,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error sending message:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
