"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  createContext,
  useContext,
  Children,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

interface CarouselContextValue {
  currentIndex: number;
  totalSlides: number;
  goTo: (index: number) => void;
  next: () => void;
  previous: () => void;
}

const CarouselContext = createContext<CarouselContextValue | null>(null);

function useCarousel() {
  const context = useContext(CarouselContext);
  if (!context) {
    throw new Error("Carousel components must be used within a Carousel");
  }
  return context;
}

export interface CarouselProps {
  children: ReactNode;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  loop?: boolean;
  gap?: number;
  className?: string;
}

export function Carousel({
  children,
  autoPlay = false,
  autoPlayInterval = 5000,
  showDots = true,
  showArrows = true,
  loop = true,
  gap = 16,
  className,
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const slides = Children.toArray(children);
  const totalSlides = slides.length;

  const goTo = useCallback(
    (index: number) => {
      if (loop) {
        setCurrentIndex((index + totalSlides) % totalSlides);
      } else {
        setCurrentIndex(Math.max(0, Math.min(index, totalSlides - 1)));
      }
    },
    [loop, totalSlides]
  );

  const next = useCallback(() => {
    goTo(currentIndex + 1);
  }, [currentIndex, goTo]);

  const previous = useCallback(() => {
    goTo(currentIndex - 1);
  }, [currentIndex, goTo]);

  // Auto-play
  useEffect(() => {
    if (!autoPlay || isPaused || totalSlides <= 1) return;

    const interval = setInterval(next, autoPlayInterval);
    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, isPaused, next, totalSlides]);

  // Touch/swipe support
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (diff > threshold) {
      next();
    } else if (diff < -threshold) {
      previous();
    }
  };

  return (
    <CarouselContext.Provider
      value={{ currentIndex, totalSlides, goTo, next, previous }}
    >
      <div
        className={cn("relative overflow-hidden", className)}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides container */}
        <div
          ref={containerRef}
          className="flex transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            gap: `${gap}px`,
          }}
        >
          {slides.map((slide, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-full"
              aria-hidden={index !== currentIndex}
            >
              {slide}
            </div>
          ))}
        </div>

        {/* Arrow navigation */}
        {showArrows && totalSlides > 1 && (
          <>
            <button
              onClick={previous}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border text-foreground hover:bg-background transition-colors shadow-lg"
              aria-label="Previous slide"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border text-foreground hover:bg-background transition-colors shadow-lg"
              aria-label="Next slide"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {showDots && totalSlides > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentIndex
                    ? "bg-primary w-6"
                    : "bg-foreground/30 hover:bg-foreground/50"
                )}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === currentIndex}
              />
            ))}
          </div>
        )}
      </div>
    </CarouselContext.Provider>
  );
}

export interface CarouselSlideProps {
  children: ReactNode;
  className?: string;
}

export function CarouselSlide({ children, className }: CarouselSlideProps) {
  return <div className={cn("w-full", className)}>{children}</div>;
}

// Export hook for custom controls
export { useCarousel };

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
