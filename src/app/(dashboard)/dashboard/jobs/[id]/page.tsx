"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { JobForm } from "@/components/jobs/JobForm";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";

interface JobData {
  id: string;
  title: string;
  description: string;
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
  posterId: string;
}

export default function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [job, setJob] = useState<JobData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch(`/api/jobs/${id}`);
        const data = await response.json();

        if (response.ok) {
          // Check if user owns this job
          if (data.job.poster.id !== session?.user?.id) {
            setError("You can only edit your own jobs");
            return;
          }
          setJob(data.job);
        } else {
          setError(data.error || "Failed to load job");
        }
      } catch (err) {
        setError("An error occurred while loading the job");
      } finally {
        setIsLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchJob();
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [id, session?.user?.id, status, router]);

  if (isLoading || status === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert variant="error">{error}</Alert>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert variant="error">Job not found</Alert>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Job</h1>
        <p className="text-muted-foreground">Update your job posting</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent>
          <JobForm
            initialData={{
              id: job.id,
              title: job.title,
              description: job.description,
              categoryId: job.categoryId || "",
              subCategory: job.subCategory || "",
              skills: job.skills,
              jobType: job.jobType,
              customJobType: job.customJobType || "",
              budgetMin: job.budgetMin?.toString() || "",
              budgetMax: job.budgetMax?.toString() || "",
              estimatedBudget: job.estimatedBudget || "",
              deliveryDays: job.deliveryDays?.toString() || "",
              preferredLocation: job.preferredLocation || "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
