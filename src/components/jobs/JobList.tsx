"use client";

import { useState, useEffect } from "react";
import { JobCard } from "./JobCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Search, SlidersHorizontal, X } from "lucide-react";

interface Job {
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
  createdAt: string;
  poster?: {
    id: string;
    username: string;
    picture?: string | null;
  };
  applicationCount?: number;
}

interface JobListProps {
  initialJobs?: Job[];
  showFilters?: boolean;
  posterId?: string;
  status?: string;
}

const jobTypes = [
  { value: "", label: "All Types" },
  { value: "FIX", label: "Fixed Price" },
  { value: "HOURLY", label: "Hourly" },
  { value: "FREELANCE", label: "Freelance" },
  { value: "FULLTIME", label: "Full-time" },
  { value: "PARTTIME", label: "Part-time" },
  { value: "INTERNSHIP", label: "Internship" },
  { value: "TEMPORARY", label: "Temporary" },
];

export function JobList({
  initialJobs,
  showFilters = true,
  posterId,
  status: initialStatus,
}: JobListProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs || []);
  const [isLoading, setIsLoading] = useState(!initialJobs);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [jobType, setJobType] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "12");

      if (search) params.set("search", search);
      if (jobType) params.set("jobType", jobType);
      if (minBudget) params.set("minBudget", minBudget);
      if (maxBudget) params.set("maxBudget", maxBudget);
      if (posterId) params.set("posterId", posterId);
      if (initialStatus) params.set("status", initialStatus);

      const response = await fetch(`/api/jobs?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setJobs(data.jobs);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initialJobs) {
      fetchJobs();
    }
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const clearFilters = () => {
    setSearch("");
    setJobType("");
    setMinBudget("");
    setMaxBudget("");
    setPage(1);
    fetchJobs();
  };

  const hasActiveFilters = search || jobType || minBudget || maxBudget;

  return (
    <div className="space-y-6">
      {showFilters && (
        <>
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search jobs..."
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </Button>
          </form>

          {/* Filter Panel */}
          {showFilterPanel && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Filters</h3>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Job Type</label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    {jobTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Min Budget</label>
                  <Input
                    type="number"
                    value={minBudget}
                    onChange={(e) => setMinBudget(e.target.value)}
                    placeholder="R0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Max Budget</label>
                  <Input
                    type="number"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    placeholder="Any"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => { setPage(1); fetchJobs(); }}>
                  Apply Filters
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Jobs Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No jobs found</p>
          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters} className="mt-2">
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-6">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
