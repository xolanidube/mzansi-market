"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  presets?: string[];
}

const DEFAULT_PRESETS = [
  "#2563eb", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7",
  "#ec4899", "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#000000", "#171717", "#404040", "#737373", "#ffffff",
];

export function ColorPicker({
  label,
  value,
  onChange,
  presets = DEFAULT_PRESETS,
}: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(value);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  const handlePresetClick = useCallback(
    (preset: string) => {
      setInputValue(preset);
      onChange(preset);
    },
    [onChange]
  );

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => {
              setInputValue(e.target.value);
              onChange(e.target.value);
            }}
            className="w-10 h-10 rounded-lg border border-border cursor-pointer"
          />
        </div>
        <Input
          value={inputValue}
          onChange={handleInputChange}
          placeholder="#000000"
          className="w-28 font-mono text-sm"
        />
        <div
          className="w-10 h-10 rounded-lg border border-border"
          style={{ backgroundColor: value }}
        />
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => handlePresetClick(preset)}
            className={cn(
              "w-6 h-6 rounded border-2 transition-all",
              value === preset
                ? "border-ring scale-110"
                : "border-transparent hover:scale-105"
            )}
            style={{ backgroundColor: preset }}
            title={preset}
          />
        ))}
      </div>
    </div>
  );
}
