"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface CounterProps {
  value: number;
  from?: number;
  duration?: number;
  format?: "number" | "currency" | "percentage";
  decimals?: number;
  prefix?: string;
  suffix?: string;
  triggerOnView?: boolean;
  className?: string;
  locale?: string;
  currency?: string;
}

export function Counter({
  value,
  from = 0,
  duration = 2000,
  format = "number",
  decimals = 0,
  prefix = "",
  suffix = "",
  triggerOnView = true,
  className,
  locale = "en-ZA",
  currency = "ZAR",
}: CounterProps) {
  const [displayValue, setDisplayValue] = useState(from);
  const [hasStarted, setHasStarted] = useState(!triggerOnView);
  const elementRef = useRef<HTMLSpanElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  // Easing function for smooth animation
  const easeOutExpo = (t: number): number => {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  };

  const animate = useCallback(() => {
    const startTime = performance.now();
    const startValue = from;
    const endValue = value;

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const currentValue = startValue + (endValue - startValue) * easedProgress;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(step);
      }
    };

    animationRef.current = requestAnimationFrame(step);
  }, [from, value, duration]);

  // Intersection Observer for triggering on view
  useEffect(() => {
    if (!triggerOnView) return;

    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasStarted) {
            setHasStarted(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [triggerOnView, hasStarted]);

  // Start animation when triggered
  useEffect(() => {
    if (hasStarted) {
      animate();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [hasStarted, animate]);

  // Format the display value
  const formatValue = (val: number): string => {
    switch (format) {
      case "currency":
        return new Intl.NumberFormat(locale, {
          style: "currency",
          currency: currency,
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(val);

      case "percentage":
        return new Intl.NumberFormat(locale, {
          style: "percent",
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(val / 100);

      default:
        return new Intl.NumberFormat(locale, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(val);
    }
  };

  return (
    <span ref={elementRef} className={cn("tabular-nums", className)}>
      {prefix}
      {formatValue(displayValue)}
      {suffix}
    </span>
  );
}
