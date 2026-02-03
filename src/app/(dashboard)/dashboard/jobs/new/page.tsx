import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { JobForm } from "@/components/jobs/JobForm";

export const metadata: Metadata = {
  title: "Post a Job | Mzansi Market",
  description: "Post a new job on Mzansi Market marketplace",
};

export default function NewJobPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Post a New Job</h1>
        <p className="text-muted-foreground">
          Describe your project to attract qualified service providers
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent>
          <JobForm />
        </CardContent>
      </Card>
    </div>
  );
}
