// Theme color definitions
export interface ThemeColors {
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  ring: string;
  success: string;
  warning: string;
  error: string;
}

export interface ThemeFonts {
  sans: string;
  mono: string;
}

export interface ThemeBorderRadius {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface ThemeSpacing {
  unit: number; // Base unit in rem (e.g., 0.25)
  scale: number[]; // Multipliers
}

export interface ThemeTemplate {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  colors: ThemeColors;
  fonts: ThemeFonts;
  borderRadius: ThemeBorderRadius;
  spacing?: ThemeSpacing;
  darkMode?: ThemeColors;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: {
    id: string;
    username: string;
  };
}

export interface ThemeState {
  currentTheme: ThemeTemplate | null;
  isDarkMode: boolean;
  isLoading: boolean;
  error: string | null;
}

export type ThemeMode = "light" | "dark" | "system";

// Default theme matching current globals.css
export const DEFAULT_THEME: Omit<ThemeTemplate, "id" | "createdAt" | "updatedAt"> = {
  name: "Default",
  description: "System default theme",
  isActive: true,
  isDefault: true,
  colors: {
    background: "#ffffff",
    foreground: "#171717",
    primary: "#2563eb",
    primaryForeground: "#ffffff",
    secondary: "#f1f5f9",
    secondaryForeground: "#0f172a",
    accent: "#f59e0b",
    accentForeground: "#ffffff",
    muted: "#f1f5f9",
    mutedForeground: "#64748b",
    border: "#e2e8f0",
    input: "#e2e8f0",
    ring: "#2563eb",
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
  },
  fonts: {
    sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  borderRadius: {
    sm: "0.25rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    full: "9999px",
  },
  darkMode: {
    background: "#0a0a0a",
    foreground: "#ededed",
    primary: "#3b82f6",
    primaryForeground: "#ffffff",
    secondary: "#1e293b",
    secondaryForeground: "#f8fafc",
    accent: "#fbbf24",
    accentForeground: "#000000",
    muted: "#1e293b",
    mutedForeground: "#94a3b8",
    border: "#334155",
    input: "#334155",
    ring: "#3b82f6",
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
  },
};

// Font options for admin selector
export const FONT_OPTIONS = [
  {
    value:
      'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    label: "System Default",
  },
  { value: '"Inter", sans-serif', label: "Inter" },
  { value: '"Poppins", sans-serif', label: "Poppins" },
  { value: '"Roboto", sans-serif', label: "Roboto" },
  { value: '"Open Sans", sans-serif', label: "Open Sans" },
  { value: '"Nunito", sans-serif', label: "Nunito" },
  { value: '"Lato", sans-serif', label: "Lato" },
  { value: '"Montserrat", sans-serif', label: "Montserrat" },
];

export const MONO_FONT_OPTIONS = [
  {
    value:
      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    label: "System Default",
  },
  { value: '"Fira Code", monospace', label: "Fira Code" },
  { value: '"JetBrains Mono", monospace', label: "JetBrains Mono" },
  { value: '"Source Code Pro", monospace', label: "Source Code Pro" },
];

// Color preset palettes for quick selection
export const COLOR_PRESETS = {
  blues: ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#1d4ed8", "#1e40af"],
  greens: ["#22c55e", "#16a34a", "#15803d", "#166534", "#4ade80", "#86efac"],
  purples: ["#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6", "#a78bfa", "#c4b5fd"],
  oranges: ["#f59e0b", "#d97706", "#b45309", "#92400e", "#fbbf24", "#fcd34d"],
  reds: ["#ef4444", "#dc2626", "#b91c1c", "#991b1b", "#f87171", "#fca5a5"],
  neutrals: ["#171717", "#404040", "#737373", "#a3a3a3", "#d4d4d4", "#f5f5f5"],
};
