import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { SettingsProvider } from "@/lib/settings-context";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { ErrorSuppressor } from "@/components/ErrorSuppressor";
import { getSiteUrl } from "@/lib/utils";

// Self-hosted by next/font (no request to Google at runtime). Tailwind's
// `font-sans` points at this variable (see @theme in globals.css).
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteTitle = "LostFound · Report lost items and find what's been found";
const siteDescription =
  "Report a lost or found item in a minute, get smart match suggestions and chat privately to arrange a safe return.";

export const metadata: Metadata = {
  // Lets relative og:image / canonical URLs resolve to absolute ones.
  metadataBase: new URL(getSiteUrl()),
  title: siteTitle,
  description: siteDescription,
  applicationName: "LostFound",
  openGraph: {
    type: "website",
    siteName: "LostFound",
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary",
    title: siteTitle,
    description: siteDescription,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body
        className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-200"
        suppressHydrationWarning
      >
        <ErrorSuppressor />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SettingsProvider>
            <AuthProvider>
              <Navbar />
              <main id="main">{children}</main>
              <AnalyticsTracker />
            </AuthProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
