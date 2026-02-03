"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, Badge, Spinner } from "@/components/ui";

interface DashboardStats {
  users: {
    total: number;
    clients: number;
    providers: number;
    admins: number;
    newThisMonth: number;
  };
  services: {
    total: number;
    active: number;
    pending: number;
  };
  bookings: {
    total: number;
    pending: number;
    completed: number;
    thisMonth: number;
  };
  reports: {
    total: number;
    pending: number;
    resolved: number;
  };
  withdrawals: {
    pending: number;
    pendingAmount: number;
  };
  revenue: {
    thisMonth: number;
    lastMonth: number;
  };
}

interface RecentActivity {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/admin/dashboard");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentActivity(data.recentActivity || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats?.users.total || 0,
      subtext: `+${stats?.users.newThisMonth || 0} this month`,
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: "bg-blue-500",
      href: "/admin/users",
    },
    {
      title: "Active Services",
      value: stats?.services.active || 0,
      subtext: `${stats?.services.pending || 0} pending approval`,
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: "bg-green-500",
      href: "/admin/services",
    },
    {
      title: "Pending Reports",
      value: stats?.reports.pending || 0,
      subtext: `${stats?.reports.total || 0} total reports`,
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      color: "bg-yellow-500",
      href: "/admin/reports",
    },
    {
      title: "Pending Withdrawals",
      value: stats?.withdrawals.pending || 0,
      subtext: `R${(stats?.withdrawals.pendingAmount || 0).toLocaleString()}`,
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: "bg-purple-500",
      href: "/admin/withdrawals",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of platform statistics and activities</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stat.value.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.subtext}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg text-white`}>
                  {stat.icon}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* User Distribution & Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">User Distribution</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Clients</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${stats?.users.total ? (stats.users.clients / stats.users.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="font-medium w-12 text-right">{stats?.users.clients || 0}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Service Providers</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${stats?.users.total ? (stats.users.providers / stats.users.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="font-medium w-12 text-right">{stats?.users.providers || 0}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Administrators</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${stats?.users.total ? (stats.users.admins / stats.users.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="font-medium w-12 text-right">{stats?.users.admins || 0}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Bookings Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Bookings</span>
              <span className="font-medium">{stats?.bookings.total || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Pending</span>
              <Badge variant="warning">{stats?.bookings.pending || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Completed</span>
              <Badge variant="success">{stats?.bookings.completed || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">This Month</span>
              <span className="font-medium">{stats?.bookings.thisMonth || 0}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/admin/services?status=pending">
            <div className="p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors text-center">
              <svg className="w-8 h-8 mx-auto mb-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <p className="text-sm font-medium">Approve Services</p>
            </div>
          </Link>
          <Link href="/admin/reports?status=PENDING">
            <div className="p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors text-center">
              <svg className="w-8 h-8 mx-auto mb-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm font-medium">Review Reports</p>
            </div>
          </Link>
          <Link href="/admin/withdrawals?status=PENDING">
            <div className="p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors text-center">
              <svg className="w-8 h-8 mx-auto mb-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm font-medium">Process Withdrawals</p>
            </div>
          </Link>
          <Link href="/admin/users">
            <div className="p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors text-center">
              <svg className="w-8 h-8 mx-auto mb-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <p className="text-sm font-medium">Manage Users</p>
            </div>
          </Link>
        </div>
      </Card>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div className="flex-1">
                  <p className="text-sm text-foreground">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
