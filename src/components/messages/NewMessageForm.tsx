"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { Send, Loader2 } from "lucide-react";

interface NewMessageFormProps {
  receiverId?: string;
  receiverName?: string;
  onSuccess?: () => void;
}

export function NewMessageForm({
  receiverId: initialReceiverId,
  receiverName,
  onSuccess,
}: NewMessageFormProps) {
  const router = useRouter();
  const [receiverId, setReceiverId] = useState(initialReceiverId || "");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!receiverId.trim()) {
      setError("Please specify a recipient");
      return;
    }

    if (!content.trim()) {
      setError("Please enter a message");
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: receiverId.trim(),
          subject: subject.trim() || undefined,
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setSuccess("Message sent successfully!");

      if (onSuccess) {
        setTimeout(onSuccess, 1000);
      } else {
        setTimeout(() => {
          router.push(`/dashboard/messages/${receiverId}`);
        }, 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {!initialReceiverId ? (
        <Input
          label="Recipient ID"
          value={receiverId}
          onChange={(e) => setReceiverId(e.target.value)}
          placeholder="Enter user ID"
          required
        />
      ) : (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">To:</p>
          <p className="font-medium">{receiverName || receiverId}</p>
        </div>
      )}

      <Input
        label="Subject (optional)"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Message subject"
      />

      <Textarea
        label="Message"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your message here..."
        rows={6}
        required
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={isSending}>
          {isSending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
