"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsPanel } from "@/components/ui/Tabs";
import { ReviewList } from "@/components/reviews/ReviewList";
import { Spinner } from "@/components/ui/Spinner";
import { Star } from "lucide-react";

export default function ReviewsPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const isProvider = session?.user?.userType === "SERVICE_PROVIDER";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Star className="w-6 h-6" />
          Reviews
        </h1>
        <p className="text-muted-foreground">
          {isProvider
            ? "View reviews from your clients"
            : "Reviews you've given to service providers"}
        </p>
      </div>

      {/* Reviews Content */}
      {isProvider ? (
        // Provider View - Show reviews received
        <Card>
          <CardHeader>
            <CardTitle>Reviews From Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <ReviewList receiverId={session?.user?.id} showStats />
          </CardContent>
        </Card>
      ) : (
        // Client View - Tabs for received and given reviews
        <Tabs defaultTab="given">
          <TabsList>
            <TabsTrigger value="given">Reviews I've Given</TabsTrigger>
            <TabsTrigger value="received">Reviews I've Received</TabsTrigger>
          </TabsList>

          <TabsPanel value="given">
            <Card>
              <CardContent className="pt-6">
                <ReviewList senderId={session?.user?.id} showReceiver showStats={false} />
              </CardContent>
            </Card>
          </TabsPanel>

          <TabsPanel value="received">
            <Card>
              <CardContent className="pt-6">
                <ReviewList receiverId={session?.user?.id} showStats />
              </CardContent>
            </Card>
          </TabsPanel>
        </Tabs>
      )}
    </div>
  );
}
