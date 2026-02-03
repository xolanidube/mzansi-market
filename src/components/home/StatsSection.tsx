"use client";

import { Counter } from "@/components/ui/Counter";

const stats = [
  { value: 10000, label: "Service Providers", suffix: "+" },
  { value: 50000, label: "Happy Customers", suffix: "+" },
  { value: 100000, label: "Jobs Completed", suffix: "+" },
  { value: 4.8, label: "Average Rating", decimals: 1 },
];

export function StatsSection() {
  return (
    <section className="py-16 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-4xl font-bold text-primary mb-2">
                <Counter
                  value={stat.value}
                  suffix={stat.suffix}
                  decimals={stat.decimals || 0}
                  duration={2500}
                  triggerOnView
                />
              </p>
              <p className="text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
