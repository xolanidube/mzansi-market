"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui";
import { ThemeTemplate, ThemeColors, DEFAULT_THEME } from "@/types/theme";

interface ThemePreviewProps {
  theme: Partial<ThemeTemplate>;
  isDark?: boolean;
}

export function ThemePreview({ theme, isDark = false }: ThemePreviewProps) {
  // Generate inline styles for preview
  const previewStyles = useMemo(() => {
    const colors = isDark && theme.darkMode ? theme.darkMode : theme.colors;
    if (!colors) return {};

    const vars: Record<string, string> = {};

    // Colors
    Object.entries(colors).forEach(([key, value]) => {
      const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      vars[`--color-${cssKey}`] = value;
    });

    // Fonts
    if (theme.fonts) {
      vars["--font-sans"] = theme.fonts.sans;
      vars["--font-mono"] = theme.fonts.mono;
    }

    // Border radius
    if (theme.borderRadius) {
      Object.entries(theme.borderRadius).forEach(([key, value]) => {
        vars[`--radius-${key}`] = value;
      });
    }

    return vars;
  }, [theme, isDark]);

  const colors = isDark && theme.darkMode ? theme.darkMode : (theme.colors || DEFAULT_THEME.colors);
  const fonts = theme.fonts || DEFAULT_THEME.fonts;
  const radius = theme.borderRadius || DEFAULT_THEME.borderRadius;

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">
          Live Preview {isDark ? "(Dark)" : "(Light)"}
        </h3>
      </div>
      <div
        className="p-6 space-y-6"
        style={{
          ...previewStyles,
          backgroundColor: colors.background,
          color: colors.foreground,
          fontFamily: fonts.sans,
        } as React.CSSProperties}
      >
        {/* Card Example */}
        <div
          className="p-4"
          style={{
            backgroundColor: colors.background,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
          }}
        >
          <h4 style={{ color: colors.foreground, marginBottom: "0.5rem" }}>
            Card Component
          </h4>
          <p style={{ color: colors.mutedForeground, fontSize: "0.875rem" }}>
            This is sample text in muted foreground color.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            className="px-4 py-2 font-medium transition-colors"
            style={{
              backgroundColor: colors.primary,
              color: colors.primaryForeground,
              borderRadius: radius.lg,
            }}
          >
            Primary
          </button>
          <button
            className="px-4 py-2 font-medium transition-colors"
            style={{
              backgroundColor: colors.secondary,
              color: colors.secondaryForeground,
              borderRadius: radius.lg,
            }}
          >
            Secondary
          </button>
          <button
            className="px-4 py-2 font-medium transition-colors"
            style={{
              backgroundColor: colors.accent,
              color: colors.accentForeground,
              borderRadius: radius.lg,
            }}
          >
            Accent
          </button>
        </div>

        {/* Status Badges */}
        <div className="flex gap-2">
          <span
            className="px-2 py-1 text-sm font-medium"
            style={{
              backgroundColor: colors.success,
              color: "#fff",
              borderRadius: radius.md,
            }}
          >
            Success
          </span>
          <span
            className="px-2 py-1 text-sm font-medium"
            style={{
              backgroundColor: colors.warning,
              color: "#fff",
              borderRadius: radius.md,
            }}
          >
            Warning
          </span>
          <span
            className="px-2 py-1 text-sm font-medium"
            style={{
              backgroundColor: colors.error,
              color: "#fff",
              borderRadius: radius.md,
            }}
          >
            Error
          </span>
        </div>

        {/* Input */}
        <input
          type="text"
          placeholder="Sample input field"
          className="w-full px-3 py-2"
          style={{
            backgroundColor: colors.background,
            border: `1px solid ${colors.input}`,
            borderRadius: radius.lg,
            color: colors.foreground,
          }}
        />

        {/* Muted Section */}
        <div
          className="p-3"
          style={{
            backgroundColor: colors.muted,
            borderRadius: radius.md,
          }}
        >
          <p
            style={{
              color: colors.mutedForeground,
              fontSize: "0.875rem",
            }}
          >
            Muted background with muted text color
          </p>
        </div>
      </div>
    </Card>
  );
}
