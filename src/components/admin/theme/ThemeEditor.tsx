"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Spinner,
} from "@/components/ui";
import { ColorPicker } from "./ColorPicker";
import { FontSelector } from "./FontSelector";
import { RadiusEditor } from "./RadiusEditor";
import { ThemePreview } from "./ThemePreview";
import {
  ThemeTemplate,
  ThemeColors,
  ThemeBorderRadius,
  DEFAULT_THEME,
} from "@/types/theme";

interface ThemeEditorProps {
  initialTheme?: Partial<ThemeTemplate>;
  onSave: (theme: Partial<ThemeTemplate>) => Promise<void>;
  isLoading?: boolean;
}

type TabType = "colors" | "darkMode" | "typography" | "preview";

export function ThemeEditor({ initialTheme, onSave, isLoading }: ThemeEditorProps) {
  const [theme, setTheme] = useState<Partial<ThemeTemplate>>({
    ...DEFAULT_THEME,
    ...initialTheme,
  });
  const [activeTab, setActiveTab] = useState<TabType>("colors");

  const updateColor = useCallback((key: keyof ThemeColors, value: string) => {
    setTheme((prev) => ({
      ...prev,
      colors: { ...prev.colors!, [key]: value },
    }));
  }, []);

  const updateDarkColor = useCallback((key: keyof ThemeColors, value: string) => {
    setTheme((prev) => ({
      ...prev,
      darkMode: { ...(prev.darkMode || prev.colors!), [key]: value },
    }));
  }, []);

  const updateFont = useCallback((key: "sans" | "mono", value: string) => {
    setTheme((prev) => ({
      ...prev,
      fonts: { ...prev.fonts!, [key]: value },
    }));
  }, []);

  const updateRadius = useCallback(
    (key: keyof ThemeBorderRadius, value: string) => {
      setTheme((prev) => ({
        ...prev,
        borderRadius: { ...prev.borderRadius!, [key]: value },
      }));
    },
    []
  );

  const tabs: { id: TabType; label: string }[] = [
    { id: "colors", label: "Colors" },
    { id: "darkMode", label: "Dark Mode" },
    { id: "typography", label: "Typography" },
    { id: "preview", label: "Preview" },
  ];

  return (
    <div className="space-y-6">
      {/* Theme Details */}
      <Card>
        <CardHeader>
          <CardTitle>Theme Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Theme Name *
            </label>
            <Input
              value={theme.name || ""}
              onChange={(e) =>
                setTheme((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="My Custom Theme"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              value={theme.description || ""}
              onChange={(e) =>
                setTheme((prev) => ({ ...prev, description: e.target.value }))
              }
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground resize-none"
              rows={2}
              placeholder="Describe this theme..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {activeTab === "colors" && (
            <Card>
              <CardHeader>
                <CardTitle>Light Mode Colors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ColorPicker
                    label="Primary"
                    value={theme.colors!.primary}
                    onChange={(v) => updateColor("primary", v)}
                  />
                  <ColorPicker
                    label="Primary Foreground"
                    value={theme.colors!.primaryForeground}
                    onChange={(v) => updateColor("primaryForeground", v)}
                  />
                  <ColorPicker
                    label="Secondary"
                    value={theme.colors!.secondary}
                    onChange={(v) => updateColor("secondary", v)}
                  />
                  <ColorPicker
                    label="Secondary Foreground"
                    value={theme.colors!.secondaryForeground}
                    onChange={(v) => updateColor("secondaryForeground", v)}
                  />
                  <ColorPicker
                    label="Accent"
                    value={theme.colors!.accent}
                    onChange={(v) => updateColor("accent", v)}
                  />
                  <ColorPicker
                    label="Accent Foreground"
                    value={theme.colors!.accentForeground}
                    onChange={(v) => updateColor("accentForeground", v)}
                  />
                  <ColorPicker
                    label="Background"
                    value={theme.colors!.background}
                    onChange={(v) => updateColor("background", v)}
                  />
                  <ColorPicker
                    label="Foreground"
                    value={theme.colors!.foreground}
                    onChange={(v) => updateColor("foreground", v)}
                  />
                  <ColorPicker
                    label="Muted"
                    value={theme.colors!.muted}
                    onChange={(v) => updateColor("muted", v)}
                  />
                  <ColorPicker
                    label="Muted Foreground"
                    value={theme.colors!.mutedForeground}
                    onChange={(v) => updateColor("mutedForeground", v)}
                  />
                  <ColorPicker
                    label="Border"
                    value={theme.colors!.border}
                    onChange={(v) => updateColor("border", v)}
                  />
                  <ColorPicker
                    label="Input"
                    value={theme.colors!.input}
                    onChange={(v) => updateColor("input", v)}
                  />
                  <ColorPicker
                    label="Ring (Focus)"
                    value={theme.colors!.ring}
                    onChange={(v) => updateColor("ring", v)}
                  />
                  <ColorPicker
                    label="Success"
                    value={theme.colors!.success}
                    onChange={(v) => updateColor("success", v)}
                  />
                  <ColorPicker
                    label="Warning"
                    value={theme.colors!.warning}
                    onChange={(v) => updateColor("warning", v)}
                  />
                  <ColorPicker
                    label="Error"
                    value={theme.colors!.error}
                    onChange={(v) => updateColor("error", v)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "darkMode" && (
            <Card>
              <CardHeader>
                <CardTitle>Dark Mode Colors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ColorPicker
                    label="Background"
                    value={theme.darkMode?.background || "#0a0a0a"}
                    onChange={(v) => updateDarkColor("background", v)}
                  />
                  <ColorPicker
                    label="Foreground"
                    value={theme.darkMode?.foreground || "#ededed"}
                    onChange={(v) => updateDarkColor("foreground", v)}
                  />
                  <ColorPicker
                    label="Primary"
                    value={theme.darkMode?.primary || "#3b82f6"}
                    onChange={(v) => updateDarkColor("primary", v)}
                  />
                  <ColorPicker
                    label="Secondary"
                    value={theme.darkMode?.secondary || "#1e293b"}
                    onChange={(v) => updateDarkColor("secondary", v)}
                  />
                  <ColorPicker
                    label="Muted"
                    value={theme.darkMode?.muted || "#1e293b"}
                    onChange={(v) => updateDarkColor("muted", v)}
                  />
                  <ColorPicker
                    label="Muted Foreground"
                    value={theme.darkMode?.mutedForeground || "#94a3b8"}
                    onChange={(v) => updateDarkColor("mutedForeground", v)}
                  />
                  <ColorPicker
                    label="Border"
                    value={theme.darkMode?.border || "#334155"}
                    onChange={(v) => updateDarkColor("border", v)}
                  />
                  <ColorPicker
                    label="Input"
                    value={theme.darkMode?.input || "#334155"}
                    onChange={(v) => updateDarkColor("input", v)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "typography" && (
            <Card>
              <CardHeader>
                <CardTitle>Typography & Spacing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FontSelector
                  label="Sans Serif Font"
                  value={theme.fonts!.sans}
                  onChange={(v) => updateFont("sans", v)}
                />
                <FontSelector
                  label="Monospace Font"
                  value={theme.fonts!.mono}
                  onChange={(v) => updateFont("mono", v)}
                  type="mono"
                />
                <hr className="border-border" />
                <RadiusEditor values={theme.borderRadius!} onChange={updateRadius} />
              </CardContent>
            </Card>
          )}

          {activeTab === "preview" && (
            <div className="space-y-4">
              <ThemePreview theme={theme} isDark={false} />
              {theme.darkMode && <ThemePreview theme={theme} isDark={true} />}
            </div>
          )}
        </div>

        {/* Live Preview (always visible on lg screens) */}
        <div className="hidden lg:block lg:sticky lg:top-20 lg:self-start space-y-4">
          <ThemePreview theme={theme} isDark={false} />
          {theme.darkMode && <ThemePreview theme={theme} isDark={true} />}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={() =>
            setTheme({
              ...DEFAULT_THEME,
              name: theme.name,
              description: theme.description,
            })
          }
        >
          Reset to Default
        </Button>
        <Button
          variant="primary"
          onClick={() => onSave(theme)}
          disabled={isLoading || !theme.name?.trim()}
        >
          {isLoading ? <Spinner size="sm" /> : "Save Theme"}
        </Button>
      </div>
    </div>
  );
}
