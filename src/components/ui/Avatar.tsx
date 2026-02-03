"use client";

import { useState } from "react";
import { cn, getInitials } from "@/lib/utils";

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Avatar({ src, alt, name, size = "md", className }: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizes = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  };

  const initials = name ? getInitials(name) : "?";

  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={alt || name || "Avatar"}
        className={cn(
          "rounded-full object-cover bg-secondary",
          sizes[size],
          className
        )}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium",
        sizes[size],
        className
      )}
      aria-label={alt || name || "Avatar"}
    >
      {initials}
    </div>
  );
}

export interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  size?: AvatarProps["size"];
}

export function AvatarGroup({ children, max = 4, size = "md" }: AvatarGroupProps) {
  const avatars = Array.isArray(children) ? children : [children];
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div className="flex -space-x-2">
      {visibleAvatars.map((avatar, index) => (
        <div
          key={index}
          className="ring-2 ring-background rounded-full"
        >
          {avatar}
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            "ring-2 ring-background rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-medium",
            size === "xs" && "w-6 h-6 text-xs",
            size === "sm" && "w-8 h-8 text-xs",
            size === "md" && "w-10 h-10 text-sm",
            size === "lg" && "w-12 h-12 text-sm",
            size === "xl" && "w-16 h-16 text-base"
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
