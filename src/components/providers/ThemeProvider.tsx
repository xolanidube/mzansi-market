"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  ThemeTemplate,
  ThemeColors,
  ThemeMode,
  DEFAULT_THEME,
} from "@/types/theme";

interface ThemeContextValue {
  theme: ThemeTemplate | null;
  mode: ThemeMode;
  isDark: boolean;
  isLoading: boolean;
  setMode: (mode: ThemeMode) => void;
  refreshTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: ThemeTemplate | null;
}

export function ThemeProvider({
  children,
  initialTheme = null,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeTemplate | null>(initialTheme);
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [isLoading, setIsLoading] = useState(!initialTheme);

  // Determine if dark mode based on mode setting and system preference
  const isDark = useIsDarkMode(mode);

  // Fetch theme from API
  const refreshTheme = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/theme/active");
      if (response.ok) {
        const data = await response.json();
        setTheme(data);
      }
    } catch (error) {
      console.error("Failed to fetch theme:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch if no initialTheme provided
  useEffect(() => {
    if (!initialTheme) {
      refreshTheme();
    }
  }, [initialTheme, refreshTheme]);

  // Apply CSS variables when theme or mode changes
  useEffect(() => {
    if (theme) {
      applyThemeToDOM(theme, isDark);
    }
  }, [theme, isDark]);

  // Persist mode preference
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem("theme-mode", newMode);

    // Update document attribute
    if (newMode === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else if (newMode === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      // System mode
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      document.documentElement.classList.toggle("dark", prefersDark);
      document.documentElement.setAttribute(
        "data-theme",
        prefersDark ? "dark" : "light"
      );
    }
  }, []);

  // Load mode from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem("theme-mode") as ThemeMode;
    if (savedMode) {
      setModeState(savedMode);
    }
  }, []);

  return (
    <ThemeContext.Provider
      value={{ theme, mode, isDark, isLoading, setMode, refreshTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Helper hook for system dark mode detection
function useIsDarkMode(mode: ThemeMode): boolean {
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  if (mode === "dark") return true;
  if (mode === "light") return false;
  return systemDark;
}

// Convert camelCase to kebab-case
function camelToKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

// Apply theme CSS variables to document root
function applyThemeToDOM(theme: ThemeTemplate, isDark: boolean) {
  const root = document.documentElement;
  const colors: ThemeColors =
    isDark && theme.darkMode ? theme.darkMode : theme.colors;

  // Colors
  Object.entries(colors).forEach(([key, value]) => {
    const cssVar = `--color-${camelToKebab(key)}`;
    root.style.setProperty(cssVar, value);
  });

  // Fonts
  root.style.setProperty("--font-sans", theme.fonts.sans);
  root.style.setProperty("--font-mono", theme.fonts.mono);

  // Border radius
  Object.entries(theme.borderRadius).forEach(([key, value]) => {
    root.style.setProperty(`--radius-${key}`, value);
  });

  // Set dark mode class
  root.classList.toggle("dark", isDark);
  root.setAttribute("data-theme", isDark ? "dark" : "light");
}
