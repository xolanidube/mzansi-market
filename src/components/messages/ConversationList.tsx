"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { MessageCircle } from "lucide-react";

interface Conversation {
  partnerId: string;
  partner: {
    id: string;
    username: string;
    picture: string | null;
  };
  lastMessage: {
    id: string;
    subject: string | null;
    content: string;
    status: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
  messageCount: number;
}

interface ConversationListProps {
  activeConversationId?: string;
}

export function ConversationList({ activeConversationId }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch("/api/conversations");
        const data = await response.json();

        if (response.ok) {
          setConversations(data.conversations);
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No conversations yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {conversations.map((conv) => (
        <Link
          key={conv.partnerId}
          href={`/dashboard/messages/${conv.partnerId}`}
          className={cn(
            "flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors",
            activeConversationId === conv.partnerId && "bg-muted",
            conv.unreadCount > 0 && "bg-primary/5"
          )}
        >
          <div className="relative">
            <Avatar
              src={conv.partner.picture}
              name={conv.partner.username}
              size="md"
            />
            {conv.unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className={cn(
                "font-medium truncate",
                conv.unreadCount > 0 && "font-semibold"
              )}>
                {conv.partner.username}
              </span>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {formatRelativeTime(new Date(conv.lastMessage.createdAt))}
              </span>
            </div>
            <p className={cn(
              "text-sm truncate",
              conv.unreadCount > 0 ? "text-foreground" : "text-muted-foreground"
            )}>
              {conv.lastMessage.content}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
