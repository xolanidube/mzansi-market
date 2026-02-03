import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET /api/messages/[id] - Get a specific message
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

    const message = await prisma.message.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            picture: true,
            email: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            picture: true,
            email: true,
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Check if user is part of this conversation
    if (message.senderId !== session.user.id && message.receiverId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have access to this message" },
        { status: 403 }
      );
    }

    // Mark as read if user is the receiver
    if (message.receiverId === session.user.id && message.status === "UNREAD") {
      await prisma.message.update({
        where: { id },
        data: { status: "READ" },
      });
      message.status = "READ";
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Error fetching message:", error);
    return NextResponse.json(
      { error: "Failed to fetch message" },
      { status: 500 }
    );
  }
}

// PATCH /api/messages/[id] - Mark message as read/unread
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

    const message = await prisma.message.findUnique({
      where: { id },
      select: { senderId: true, receiverId: true },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Only receiver can mark as read/unread
    if (message.receiverId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the recipient can update message status" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!["READ", "UNREAD"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be READ or UNREAD" },
        { status: 400 }
      );
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      message: updatedMessage,
    });
  } catch (error) {
    console.error("Error updating message:", error);
    return NextResponse.json(
      { error: "Failed to update message" },
      { status: 500 }
    );
  }
}

// DELETE /api/messages/[id] - Delete a message
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

    const message = await prisma.message.findUnique({
      where: { id },
      select: { senderId: true, receiverId: true },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Only sender or receiver can delete
    if (message.senderId !== session.user.id && message.receiverId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to delete this message" },
        { status: 403 }
      );
    }

    await prisma.message.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
