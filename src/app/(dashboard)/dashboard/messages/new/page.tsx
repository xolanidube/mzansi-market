"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { NewMessageForm } from "@/components/messages/NewMessageForm";
import { ArrowLeft } from "lucide-react";

export default function NewMessagePage() {
  const searchParams = useSearchParams();
  const toUserId = searchParams.get("to");
  const toUserName = searchParams.get("name");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/messages"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Messages
        </Link>
        <h1 className="text-2xl font-bold">New Message</h1>
        <p className="text-muted-foreground">
          Start a new conversation
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Compose Message</CardTitle>
        </CardHeader>
        <CardContent>
          <NewMessageForm
            receiverId={toUserId || undefined}
            receiverName={toUserName || undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
