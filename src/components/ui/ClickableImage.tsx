"use client";

import { useState } from "react";
import Image from "next/image";
import { Lightbox, LightboxImage } from "./Lightbox";
import { cn } from "@/lib/utils";
import { Expand } from "lucide-react";

interface ClickableImageProps {
  src: string;
  alt: string;
  caption?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  showExpandIcon?: boolean;
}

export function ClickableImage({
  src,
  alt,
  caption,
  fill = true,
  width,
  height,
  className,
  containerClassName,
  priority = false,
  showExpandIcon = true,
}: ClickableImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  const images: LightboxImage[] = [{ src, alt, caption }];

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "relative group cursor-pointer overflow-hidden",
          containerClassName
        )}
        aria-label={`View ${alt} in fullscreen`}
      >
        {fill ? (
          <Image
            src={src}
            alt={alt}
            fill
            className={cn("object-cover transition-transform group-hover:scale-105", className)}
            priority={priority}
          />
        ) : (
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={cn("object-cover transition-transform group-hover:scale-105", className)}
            priority={priority}
          />
        )}

        {/* Hover Overlay */}
        {showExpandIcon && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-3">
              <Expand className="w-6 h-6 text-foreground" />
            </div>
          </div>
        )}
      </button>

      <Lightbox
        images={images}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialIndex={0}
      />
    </>
  );
}

interface ImageGalleryProps {
  images: LightboxImage[];
  className?: string;
  columns?: 2 | 3 | 4;
}

export function ImageGallery({
  images,
  className,
  columns = 3,
}: ImageGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);

  const handleImageClick = (index: number) => {
    setInitialIndex(index);
    setIsOpen(true);
  };

  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  };

  return (
    <>
      <div className={cn("grid gap-4", gridCols[columns], className)}>
        {images.map((image, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleImageClick(index)}
            className="relative aspect-square group cursor-pointer overflow-hidden rounded-lg"
            aria-label={`View ${image.alt || "image"} in fullscreen`}
          >
            <Image
              src={image.src}
              alt={image.alt || "Gallery image"}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                <Expand className="w-5 h-5 text-foreground" />
              </div>
            </div>
          </button>
        ))}
      </div>

      <Lightbox
        images={images}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialIndex={initialIndex}
        showThumbnails={images.length > 1}
      />
    </>
  );
}
