"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Spinner,
} from "@/components/ui";

type ActivityItem = {
  id: string;
  type: "booking" | "message" | "review" | "job_application" | "order";
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  link?: string;
};

const activityIcons: Record<string, React.ReactNode> = {
  booking: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  message: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  ),
  review: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  job_application: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  order: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),
};

const activityColors: Record<string, { bg: string; text: string }> = {
  booking: { bg: "bg-primary/10", text: "text-primary" },
  message: { bg: "bg-accent/10", text: "text-accent" },
  review: { bg: "bg-warning/10", text: "text-warning" },
  job_application: { bg: "bg-success/10", text: "text-success" },
  order: { bg: "bg-secondary/10", text: "text-secondary" },
};

const statusVariants: Record<string, "success" | "warning" | "error" | "secondary" | "primary"> = {
  PENDING: "warning",
  CONFIRMED: "success",
  COMPLETED: "success",
  CANCELLED: "error",
  NO_SHOW: "error",
  UNREAD: "primary",
  READ: "secondary",
  ACCEPTED: "success",
  REJECTED: "error",
  OPEN: "primary",
  PROCESSING: "warning",
  SHIPPED: "primary",
  DELIVERED: "success",
};

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

export default function ActivityPage() {
  const { data: session } = useSession();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchActivities = async (currentOffset: number, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(`/api/dashboard/activity?limit=20&offset=${currentOffset}`);
      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();

      if (append) {
        setActivities((prev) => [...prev, ...data.activities]);
      } else {
        setActivities(data.activities);
      }
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Error fetching activity:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchActivities(0);
    }
  }, [session]);

  const handleLoadMore = () => {
    const newOffset = offset + 20;
    setOffset(newOffset);
    fetchActivities(newOffset, true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Activity</h1>
          <p className="text-muted-foreground">
            Your recent activity and notifications
          </p>
        </div>
      </div>

      {/* Activity List */}
      <Card padding="none">
        <CardHeader className="p-6 pb-4">
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No activity yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Your bookings, messages, reviews, and other activity will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => {
                const colors = activityColors[activity.type] || activityColors.booking;
                const icon = activityIcons[activity.type] || activityIcons.booking;

                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className={`p-2 rounded-full ${colors.bg} ${colors.text}`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-foreground">
                            {activity.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {activity.description}
                          </p>
                        </div>
                        {activity.status && (
                          <Badge variant={statusVariants[activity.status] || "secondary"}>
                            {activity.status.toLowerCase()}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(activity.timestamp)}
                        </p>
                        {activity.link && (
                          <Link href={activity.link}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {hasMore && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? <Spinner size="sm" /> : "Load More"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
