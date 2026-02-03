"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { MessageComposer } from "./MessageComposer";

interface Message {
  id: string;
  subject: string | null;
  content: string;
  status: string;
  createdAt: string;
  senderId: string;
  sender: {
    id: string;
    username: string;
    picture: string | null;
  };
}

interface Partner {
  id: string;
  username: string;
  picture: string | null;
  email?: string;
  shop?: {
    id: string;
    name: string;
  } | null;
}

interface MessageThreadProps {
  partnerId: string;
}

export function MessageThread({ partnerId }: MessageThreadProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const response = await fetch(`/api/conversations/${partnerId}`);
        const data = await response.json();

        if (response.ok) {
          setMessages(data.messages);
          setPartner(data.partner);
        }
      } catch (error) {
        console.error("Error fetching conversation:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversation();
  }, [partnerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleMessageSent = (newMessage: Message) => {
    setMessages((prev) => [...prev, newMessage]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  let currentDate = "";

  for (const message of messages) {
    const messageDate = new Date(message.createdAt).toLocaleDateString();
    if (messageDate !== currentDate) {
      currentDate = messageDate;
      groupedMessages.push({ date: messageDate, messages: [] });
    }
    groupedMessages[groupedMessages.length - 1].messages.push(message);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Avatar src={partner.picture} name={partner.username} size="md" />
        <div>
          <h2 className="font-medium">{partner.username}</h2>
          {partner.shop && (
            <p className="text-sm text-muted-foreground">{partner.shop.name}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.date}>
              {/* Date Separator */}
              <div className="flex items-center justify-center mb-4">
                <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {group.date === new Date().toLocaleDateString()
                    ? "Today"
                    : group.date}
                </span>
              </div>

              {/* Messages for this date */}
              <div className="space-y-3">
                {group.messages.map((message) => {
                  const isOwn = message.senderId === session?.user?.id;

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        isOwn && "flex-row-reverse"
                      )}
                    >
                      {!isOwn && (
                        <Avatar
                          src={message.sender.picture}
                          name={message.sender.username}
                          size="sm"
                        />
                      )}
                      <div
                        className={cn(
                          "max-w-[70%] rounded-lg p-3",
                          isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p
                          className={cn(
                            "text-xs mt-1",
                            isOwn
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          )}
                        >
                          {formatRelativeTime(new Date(message.createdAt))}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="border-t p-4">
        <MessageComposer
          receiverId={partnerId}
          onMessageSent={handleMessageSent}
        />
      </div>
    </div>
  );
}
