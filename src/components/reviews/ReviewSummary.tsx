"use client";

import { StarRating } from "@/components/ui/StarRating";

interface ReviewSummaryProps {
  rating: number | null;
  totalReviews: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
}

export function ReviewSummary({
  rating,
  totalReviews,
  size = "md",
  showCount = true,
}: ReviewSummaryProps) {
  if (!rating && totalReviews === 0) {
    return (
      <span className="text-sm text-muted-foreground">No reviews yet</span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <StarRating value={rating || 0} readonly size={size} />
      {showCount && (
        <span className="text-sm text-muted-foreground">
          ({totalReviews} review{totalReviews !== 1 ? "s" : ""})
        </span>
      )}
    </div>
  );
}
