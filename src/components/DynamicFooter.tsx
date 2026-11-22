"use client";

import Link from "next/link";
import { Mail, MapPin, ArrowUpRight } from "lucide-react";
import { useSettings } from "@/lib/settings-context";
import { BrandLogo } from "@/components/home/BrandMark";

interface FooterLink {
  label: string;
  url?: string;
  /** Set when the link points at a CMS page the caller resolved as published. */
  pageId?: number;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

const DEFAULT_COLUMNS: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Browse listings", url: "/browse" },
      { label: "Report an item", url: "/report" },
      { label: "How it works", url: "/#how-it-works" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log in", url: "/login" },
      { label: "Create an account", url: "/register" },
      { label: "Dashboard", url: "/dashboard" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", url: "/terms" },
      { label: "Privacy Policy", url: "/privacy" },
      { label: "Cookie Policy", url: "/cookies" },
    ],
  },
];

// Routes that exist in the app. CMS links to anything else are dropped unless
// the caller resolved them to a published CMS page (they then carry pageId).
const KNOWN_PATHS = new Set([
  "/",
  "/browse",
  "/report",
  "/terms",
  "/privacy",
  "/cookies",
  "/login",
  "/register",
  "/dashboard",
  "/messages",
  "/profile",
]);

function usableUrl(link: FooterLink | null | undefined): string | null {
  const url = typeof link?.url === "string" ? link.url.trim() : "";
  if (!url || !link?.label) return null;
  if (/^https:\/\//i.test(url) || /^mailto:/i.test(url)) return url;
  if (!url.startsWith("/") || url.startsWith("//")) return null;
  if (link.pageId) return url;
  const path = url.split(/[?#]/)[0] || "/";
  return KNOWN_PATHS.has(path) || path.startsWith("/items/") ? url : null;
}

/** CMS columns with dead links removed; empty columns are dropped. */
function cleanColumns(columns: unknown): FooterColumn[] {
  if (!Array.isArray(columns)) return [];
  return columns
    .map((col) => ({
      title: typeof col?.title === "string" ? col.title : "",
      links: (Array.isArray(col?.links) ? col.links : [])
        .map((link: FooterLink) => ({ label: String(link?.label ?? ""), url: usableUrl(link) ?? "" }))
        .filter((link: FooterLink) => link.url),
    }))
    .filter((col) => col.title && col.links.length > 0)
    .slice(0, 3);
}

function titleCase(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}

const linkClass =
  "rounded text-sm text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-400 dark:hover:text-white";

/**
 * Site footer. `footerData` is the CMS footer row (optional). Contact details
 * come from the public organisation settings already loaded by
 * SettingsProvider, so the footer makes no request of its own.
 */
export default function DynamicFooter({ footerData }: { footerData?: any }) {
  const { settings } = useSettings();

  if (footerData && footerData.isActive === false) return null;

  const cmsColumns = cleanColumns(footerData?.footerLinks);
  const settingsColumns = cleanColumns(settings?.metadata?.footerGroups);
  const columns = cmsColumns.length > 0 ? cmsColumns : settingsColumns.length > 0 ? settingsColumns : DEFAULT_COLUMNS;

  const orgName = (typeof settings?.organizationName === "string" && settings.organizationName.trim()) || "LostFound";
  const description =
    footerData?.description ||
    settings?.metadata?.footerDescription ||
    "A community lost & found. Report what you've lost or found, get matched with the right person, and arrange a safe return.";
  const year = new Date().getFullYear();
  const copyright = footerData?.copyrightText || settings?.metadata?.copyrightText || `© ${year} ${orgName}. All rights reserved.`;
  const email: string | null = footerData?.contactEmail || settings?.supportEmail || settings?.contactEmail || null;
  const place = [settings?.city, settings?.country]
    .filter((p): p is string => typeof p === "string" && p.trim() !== "")
    .map(titleCase)
    .join(", ");

  const socialLinks: { platform?: string; url?: string }[] = (Array.isArray(footerData?.socialLinks) ? footerData.socialLinks : [])
    .filter((s: { url?: string }) => typeof s?.url === "string" && /^https:\/\//i.test(s.url));

  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-[1600px] px-4 py-14 sm:px-6 md:py-16 lg:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          {/* Brand + mission + contact */}
          <div className="md:col-span-5 lg:col-span-4">
            <Link href="/" aria-label="LostFound home" className="inline-flex rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
              {footerData?.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={footerData.logo} alt="" className="h-9 w-auto" loading="lazy" decoding="async" />
              ) : (
                <BrandLogo />
              )}
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>

            {(email || place) && (
              <ul className="mt-6 space-y-2.5 text-sm">
                {email && (
                  <li>
                    <a href={`mailto:${email}`} className={`inline-flex items-center gap-2.5 ${linkClass}`}>
                      <Mail className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
                      {email}
                    </a>
                  </li>
                )}
                {place && (
                  <li className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
                    <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
                    {place}
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7 lg:col-span-7 lg:col-start-6">
            {columns.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{column.title}</h2>
                <ul className="mt-4 space-y-3">
                  {column.links.map((link) => {
                    const url = link.url!;
                    const external = /^https:\/\//i.test(url);
                    return (
                      <li key={`${link.label}-${url}`}>
                        {external || url.startsWith("mailto:") ? (
                          <a
                            href={url}
                            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                            className={`inline-flex items-center gap-1 ${linkClass}`}
                          >
                            {link.label}
                            {external && <ArrowUpRight className="h-3.5 w-3.5 opacity-60" aria-hidden />}
                          </a>
                        ) : (
                          <Link href={url} className={linkClass}>
                            {link.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-slate-200 pt-6 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>{copyright}</p>
          {socialLinks.length > 0 && (
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {socialLinks.map((social) => (
                <li key={social.url}>
                  <a href={social.url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 ${linkClass}`}>
                    {social.platform || "Social"}
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}
