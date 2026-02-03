"use client";

import { ClickableImage } from "@/components/ui/ClickableImage";
import { Tag } from "lucide-react";

interface ServiceImageProps {
  src?: string | null;
  alt: string;
  className?: string;
}

export function ServiceImage({ src, alt, className }: ServiceImageProps) {
  if (!src) {
    return (
      <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
        <div className="w-full h-full flex items-center justify-center">
          <Tag className="w-16 h-16 text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
      <ClickableImage
        src={src}
        alt={alt}
        fill
        priority
        containerClassName="w-full h-full"
        className={className}
      />
    </div>
  );
}
