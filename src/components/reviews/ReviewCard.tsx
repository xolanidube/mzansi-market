"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { StarRating } from "@/components/ui/StarRating";
import { formatRelativeTime } from "@/lib/utils";

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    text: string | null;
    createdAt: string | Date;
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
  };
  showReceiver?: boolean;
}

export function ReviewCard({ review, showReceiver = false }: ReviewCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar
            src={review.sender.picture}
            name={review.sender.username}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div>
                <Link
                  href={`/users/${review.sender.id}`}
                  className="font-medium hover:text-primary"
                >
                  {review.sender.username}
                </Link>
                {showReceiver && review.receiver && (
                  <span className="text-muted-foreground">
                    {" → "}
                    <Link
                      href={
                        review.receiver.shop
                          ? `/shops/${review.receiver.shop.id}`
                          : `/users/${review.receiver.id}`
                      }
                      className="hover:text-primary"
                    >
                      {review.receiver.shop?.name || review.receiver.username}
                    </Link>
                  </span>
                )}
              </div>
              <span className="text-sm text-muted-foreground flex-shrink-0">
                {formatRelativeTime(new Date(review.createdAt))}
              </span>
            </div>
            <StarRating value={review.rating} readonly size="sm" />
            {review.text && (
              <p className="mt-2 text-sm text-muted-foreground">
                {review.text}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
