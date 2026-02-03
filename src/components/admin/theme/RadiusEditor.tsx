"use client";

import { Input } from "@/components/ui";
import { ThemeBorderRadius } from "@/types/theme";

interface RadiusEditorProps {
  values: ThemeBorderRadius;
  onChange: (key: keyof ThemeBorderRadius, value: string) => void;
}

const radiusOptions: { key: keyof ThemeBorderRadius; label: string }[] = [
  { key: "sm", label: "Small" },
  { key: "md", label: "Medium" },
  { key: "lg", label: "Large" },
  { key: "xl", label: "Extra Large" },
  { key: "full", label: "Full (Pill)" },
];

export function RadiusEditor({ values, onChange }: RadiusEditorProps) {
  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-foreground">Border Radius</label>
      <div className="grid grid-cols-2 gap-4">
        {radiusOptions.map(({ key, label }) => (
          <div key={key} className="space-y-2">
            <label className="text-xs text-muted-foreground">{label}</label>
            <div className="flex items-center gap-2">
              <Input
                value={values[key]}
                onChange={(e) => onChange(key, e.target.value)}
                placeholder="0.5rem"
                className="flex-1"
              />
              <div
                className="w-10 h-10 bg-primary"
                style={{ borderRadius: values[key] }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
