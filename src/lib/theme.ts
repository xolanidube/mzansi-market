import { prisma } from "./prisma";
import { ThemeTemplate, ThemeColors, DEFAULT_THEME } from "@/types/theme";
import { cache } from "react";

// Cached theme fetcher for SSR
export const getActiveTheme = cache(async (): Promise<ThemeTemplate | null> => {
  try {
    const theme = await prisma.themeConfig.findFirst({
      where: { isActive: true },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!theme) return null;

    return {
      id: theme.id,
      name: theme.name,
      description: theme.description || undefined,
      isActive: theme.isActive,
      isDefault: theme.isDefault,
      colors: theme.colors as ThemeColors,
      fonts: theme.fonts as ThemeTemplate["fonts"],
      borderRadius: theme.borderRadius as ThemeTemplate["borderRadius"],
      spacing: theme.spacing as ThemeTemplate["spacing"],
      darkMode: theme.darkMode as ThemeColors,
      createdAt: theme.createdAt,
      updatedAt: theme.updatedAt,
      createdBy: theme.createdBy || undefined,
    };
  } catch (error) {
    console.error("Failed to fetch active theme:", error);
    return null;
  }
});

// Convert camelCase to kebab-case
function camelToKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

// Generate CSS variables string from theme
export function generateThemeCSSVariables(theme: ThemeTemplate | null): string {
  const t = theme || DEFAULT_THEME;

  const colorVars = Object.entries(t.colors)
    .map(([key, value]) => `--color-${camelToKebab(key)}: ${value};`)
    .join("\n    ");

  const darkColorVars = t.darkMode
    ? Object.entries(t.darkMode)
        .map(([key, value]) => `--color-${camelToKebab(key)}: ${value};`)
        .join("\n      ")
    : "";

  const fontVars = `--font-sans: ${t.fonts.sans};
    --font-mono: ${t.fonts.mono};`;

  const radiusVars = Object.entries(t.borderRadius)
    .map(([key, value]) => `--radius-${key}: ${value};`)
    .join("\n    ");

  return `
  :root {
    ${colorVars}
    ${fontVars}
    ${radiusVars}
  }
  ${
    t.darkMode
      ? `
  .dark, [data-theme="dark"] {
      ${darkColorVars}
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      ${darkColorVars}
    }
  }
  `
      : ""
  }
  `;
}

// Script to inject before hydration to prevent flash
export const darkModeScript = `
(function() {
  try {
    var mode = localStorage.getItem('theme-mode');
    if (mode === 'dark' || (mode === 'system' || !mode) && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch (e) {}
})();
`;
