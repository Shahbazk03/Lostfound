/**
 * Chart theme shared by the dashboard and analytics. Kept free of recharts so
 * legends and tables can import it without pulling the charting library.
 *
 * Palette (validated with the dataviz checker, light + dark surfaces):
 * lost #e11d48, found #0ea371. The pair sits in the CVD 6-8 band, so "lost"
 * also gets a dashed stroke and every chart with both series has a legend.
 * Single-series charts use the found/brand green.
 */
export const LOST_COLOR = "#e11d48";
export const FOUND_COLOR = "#0ea371";
export const SERIES_COLOR = FOUND_COLOR;

export const chartVars =
  "[--chart-grid:#e2e8f0] [--chart-axis:#64748b] [--chart-surface:#ffffff] dark:[--chart-grid:#1e293b] dark:[--chart-axis:#94a3b8] dark:[--chart-surface:#0f172a]";

export function shortDay(day: string) {
  const d = new Date(`${day}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function longDay(day: string) {
  const d = new Date(`${day}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}

export function compactNumber(v: number) {
  return Math.abs(v) >= 10_000 ? new Intl.NumberFormat("en-US", { notation: "compact" }).format(v) : v.toLocaleString("en-US");
}

export function Swatch({ color, dashed }: { color: string; dashed?: boolean }) {
  return (
    <svg width="16" height="8" viewBox="0 0 16 8" aria-hidden="true" className="shrink-0">
      <line x1="1" y1="4" x2="15" y2="4" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={dashed ? "3 3" : undefined} />
    </svg>
  );
}
