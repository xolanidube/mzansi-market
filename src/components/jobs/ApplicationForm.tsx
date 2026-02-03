"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { Send, Loader2 } from "lucide-react";

interface ApplicationFormProps {
  jobId: string;
  jobTitle: string;
  budgetMax?: number | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ApplicationForm({
  jobId,
  jobTitle,
  budgetMax,
  onSuccess,
  onCancel,
}: ApplicationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [proposal, setProposal] = useState("");
  const [bidAmount, setBidAmount] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/jobs/${jobId}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposal,
          bidAmount: bidAmount ? parseFloat(bidAmount) : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit application");
      }

      setSuccess("Application submitted successfully!");

      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      } else {
        setTimeout(() => {
          router.push("/dashboard/applications");
          router.refresh();
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div>
        <h3 className="text-lg font-medium mb-1">Apply to: {jobTitle}</h3>
        <p className="text-sm text-muted-foreground">
          Write a compelling proposal to increase your chances of being hired
        </p>
      </div>

      <Textarea
        label="Your Proposal"
        value={proposal}
        onChange={(e) => setProposal(e.target.value)}
        required
        rows={6}
        placeholder="Introduce yourself and explain why you're the best fit for this job. Include relevant experience, your approach to the project, and any questions you have..."
      />

      <Input
        label="Your Bid Amount (ZAR)"
        type="number"
        min="0"
        value={bidAmount}
        onChange={(e) => setBidAmount(e.target.value)}
        placeholder={budgetMax ? `Suggested: ${budgetMax}` : "Enter your bid"}
        helperText="Leave empty if you want to negotiate the price"
      />

      <div className="flex justify-end gap-4 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit Application
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
