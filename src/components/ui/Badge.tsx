"use client";

import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "error" | "outline";
  size?: "sm" | "md";
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const variants = {
      default: "bg-secondary text-secondary-foreground",
      primary: "bg-primary text-primary-foreground",
      secondary: "bg-muted text-muted-foreground",
      success: "bg-success/10 text-success border border-success/20",
      warning: "bg-warning/10 text-warning border border-warning/20",
      error: "bg-error/10 text-error border border-error/20",
      outline: "bg-transparent border border-border text-foreground",
    };

    const sizes = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-2.5 py-1 text-xs",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center font-medium rounded-full",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export { Badge };

// Status Badge for common statuses
export interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig: Record<string, { variant: BadgeProps["variant"]; label: string }> = {
    // Job statuses
    OPEN: { variant: "success", label: "Open" },
    IN_PROGRESS: { variant: "warning", label: "In Progress" },
    COMPLETED: { variant: "primary", label: "Completed" },
    CANCELLED: { variant: "error", label: "Cancelled" },
    CLOSED: { variant: "secondary", label: "Closed" },
    // Appointment statuses
    PENDING: { variant: "warning", label: "Pending" },
    CONFIRMED: { variant: "success", label: "Confirmed" },
    NO_SHOW: { variant: "error", label: "No Show" },
    // Application statuses
    ACCEPTED: { variant: "success", label: "Accepted" },
    REJECTED: { variant: "error", label: "Rejected" },
    WITHDRAWN: { variant: "secondary", label: "Withdrawn" },
    // Message statuses
    UNREAD: { variant: "primary", label: "Unread" },
    READ: { variant: "secondary", label: "Read" },
    ARCHIVED: { variant: "outline", label: "Archived" },
    DELETED: { variant: "error", label: "Deleted" },
    // Product statuses
    AVAILABLE: { variant: "success", label: "Available" },
    OUT_OF_STOCK: { variant: "error", label: "Out of Stock" },
    DISCONTINUED: { variant: "secondary", label: "Discontinued" },
    // Order statuses
    PROCESSING: { variant: "warning", label: "Processing" },
    SHIPPED: { variant: "primary", label: "Shipped" },
    DELIVERED: { variant: "success", label: "Delivered" },
    REFUNDED: { variant: "error", label: "Refunded" },
  };

  const config = statusConfig[status] || { variant: "default" as const, label: status };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
