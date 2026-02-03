"use client";

import { FONT_OPTIONS, MONO_FONT_OPTIONS } from "@/types/theme";

interface FontSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "sans" | "mono";
}

export function FontSelector({
  label,
  value,
  onChange,
  type = "sans",
}: FontSelectorProps) {
  const options = type === "mono" ? MONO_FONT_OPTIONS : FONT_OPTIONS;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
        style={{ fontFamily: value }}
      >
        {options.map((option) => (
          <option
            key={option.label}
            value={option.value}
            style={{ fontFamily: option.value }}
          >
            {option.label}
          </option>
        ))}
      </select>
      <p
        className="text-sm text-muted-foreground p-2 bg-secondary/50 rounded"
        style={{ fontFamily: value }}
      >
        The quick brown fox jumps over the lazy dog. 0123456789
      </p>
    </div>
  );
}
