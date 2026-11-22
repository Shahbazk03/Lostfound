import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Public origin of the site, from NEXT_PUBLIC_APP_URL (falls back to
 * localhost for development). Used for metadataBase, sitemap and robots.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) {
    try {
      return new URL(raw).origin;
    } catch {
      // fall through to the default
    }
  }
  return "http://localhost:3000";
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "N/A";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return "N/A";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency,
  }).format(amount / 100);
}

export const categories = [
  "Electronics",
  "Jewelry",
  "Wallet / Purse",
  "Keys",
  "Documents",
  "Clothing",
  "Pets",
  "Bags / Luggage",
  "Sports Equipment",
  "Toys",
  "Other",
];

// Common names (from the CMS or older links) for the canonical categories above.
const categoryAliases: Record<string, string> = {
  phone: "Electronics",
  phones: "Electronics",
  mobile: "Electronics",
  mobiles: "Electronics",
  smartphone: "Electronics",
  smartphones: "Electronics",
  laptop: "Electronics",
  laptops: "Electronics",
  gadgets: "Electronics",
  electronic: "Electronics",
  wallet: "Wallet / Purse",
  wallets: "Wallet / Purse",
  purse: "Wallet / Purse",
  purses: "Wallet / Purse",
  key: "Keys",
  bag: "Bags / Luggage",
  bags: "Bags / Luggage",
  luggage: "Bags / Luggage",
  backpack: "Bags / Luggage",
  backpacks: "Bags / Luggage",
  suitcase: "Bags / Luggage",
  document: "Documents",
  id: "Documents",
  ids: "Documents",
  "id cards": "Documents",
  passport: "Documents",
  passports: "Documents",
  jewellery: "Jewelry",
  jewelery: "Jewelry",
  pet: "Pets",
  dog: "Pets",
  dogs: "Pets",
  cat: "Pets",
  cats: "Pets",
  clothes: "Clothing",
  apparel: "Clothing",
  sports: "Sports Equipment",
  sport: "Sports Equipment",
  toy: "Toys",
  others: "Other",
  misc: "Other",
};

/**
 * Maps a display name (e.g. "Wallets", "phones") to one of the canonical
 * `categories` values that items are stored with. Returns null when there is
 * no sensible match.
 */
export function toItemCategory(name: string | null | undefined): string | null {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  if (!key) return null;
  const exact = categories.find((c) => c.toLowerCase() === key);
  if (exact) return exact;
  return categoryAliases[key] ?? null;
}

/** Browse URL for a category name; falls back to a text search if unknown. */
export function categoryBrowseHref(name: string): string {
  const category = toItemCategory(name);
  return category
    ? `/browse?category=${encodeURIComponent(category)}`
    : `/browse?query=${encodeURIComponent(name)}`;
}

/**
 * Returns `next` only when it is a same-site relative path ("/x", not "//x"
 * or "/\x"), otherwise the fallback. Used for post-login redirects.
 * Backslashes, whitespace and control characters are rejected outright,
 * since browsers strip or normalise them ("/\t/evil.com" becomes "//evil.com").
 */
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\\\s\u0000-\u001f\u007f]/.test(next)) return fallback;
  return next;
}

export const countries = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "India",
  "Japan",
  "Brazil",
  "Mexico",
  "Spain",
  "Italy",
  "Netherlands",
  "Singapore",
  "South Korea",
  "China",
  "Other",
];

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** "just now", "5 min ago", "3 hours ago", "yesterday", "4 days ago", else "Jun 10, 2026". */
export function formatRelativeTime(date: Date | string | null, now: number = Date.now()): string {
  if (!date) return "";
  const d = new Date(date);
  const diff = now - d.getTime();
  if (Number.isNaN(diff)) return "";
  if (diff < MINUTE_MS) return "just now";
  if (diff < HOUR_MS) return `${Math.floor(diff / MINUTE_MS)} min ago`;
  if (diff < DAY_MS) {
    const h = Math.floor(diff / HOUR_MS);
    return `${h} ${h === 1 ? "hour" : "hours"} ago`;
  }
  const days = Math.round((startOfDay(new Date(now)) - startOfDay(d)) / DAY_MS);
  if (days <= 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) {
    const w = Math.floor(days / 7);
    return `${w} ${w === 1 ? "week" : "weeks"} ago`;
  }
  return formatDate(d);
}

/** Compact timestamp for lists: "2:05 PM" today, "Yesterday", "Mon", "Jun 10", "Jun 10, 2025". */
export function formatShortTimestamp(date: Date | string | null, now: number = Date.now()): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const days = Math.round((startOfDay(new Date(now)) - startOfDay(d)) / DAY_MS);
  if (days <= 0) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  const sameYear = d.getFullYear() === new Date(now).getFullYear();
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }) });
}

/** Day separator label: "Today", "Yesterday", "Monday, June 8", "June 8, 2025". */
export function formatDayLabel(date: Date | string, now: number = Date.now()): string {
  const d = new Date(date);
  const days = Math.round((startOfDay(new Date(now)) - startOfDay(d)) / DAY_MS);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  const sameYear = d.getFullYear() === new Date(now).getFullYear();
  if (days < 7) return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", ...(sameYear ? {} : { year: "numeric" }) });
}

/** "Priya Sharma" -> "PS", "alex" -> "A". */
export function getInitials(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}
