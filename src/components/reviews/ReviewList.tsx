"use client";

import { useState, useEffect } from "react";
import { ReviewCard } from "./ReviewCard";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Star } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  text: string | null;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    picture: string | null;
  };
  receiver?: {
    id: string;
    username: string;
    picture: string | null;
    shop?: {
      id: string;
      name: string;
    } | null;
  };
}

interface ReviewStats {
  averageRating: number | null;
  totalReviews: number;
  ratingCounts: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

interface ReviewListProps {
  receiverId?: string;
  senderId?: string;
  showStats?: boolean;
  showReceiver?: boolean;
}

export function ReviewList({
  receiverId,
  senderId,
  showStats = true,
  showReceiver = false,
}: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", "10");
        if (receiverId) params.set("receiverId", receiverId);
        if (senderId) params.set("senderId", senderId);

        const response = await fetch(`/api/reviews?${params.toString()}`);
        const data = await response.json();

        if (response.ok) {
          setReviews(data.reviews);
          setStats(data.stats);
          setTotalPages(data.pagination.totalPages);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [receiverId, senderId, page]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {showStats && stats && (
        <div className="bg-muted/50 rounded-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Average Rating */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-4xl font-bold">
                  {stats.averageRating?.toFixed(1) || "0.0"}
                </span>
                <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
              </div>
              <p className="text-muted-foreground">
                Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.ratingCounts[rating as keyof typeof stats.ratingCounts];
                const percentage = stats.totalReviews > 0
                  ? (count / stats.totalReviews) * 100
                  : 0;

                return (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm w-3">{rating}</span>
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <Star className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No reviews yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                showReceiver={showReceiver}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
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
