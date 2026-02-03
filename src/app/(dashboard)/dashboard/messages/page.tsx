"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConversationList } from "@/components/messages/ConversationList";
import { MessageCircle, PenSquare } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            Messages
          </h1>
          <p className="text-muted-foreground">
            Your conversations with other users
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/messages/new">
            <PenSquare className="w-4 h-4 mr-2" />
            New Message
          </Link>
        </Button>
      </div>

      {/* Conversations */}
      <Card>
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ConversationList />
        </CardContent>
      </Card>
    </div>
  );
}
