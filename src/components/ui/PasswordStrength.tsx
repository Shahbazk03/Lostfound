import { cn } from "@/lib/utils";

const CHECKS: { test: (p: string) => boolean; tip: string }[] = [
  { test: (p) => p.length >= 8, tip: "Use at least 8 characters" },
  { test: (p) => /[A-Z]/.test(p), tip: "Add an uppercase letter" },
  { test: (p) => /[a-z]/.test(p), tip: "Add a lowercase letter" },
  { test: (p) => /[0-9]/.test(p), tip: "Add a number" },
  { test: (p) => /[^A-Za-z0-9]/.test(p), tip: "Add a symbol" },
];

/** 0–5: one point per rule met. */
export function passwordScore(password: string) {
  return CHECKS.filter((c) => c.test(password)).length;
}

/** Live strength bar with a hint for the next improvement. */
export function PasswordStrength({ password, id }: { password: string; id?: string }) {
  if (!password) return null;
  const score = passwordScore(password);
  const label = score <= 2 ? "Weak" : score <= 4 ? "Medium" : "Strong";
  const color = score <= 2 ? "bg-red-500" : score <= 4 ? "bg-amber-500" : "bg-emerald-500";
  const text =
    score <= 2 ? "text-red-600 dark:text-red-400" : score <= 4 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400";
  const nextTip = CHECKS.find((c) => !c.test(password))?.tip;

  return (
    <div id={id} className="mt-2" aria-live="polite">
      <div className="flex gap-1" aria-hidden="true">
        {CHECKS.map((_, i) => (
          <span
            key={i}
            className={cn("h-1 flex-1 rounded-full transition-colors duration-200", i < score ? color : "bg-slate-200 dark:bg-slate-700")}
          />
        ))}
      </div>
      <p className="mt-1.5 flex justify-between gap-3 text-xs">
        <span className="text-slate-500 dark:text-slate-400">{nextTip ? `Tip: ${nextTip.toLowerCase()}.` : "Great password."}</span>
        <span className={cn("shrink-0 font-medium", text)}>{label}</span>
      </p>
    </div>
  );
}
