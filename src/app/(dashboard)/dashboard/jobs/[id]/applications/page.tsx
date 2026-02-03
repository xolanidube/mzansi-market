"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { ArrowLeft, Check, X, MessageCircle, Star } from "lucide-react";

interface Application {
  id: string;
  proposal: string;
  bidAmount?: number | null;
  status: string;
  createdAt: string;
  applicant: {
    id: string;
    username: string;
    picture?: string | null;
    phone?: string | null;
    shop?: {
      id: string;
      name: string;
      rating: number | null;
      totalReviews: number;
    } | null;
  };
}

interface Job {
  id: string;
  title: string;
  status: string;
}

const statusColors: Record<string, "success" | "warning" | "error" | "secondary"> = {
  PENDING: "warning",
  ACCEPTED: "success",
  REJECTED: "error",
  WITHDRAWN: "secondary",
};

export default function JobApplicationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch job details
        const jobResponse = await fetch(`/api/jobs/${id}`);
        const jobData = await jobResponse.json();

        if (!jobResponse.ok) {
          setError(jobData.error || "Job not found");
          return;
        }

        if (jobData.job.poster.id !== session?.user?.id) {
          setError("You can only view applications for your own jobs");
          return;
        }

        setJob(jobData.job);

        // Fetch applications
        const appResponse = await fetch(`/api/jobs/${id}/applications`);
        const appData = await appResponse.json();

        if (appResponse.ok) {
          setApplications(appData.applications);
        }
      } catch (err) {
        setError("Failed to load applications");
      } finally {
        setIsLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchData();
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [id, session?.user?.id, status, router]);

  const handleUpdateStatus = async (applicationId: string, newStatus: "ACCEPTED" | "REJECTED") => {
    setUpdating(applicationId);
    try {
      const response = await fetch(
        `/api/jobs/${id}/applications?applicationId=${applicationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        setApplications(
          applications.map((app) =>
            app.id === applicationId ? { ...app, status: newStatus } : app
          )
        );

        if (newStatus === "ACCEPTED" && job) {
          setJob({ ...job, status: "IN_PROGRESS" });
        }
      }
    } catch (err) {
      console.error("Failed to update application:", err);
    } finally {
      setUpdating(null);
    }
  };

  if (isLoading || status === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Alert variant="error">{error}</Alert>
        <Button asChild className="mt-4">
          <Link href="/dashboard/jobs">Back to Jobs</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/jobs"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </Link>
        <h1 className="text-2xl font-bold">Applications for: {job?.title}</h1>
        <p className="text-muted-foreground">
          {applications.length} application{applications.length !== 1 ? "s" : ""} received
        </p>
      </div>

      {/* Applications */}
      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No applications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Applicant Info */}
                  <Avatar
                    src={app.applicant.picture}
                    name={app.applicant.username}
                    size="lg"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{app.applicant.username}</h3>
                          <Badge variant={statusColors[app.status]}>
                            {app.status}
                          </Badge>
                        </div>
                        {app.applicant.shop && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Link
                              href={`/shops/${app.applicant.shop.id}`}
                              className="hover:text-primary"
                            >
                              {app.applicant.shop.name}
                            </Link>
                            {app.applicant.shop.rating && (
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                {app.applicant.shop.rating.toFixed(1)}
                                <span>({app.applicant.shop.totalReviews})</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        {app.bidAmount && (
                          <p className="font-bold text-primary">
                            {formatCurrency(app.bidAmount)}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {formatRelativeTime(new Date(app.createdAt))}
                        </p>
                      </div>
                    </div>

                    {/* Proposal */}
                    <div className="bg-muted/50 rounded-lg p-4 mb-4">
                      <p className="whitespace-pre-wrap">{app.proposal}</p>
                    </div>

                    {/* Actions */}
                    {app.status === "PENDING" && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(app.id, "ACCEPTED")}
                          disabled={updating === app.id}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(app.id, "REJECTED")}
                          disabled={updating === app.id}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/dashboard/messages/new?to=${app.applicant.id}`}>
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Message
                          </Link>
                        </Button>
                      </div>
                    )}

                    {app.status === "ACCEPTED" && (
                      <div className="flex items-center gap-2">
                        <Button size="sm" asChild>
                          <Link href={`/dashboard/messages/new?to=${app.applicant.id}`}>
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Contact Freelancer
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
