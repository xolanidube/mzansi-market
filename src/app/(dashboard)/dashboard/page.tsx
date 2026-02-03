"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Alert,
  Badge,
  Spinner,
} from "@/components/ui";

type ActivityItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  link?: string;
};

type DashboardStats = {
  // Client stats
  activeBookings?: number;
  postedJobs?: number;
  unreadMessages?: number;
  completedBookings?: number;
  // Provider stats
  pendingBookings?: number;
  activeServices?: number;
  totalEarnings?: string;
  avgRating?: string;
};

const statIcons = {
  activeBookings: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  postedJobs: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  unreadMessages: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  ),
  completedBookings: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  pendingBookings: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  activeServices: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  totalEarnings: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  avgRating: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
};

const quickActions = {
  client: [
    { title: "Browse Services", href: "/services", icon: "🔍" },
    { title: "Post a Job", href: "/dashboard/jobs/new", icon: "📝" },
    { title: "View Bookings", href: "/dashboard/bookings", icon: "📅" },
    { title: "Messages", href: "/dashboard/messages", icon: "💬" },
  ],
  provider: [
    { title: "Add Service", href: "/dashboard/services/new", icon: "➕" },
    { title: "View Bookings", href: "/dashboard/bookings", icon: "📅" },
    { title: "Edit Shop", href: "/dashboard/shop", icon: "🏪" },
    { title: "View Earnings", href: "/dashboard/wallet", icon: "💰" },
  ],
};

const activityIcons: Record<string, React.ReactNode> = {
  booking: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  message: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  ),
  review: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
};

const activityColors: Record<string, { bg: string; text: string }> = {
  booking: { bg: "bg-success/10", text: "text-success" },
  message: { bg: "bg-primary/10", text: "text-primary" },
  review: { bg: "bg-warning/10", text: "text-warning" },
  job_application: { bg: "bg-accent/10", text: "text-accent" },
  order: { bg: "bg-secondary/10", text: "text-secondary" },
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

export default function DashboardPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get("welcome") === "true";
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isProvider = session?.user?.userType === "SERVICE_PROVIDER";
  const actions = isProvider ? quickActions.provider : quickActions.client;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, activityRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetch("/api/dashboard/activity?limit=5"),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (activityRes.ok) {
          const activityData = await activityRes.json();
          setActivities(activityData.activities || []);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchDashboardData();
    }
  }, [session]);

  const getStatsCards = () => {
    if (!stats) return [];

    if (isProvider) {
      return [
        {
          title: "Pending Bookings",
          value: stats.pendingBookings?.toString() || "0",
          icon: statIcons.pendingBookings,
          color: "text-warning",
          bgColor: "bg-warning/10",
        },
        {
          title: "Active Services",
          value: stats.activeServices?.toString() || "0",
          icon: statIcons.activeServices,
          color: "text-primary",
          bgColor: "bg-primary/10",
        },
        {
          title: "Total Earnings",
          value: `R ${parseFloat(stats.totalEarnings || "0").toLocaleString()}`,
          icon: statIcons.totalEarnings,
          color: "text-success",
          bgColor: "bg-success/10",
        },
        {
          title: "Avg Rating",
          value: stats.avgRating || "0.0",
          icon: statIcons.avgRating,
          color: "text-accent",
          bgColor: "bg-accent/10",
        },
      ];
    } else {
      return [
        {
          title: "Active Bookings",
          value: stats.activeBookings?.toString() || "0",
          icon: statIcons.activeBookings,
          color: "text-primary",
          bgColor: "bg-primary/10",
        },
        {
          title: "Posted Jobs",
          value: stats.postedJobs?.toString() || "0",
          icon: statIcons.postedJobs,
          color: "text-accent",
          bgColor: "bg-accent/10",
        },
        {
          title: "Unread Messages",
          value: stats.unreadMessages?.toString() || "0",
          icon: statIcons.unreadMessages,
          color: "text-warning",
          bgColor: "bg-warning/10",
        },
        {
          title: "Completed",
          value: stats.completedBookings?.toString() || "0",
          icon: statIcons.completedBookings,
          color: "text-success",
          bgColor: "bg-success/10",
        },
      ];
    }
  };

  const statsCards = getStatsCards();

  return (
    <div className="space-y-6">
      {/* Welcome message for new users */}
      {isWelcome && (
        <Alert variant="success" title="Welcome to Mzansi Market!">
          Your account has been created successfully. Start exploring services or
          set up your profile.
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {session?.user?.name}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your account today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isProvider ? "primary" : "secondary"}>
            {isProvider ? "Service Provider" : "Client"}
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-secondary animate-pulse w-12 h-12" />
                    <div className="space-y-2">
                      <div className="h-6 w-12 bg-secondary animate-pulse rounded" />
                      <div className="h-4 w-20 bg-secondary animate-pulse rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          statsCards.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <span className={stat.color}>{stat.icon}</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card padding="none" className="lg:col-span-1">
          <CardHeader className="p-6 pb-4">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-2">
            {actions.map((action) => (
              <Link key={action.title} href={action.href}>
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <span className="text-xl">{action.icon}</span>
                  {action.title}
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card padding="none" className="lg:col-span-2">
          <CardHeader className="p-6 pb-4">
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-4 p-3 rounded-lg bg-secondary/50">
                    <div className="p-2 rounded-full bg-secondary animate-pulse w-10 h-10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-secondary animate-pulse rounded" />
                      <div className="h-3 w-full bg-secondary animate-pulse rounded" />
                      <div className="h-3 w-20 bg-secondary animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No recent activity</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your bookings, messages, and reviews will appear here
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
                      className="flex items-start gap-4 p-3 rounded-lg bg-secondary/50"
                    >
                      <div className={`p-2 rounded-full ${colors.bg} ${colors.text}`}>
                        {icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {activity.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTimeAgo(activity.timestamp)}
                        </p>
                      </div>
                      {activity.link && (
                        <Link href={activity.link}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 text-center">
              <Link href="/dashboard/activity">
                <Button variant="outline" size="sm">
                  View all activity
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider-specific: Shop Status */}
      {isProvider && (
        <Card padding="none">
          <CardHeader className="p-6 pb-4">
            <CardTitle>Shop Status</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🏪</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {session?.user?.name}&apos;s Shop
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Complete your shop profile to start receiving bookings
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="warning">Profile Incomplete</Badge>
                <Link href="/dashboard/shop">
                  <Button size="sm">Complete Setup</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
