"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { Briefcase, Clock, DollarSign, FileText, ExternalLink } from "lucide-react";

interface Application {
  id: string;
  proposal: string;
  bidAmount?: number | null;
  status: string;
  createdAt: string;
  job: {
    id: string;
    title: string;
    budgetMax?: number | null;
    status: string;
    poster: {
      id: string;
      username: string;
    };
  };
}

const statusColors: Record<string, "success" | "warning" | "error" | "secondary"> = {
  PENDING: "warning",
  ACCEPTED: "success",
  REJECTED: "error",
  WITHDRAWN: "secondary",
};

export default function MyApplicationsPage() {
  const { data: session } = useSession();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!session?.user?.id) return;

      try {
        // We'll need to add an endpoint to get user's applications
        // For now, we'll fetch from multiple jobs
        const response = await fetch("/api/applications/my");
        const data = await response.json();

        if (response.ok) {
          setApplications(data.applications);
        }
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [session?.user?.id]);

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "PENDING").length,
    accepted: applications.filter((a) => a.status === "ACCEPTED").length,
    rejected: applications.filter((a) => a.status === "REJECTED").length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">My Applications</h1>
        <p className="text-muted-foreground">
          Track the status of your job applications
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
            <p className="text-sm text-muted-foreground">Accepted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            <p className="text-sm text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Applications Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start applying to jobs to build your portfolio
            </p>
            <Button asChild>
              <Link href="/jobs">Browse Jobs</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Application History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {applications.map((app) => (
                <div key={app.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={statusColors[app.status]}>
                          {app.status}
                        </Badge>
                      </div>
                      <h3 className="font-medium">
                        <Link
                          href={`/jobs/${app.job.id}`}
                          className="hover:text-primary"
                        >
                          {app.job.title}
                        </Link>
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {app.job.poster.username}
                        </span>
                        {app.bidAmount && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            Your bid: {formatCurrency(app.bidAmount)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(new Date(app.createdAt))}
                        </span>
                      </div>
                    </div>

                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/jobs/${app.job.id}`}>
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>

                  {/* Proposal Preview */}
                  <div className="mt-3 p-3 bg-muted/50 rounded text-sm">
                    <p className="line-clamp-2">{app.proposal}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
