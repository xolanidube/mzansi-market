"use client";

import { ClickableImage } from "@/components/ui/ClickableImage";

interface ShopCoverImageProps {
  src?: string | null;
  alt: string;
}

export function ShopCoverImage({ src, alt }: ShopCoverImageProps) {
  if (!src) {
    return null;
  }

  return (
    <ClickableImage
      src={src}
      alt={alt}
      fill
      priority
      containerClassName="absolute inset-0"
    />
  );
}
