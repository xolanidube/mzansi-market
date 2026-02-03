"use client";

import { use } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ConversationList } from "@/components/messages/ConversationList";
import { MessageThread } from "@/components/messages/MessageThread";
import { ArrowLeft } from "lucide-react";

export default function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="space-y-6">
      {/* Mobile Back Button */}
      <div className="lg:hidden">
        <Link
          href="/dashboard/messages"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Messages
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        {/* Conversation List (Desktop) */}
        <div className="hidden lg:block">
          <Card className="h-full overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-medium">Conversations</h2>
            </div>
            <div className="overflow-y-auto h-[calc(100%-57px)]">
              <ConversationList activeConversationId={id} />
            </div>
          </Card>
        </div>

        {/* Message Thread */}
        <div className="lg:col-span-2">
          <Card className="h-full overflow-hidden">
            <MessageThread partnerId={id} />
          </Card>
        </div>
      </div>
    </div>
  );
}
