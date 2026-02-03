"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { ApplicationForm } from "@/components/jobs/ApplicationForm";
import { JobCard } from "@/components/jobs/JobCard";
import { formatCurrency, formatRelativeTime, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  Briefcase,
  Calendar,
  Send,
  Share2,
  Heart,
  CheckCircle,
} from "lucide-react";

interface Job {
  id: string;
  title: string;
  description: string;
  category?: string;
  categoryId?: string;
  subCategory?: string;
  skills: string[];
  jobType: string;
  customJobType?: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  estimatedBudget?: string | null;
  deliveryDays?: number | null;
  preferredLocation?: string | null;
  featuredImage?: string | null;
  attachments?: string[];
  status: string;
  createdAt: string;
  poster: {
    id: string;
    username: string;
    picture?: string | null;
    createdAt?: string;
  };
  applications: Array<{
    id: string;
    proposal: string;
    bidAmount?: number | null;
    status: string;
    createdAt: string;
    applicant: {
      id: string;
      username: string;
      picture?: string | null;
    };
  }>;
}

interface SimilarJob {
  id: string;
  title: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  jobType: string;
  createdAt: string;
  poster: {
    id: string;
    username: string;
    picture?: string | null;
  };
  applicationCount?: number;
}

const jobTypeLabels: Record<string, string> = {
  FIX: "Fixed Price",
  HOURLY: "Hourly",
  FREELANCE: "Freelance",
  FULLTIME: "Full-time",
  PARTTIME: "Part-time",
  INTERNSHIP: "Internship",
  TEMPORARY: "Temporary",
  CUSTOM: "Custom",
};

const statusColors: Record<string, "success" | "warning" | "error" | "secondary"> = {
  OPEN: "success",
  IN_PROGRESS: "warning",
  COMPLETED: "secondary",
  CANCELLED: "error",
  CLOSED: "secondary",
};

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const [job, setJob] = useState<Job | null>(null);
  const [similarJobs, setSimilarJobs] = useState<SimilarJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch(`/api/jobs/${id}`);
        const data = await response.json();

        if (response.ok) {
          setJob(data.job);
          setSimilarJobs(data.similarJobs || []);

          // Check if current user has applied
          if (session?.user?.id) {
            const applied = data.job.applications.some(
              (app: { applicant: { id: string } }) => app.applicant.id === session.user.id
            );
            setHasApplied(applied);
          }
        }
      } catch (error) {
        console.error("Error fetching job:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJob();
  }, [id, session?.user?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Job Not Found</h1>
        <Button asChild>
          <Link href="/jobs">Browse Jobs</Link>
        </Button>
      </div>
    );
  }

  const budgetDisplay =
    job.budgetMin && job.budgetMax
      ? `${formatCurrency(job.budgetMin)} - ${formatCurrency(job.budgetMax)}`
      : job.budgetMax
      ? formatCurrency(job.budgetMax)
      : job.estimatedBudget || "Negotiable";

  const isOwner = session?.user?.id === job.poster.id;
  const canApply = status === "authenticated" && !isOwner && job.status === "OPEN" && !hasApplied;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={statusColors[job.status] || "secondary"}>
                        {job.status.replace("_", " ")}
                      </Badge>
                      <Badge variant="outline">
                        {jobTypeLabels[job.jobType] || job.jobType}
                      </Badge>
                    </div>
                    <h1 className="text-2xl font-bold">{job.title}</h1>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                  {job.category && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {job.category}
                    </span>
                  )}
                  {job.preferredLocation && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {job.preferredLocation}
                    </span>
                  )}
                  {job.deliveryDays && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {job.deliveryDays} day{job.deliveryDays !== 1 ? "s" : ""} delivery
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Posted {formatRelativeTime(new Date(job.createdAt))}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {job.applications.length} applicant{job.applications.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Budget */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Budget</p>
                    <p className="text-2xl font-bold text-primary">{budgetDisplay}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="w-4 h-4" />
                    </Button>
                    {canApply && (
                      <Button onClick={() => setShowApplyModal(true)}>
                        <Send className="w-4 h-4 mr-2" />
                        Apply Now
                      </Button>
                    )}
                    {hasApplied && (
                      <Button disabled variant="secondary">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Applied
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{job.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            {job.skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Required Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Posted By */}
            <Card>
              <CardHeader>
                <CardTitle>Posted By</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar
                    src={job.poster.picture}
                    name={job.poster.username}
                    size="lg"
                  />
                  <div>
                    <h3 className="font-medium">{job.poster.username}</h3>
                    {job.poster.createdAt && (
                      <p className="text-sm text-muted-foreground">
                        Member since {formatDate(new Date(job.poster.createdAt))}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/users/${job.poster.id}`}>View Profile</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Similar Jobs */}
            {similarJobs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Similar Jobs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {similarJobs.map((similarJob) => (
                    <Link
                      key={similarJob.id}
                      href={`/jobs/${similarJob.id}`}
                      className="block p-3 rounded-lg border hover:border-primary transition-colors"
                    >
                      <h4 className="font-medium line-clamp-1">{similarJob.title}</h4>
                      <div className="flex items-center justify-between mt-2 text-sm">
                        <span className="text-primary font-medium">
                          {similarJob.budgetMax
                            ? formatCurrency(similarJob.budgetMax)
                            : "Negotiable"}
                        </span>
                        <span className="text-muted-foreground">
                          {similarJob.applicationCount || 0} applicants
                        </span>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      <Modal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title="Submit Application"
        size="lg"
      >
        <ApplicationForm
          jobId={job.id}
          jobTitle={job.title}
          budgetMax={job.budgetMax}
          onSuccess={() => {
            setShowApplyModal(false);
            setHasApplied(true);
          }}
          onCancel={() => setShowApplyModal(false)}
        />
      </Modal>
    </div>
  );
}
