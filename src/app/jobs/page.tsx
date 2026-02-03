import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout";
import { JobList } from "@/components/jobs/JobList";
import { Button } from "@/components/ui/Button";
import { Briefcase, Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Browse Jobs | Mzansi Market",
  description: "Find freelance jobs, gigs, and projects on Mzansi Market marketplace",
};

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Briefcase className="w-8 h-8" />
                <h1 className="text-3xl font-bold">Job Marketplace</h1>
              </div>
              <p className="text-white/80 max-w-xl">
                Find freelance jobs, projects, and gigs from clients looking for
                skilled service providers
              </p>
            </div>
            <Button asChild variant="secondary">
              <Link href="/dashboard/jobs/new">
                <Plus className="w-4 h-4 mr-2" />
                Post a Job
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Job Listings */}
      <div className="container mx-auto px-4 py-8">
        <JobList showFilters />
      </div>
    </div>
  );
}
