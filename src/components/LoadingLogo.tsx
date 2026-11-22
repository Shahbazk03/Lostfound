import { cn } from "@/lib/utils";

/**
 * The LF brand mark, gently pulsing. Used as a small inline loading
 * indicator across the app. Text colours and `animate-spin` passed in by
 * older call sites are ignored on purpose: the mark keeps its brand colour
 * and never spins.
 */
export function LoadingLogo({ className }: { className?: string }) {
  const cleanClassName = className?.replace(/text-\w+-\d+/g, "").replace("animate-spin", "");

  return (
    <svg
      className={cn("shrink-0 animate-pulse motion-reduce:animate-none", cleanClassName)}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Loading"
    >
      <rect width="100" height="100" rx="26" fill="#059669" />
      <text
        x="50%"
        y="54%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="white"
        fontSize="44"
        fontWeight="800"
        letterSpacing="-1"
        style={{ fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif" }}
      >
        LF
      </text>
    </svg>
  );
}
