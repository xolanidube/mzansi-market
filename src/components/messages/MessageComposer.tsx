"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Send, Loader2 } from "lucide-react";

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

interface MessageComposerProps {
  receiverId: string;
  onMessageSent?: (message: Message) => void;
  placeholder?: string;
}

export function MessageComposer({
  receiverId,
  onMessageSent,
  placeholder = "Type your message...",
}: MessageComposerProps) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    setIsSending(true);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId,
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setContent("");
        onMessageSent?.(data.data);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        className="resize-none min-h-[44px]"
        disabled={isSending}
      />
      <Button
        type="submit"
        disabled={!content.trim() || isSending}
        className="flex-shrink-0"
      >
        {isSending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </Button>
    </form>
  );
}
