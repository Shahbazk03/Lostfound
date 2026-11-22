/**
 * Small display helpers shared by the homepage (server) and /browse (client).
 * Pure functions: callers pass `now`, so server and client render the same text.
 */

/**
 * Tidies user-entered place names: trims, collapses spaces and capitalises
 * words typed all in lowercase ("tedhi pulia" -> "Tedhi Pulia"), leaving
 * deliberate casing like "IIT" or "McLeod" alone.
 */
export function prettyPlace(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => (word === word.toLowerCase() ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

/** "Hazratganj · Lucknow", without repeating the city when the area already names it. */
export function placeLabel(area: string | null | undefined, city: string | null | undefined): string {
  const a = prettyPlace(area);
  const c = prettyPlace(city);
  if (!a) return c;
  if (!c || a.toLowerCase().includes(c.toLowerCase())) return a;
  return `${a} · ${c}`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function plural(n: number, unit: string) {
  return `${n} ${unit}${n === 1 ? "" : "s"} ago`;
}

/** Compact relative time for timestamps: "just now", "12m ago", "3h ago", "5d ago". */
export function timeAgo(iso: string, now: number): string {
  const diff = now - Date.parse(iso);
  if (!Number.isFinite(diff)) return "";
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  const days = Math.floor(diff / DAY);
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

/** Relative day for calendar dates (when something was lost or found). */
export function daysAgo(iso: string, now: number): string {
  const diff = now - Date.parse(iso);
  if (!Number.isFinite(diff)) return "";
  const days = Math.max(0, Math.floor(diff / DAY));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return plural(days, "day");
  if (days < 30) return plural(Math.floor(days / 7), "week");
  if (days < 365) return plural(Math.floor(days / 30), "month");
  return plural(Math.floor(days / 365), "year");
}

/** Full date for tooltips, e.g. "10 Jun 2026". Fixed locale and zone so SSR and client agree. */
export function fullDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** Money from integer minor units, e.g. 499 + "INR" -> "₹4.99". */
export function formatMoney(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}
