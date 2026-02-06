import type { Metadata } from "next";
import { SessionProvider, ThemeProvider } from "@/components/providers";
import { getActiveTheme, generateThemeCSSVariables, darkModeScript } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Mzansi Market - Marketplace for Services & Jobs",
    template: "%s | Mzansi Market",
  },
  description:
    "Connect with skilled service providers or offer your services. Find jobs, book appointments, and grow your business with Mzansi Market.",
  keywords: [
    "marketplace",
    "services",
    "jobs",
    "freelance",
    "South Africa",
    "service providers",
    "booking",
    "appointments",
  ],
  authors: [{ name: "Mzansi Market Tech" }],
  creator: "Mzansi Market Tech",
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: "https://mzansimarket.co.za",
    siteName: "Mzansi Market",
    title: "Mzansi Market - Marketplace for Services & Jobs",
    description:
      "Connect with skilled service providers or offer your services. Find jobs, book appointments, and grow your business with Mzansi Market.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mzansi Market - Marketplace for Services & Jobs",
    description:
      "Connect with skilled service providers or offer your services.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch theme on server
  const theme = await getActiveTheme();
  const themeCSS = generateThemeCSSVariables(theme);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inject theme CSS to prevent FOUC */}
        <style
          id="theme-variables"
          dangerouslySetInnerHTML={{ __html: themeCSS }}
        />
        {/* Script to handle dark mode before hydration */}
        <script dangerouslySetInnerHTML={{ __html: darkModeScript }} />
      </head>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <SessionProvider>
          <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
