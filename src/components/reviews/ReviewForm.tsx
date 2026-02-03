"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { StarRating } from "@/components/ui/StarRating";
import { Send, Loader2 } from "lucide-react";

interface ReviewFormProps {
  receiverId: string;
  receiverName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({
  receiverId,
  receiverName,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId,
          rating,
          text: text.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      setSuccess("Review submitted successfully!");

      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      } else {
        setTimeout(() => {
          router.refresh();
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div>
        <p className="text-sm text-muted-foreground mb-2">
          How would you rate your experience with <strong>{receiverName}</strong>?
        </p>
        <StarRating
          value={rating}
          onChange={setRating}
          size="lg"
        />
      </div>

      <Textarea
        label="Your Review (optional)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Share your experience with this provider..."
        rows={4}
      />

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || rating === 0}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit Review
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
