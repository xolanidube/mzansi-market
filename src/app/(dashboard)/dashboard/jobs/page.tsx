"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import {
  Plus,
  Briefcase,
  Eye,
  Edit,
  Trash2,
  Users,
  MoreVertical,
} from "lucide-react";

interface Job {
  id: string;
  title: string;
  description: string;
  jobType: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  estimatedBudget?: string | null;
  status: string;
  createdAt: string;
  applicationCount?: number;
}

const statusColors: Record<string, "success" | "warning" | "error" | "secondary"> = {
  OPEN: "success",
  IN_PROGRESS: "warning",
  COMPLETED: "secondary",
  CANCELLED: "error",
  CLOSED: "secondary",
};

const jobTypeLabels: Record<string, string> = {
  FIX: "Fixed",
  HOURLY: "Hourly",
  FREELANCE: "Freelance",
  FULLTIME: "Full-time",
  PARTTIME: "Part-time",
  INTERNSHIP: "Internship",
  TEMPORARY: "Temporary",
  CUSTOM: "Custom",
};

export default function DashboardJobsPage() {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch(`/api/jobs?posterId=${session.user.id}`);
        const data = await response.json();

        if (response.ok) {
          setJobs(data.jobs);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [session?.user?.id]);

  const handleCloseJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to close this job?")) return;

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLOSED" }),
      });

      if (response.ok) {
        setJobs(
          jobs.map((job) =>
            job.id === jobId ? { ...job, status: "CLOSED" } : job
          )
        );
      }
    } catch (error) {
      console.error("Error closing job:", error);
    }
    setActiveMenu(null);
  };

  const stats = {
    total: jobs.length,
    open: jobs.filter((j) => j.status === "OPEN").length,
    inProgress: jobs.filter((j) => j.status === "IN_PROGRESS").length,
    completed: jobs.filter((j) => j.status === "COMPLETED").length,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Jobs</h1>
          <p className="text-muted-foreground">Manage your job postings</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/jobs/new">
            <Plus className="w-4 h-4 mr-2" />
            Post New Job
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Jobs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.open}</p>
            <p className="text-sm text-muted-foreground">Open</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-600">{stats.completed}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Jobs Posted Yet</h3>
            <p className="text-muted-foreground mb-4">
              Post your first job to find talented service providers
            </p>
            <Button asChild>
              <Link href="/dashboard/jobs/new">
                <Plus className="w-4 h-4 mr-2" />
                Post a Job
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your Job Postings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={statusColors[job.status]}>
                        {job.status.replace("_", " ")}
                      </Badge>
                      <Badge variant="outline">
                        {jobTypeLabels[job.jobType] || job.jobType}
                      </Badge>
                    </div>
                    <h3 className="font-medium truncate">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="hover:text-primary"
                      >
                        {job.title}
                      </Link>
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>
                        {job.budgetMax
                          ? formatCurrency(job.budgetMax)
                          : job.estimatedBudget || "Negotiable"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {job.applicationCount || 0} applicants
                      </span>
                      <span>{formatRelativeTime(new Date(job.createdAt))}</span>
                    </div>
                  </div>

                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setActiveMenu(activeMenu === job.id ? null : job.id)
                      }
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>

                    {activeMenu === job.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-background border rounded-lg shadow-lg z-10">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-muted"
                          onClick={() => setActiveMenu(null)}
                        >
                          <Eye className="w-4 h-4" />
                          View Job
                        </Link>
                        <Link
                          href={`/dashboard/jobs/${job.id}`}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-muted"
                          onClick={() => setActiveMenu(null)}
                        >
                          <Edit className="w-4 h-4" />
                          Edit Job
                        </Link>
                        <Link
                          href={`/dashboard/jobs/${job.id}/applications`}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-muted"
                          onClick={() => setActiveMenu(null)}
                        >
                          <Users className="w-4 h-4" />
                          View Applications
                        </Link>
                        {job.status === "OPEN" && (
                          <button
                            className="flex items-center gap-2 px-4 py-2 hover:bg-muted w-full text-left text-red-600"
                            onClick={() => handleCloseJob(job.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                            Close Job
                          </button>
                        )}
                      </div>
                    )}
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
