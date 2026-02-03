"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { MapPin, Clock, Users, Briefcase } from "lucide-react";

interface JobCardProps {
  job: {
    id: string;
    title: string;
    description: string;
    category?: string;
    skills?: string[];
    jobType: string;
    budgetMin?: number | null;
    budgetMax?: number | null;
    estimatedBudget?: string | null;
    deliveryDays?: number | null;
    preferredLocation?: string | null;
    status: string;
    createdAt: string | Date;
    poster?: {
      id: string;
      username: string;
      picture?: string | null;
    };
    applicationCount?: number;
  };
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

export function JobCard({ job }: JobCardProps) {
  const budgetDisplay = job.budgetMin && job.budgetMax
    ? `${formatCurrency(job.budgetMin)} - ${formatCurrency(job.budgetMax)}`
    : job.budgetMax
    ? formatCurrency(job.budgetMax)
    : job.estimatedBudget || "Negotiable";

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={statusColors[job.status] || "secondary"}>
                {job.status.replace("_", " ")}
              </Badge>
              <Badge variant="outline">{jobTypeLabels[job.jobType] || job.jobType}</Badge>
            </div>
            <h3 className="font-semibold text-lg line-clamp-2">
              <Link href={`/jobs/${job.id}`} className="hover:text-primary">
                {job.title}
              </Link>
            </h3>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-primary">{budgetDisplay}</p>
            {job.deliveryDays && (
              <p className="text-sm text-muted-foreground">
                {job.deliveryDays} day{job.deliveryDays !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {job.description}
        </p>

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {job.skills.slice(0, 4).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {job.skills.length > 4 && (
              <Badge variant="secondary" className="text-xs">
                +{job.skills.length - 4} more
              </Badge>
            )}
          </div>
        )}

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
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
          {job.applicationCount !== undefined && (
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {job.applicationCount} applicant{job.applicationCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t">
          {job.poster && (
            <div className="flex items-center gap-2">
              <Avatar
                src={job.poster.picture}
                name={job.poster.username}
                size="sm"
              />
              <div>
                <p className="text-sm font-medium">{job.poster.username}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatRelativeTime(new Date(job.createdAt))}
                </p>
              </div>
            </div>
          )}
          <Button asChild size="sm">
            <Link href={`/jobs/${job.id}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
