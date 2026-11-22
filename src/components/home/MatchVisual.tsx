"use client";

import { useEffect, useRef, useState } from "react";
import { Wallet, Smartphone, KeyRound, MapPin, Check, Sparkles, Lock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Report {
  title: string;
  place: string;
  when: string;
}

interface Pair {
  icon: LucideIcon;
  category: string;
  lost: Report;
  found: Report;
  score: number;
  reasons: string[];
  message: string;
}

// Illustrative examples only (shown as such in the caption).
const PAIRS: Pair[] = [
  {
    icon: Wallet,
    category: "Wallet / Purse",
    lost: { title: "Black leather wallet", place: "Hazratganj", when: "2h ago" },
    found: { title: "Wallet with ID cards", place: "Hazratganj Metro", when: "35m ago" },
    score: 92,
    reasons: ["Same category", "Same area", "Similar description"],
    message: "Hi! I think I found your wallet. Is there a blue metro card inside?",
  },
  {
    icon: Smartphone,
    category: "Electronics",
    lost: { title: "iPhone 14, blue case", place: "Gomti Nagar", when: "yesterday" },
    found: { title: "Blue iPhone left at a café", place: "Gomti Nagar", when: "5h ago" },
    score: 88,
    reasons: ["Same category", "Same city", "Dates line up"],
    message: "Found this at a café on Vibhuti Khand. What's on the lock screen?",
  },
  {
    icon: KeyRound,
    category: "Keys",
    lost: { title: "Car keys, red keyring", place: "Aminabad", when: "3d ago" },
    found: { title: "Keys with a red tag", place: "Aminabad Market", when: "2d ago" },
    score: 95,
    reasons: ["Same category", "Same area", "Similar description"],
    message: "These were at a shop counter. Which car brand is the key for?",
  },
];

const CYCLE_MS = 4200;

function ScoreRing({ score }: { score: number }) {
  const r = 9;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 -rotate-90" aria-hidden>
      <circle cx="12" cy="12" r={r} fill="none" strokeWidth="3" className="stroke-emerald-100 dark:stroke-emerald-500/20" />
      <circle
        cx="12"
        cy="12"
        r={r}
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${(score / 100) * c} ${c}`}
        className="stroke-emerald-500 transition-[stroke-dasharray] duration-700 ease-out"
      />
    </svg>
  );
}

function ReportCard({ kind, report, pair }: { kind: "lost" | "found"; report: Report; pair: Pair }) {
  const lost = kind === "lost";
  const Icon = pair.icon;
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-3.5">
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset sm:h-14 sm:w-14",
          lost
            ? "bg-rose-50 text-rose-600 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20"
            : "bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20"
        )}
      >
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              lost
                ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
            )}
          >
            {lost ? "Lost" : "Found"}
          </span>
          <span className="truncate text-xs text-slate-400 dark:text-slate-500">{pair.category}</span>
        </div>
        <p className="mt-1 truncate text-[15px] font-semibold text-slate-900 dark:text-white">{report.title}</p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-[13px] text-slate-500 dark:text-slate-400">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            {report.place}, Lucknow · {report.when}
          </span>
        </p>
      </div>
    </div>
  );
}

/**
 * Hero illustration: a lost report and a found report being matched.
 * Cycles through a few examples (paused on hover/focus, when scrolled out of
 * view, and entirely for reduced motion). The first example is in the
 * server HTML, so it is complete without JavaScript.
 */
export default function MatchVisual() {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [inView, setInView] = useState(true);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (hovered || !inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setTimeout(() => setIndex((i) => (i + 1) % PAIRS.length), CYCLE_MS);
    return () => clearTimeout(id);
  }, [index, hovered, inView]);

  const pair = PAIRS[index];

  return (
    <figure
      ref={ref}
      // Centred on small screens; on desktop it hugs the container's right edge
      // so it mirrors the text column's left edge (navbar edges line up too).
      className="relative mx-auto w-full max-w-[600px] lg:mr-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      {/* Soft glow, kept inside the hero's bounds */}
      <div
        aria-hidden
        className="absolute inset-4 -z-10 rounded-[2rem] bg-gradient-to-b from-emerald-400/25 via-teal-300/10 to-transparent blur-3xl dark:from-emerald-500/20"
      />

      <div className="rounded-[1.75rem] border border-slate-200/80 bg-slate-50/80 p-3 shadow-xl shadow-slate-900/[0.07] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-black/40 sm:p-4">
        {/* Header */}
        <div className="flex items-center justify-between px-1.5 pb-3 pt-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
            </span>
            Smart match
          </p>
          <div className="flex items-center" role="group" aria-label="Examples">
            {PAIRS.map((p, i) => (
              <button
                key={p.lost.title}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show example ${i + 1} of ${PAIRS.length}`}
                aria-pressed={i === index}
                className="group/dot flex h-8 w-6 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <span
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === index
                      ? "w-4 bg-emerald-500"
                      : "w-1.5 bg-slate-300 group-hover/dot:bg-slate-400 dark:bg-slate-600"
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        <div key={index} className="animate-fade-up motion-reduce:animate-none">
          <ReportCard kind="lost" report={pair.lost} pair={pair} />

          {/* Connector: flowing dashes, a travelling pulse and the score */}
          <div className="relative flex h-[76px] items-center justify-center" aria-hidden>
            <svg className="absolute inset-y-0 left-1/2 h-full w-2 -translate-x-1/2" viewBox="0 0 8 76" preserveAspectRatio="none">
              <line
                x1="4"
                y1="0"
                x2="4"
                y2="76"
                strokeWidth="2"
                strokeDasharray="4 4"
                strokeLinecap="round"
                className="animate-dash-flow stroke-emerald-400/70 motion-reduce:animate-none dark:stroke-emerald-500/50"
              />
            </svg>
            <span
              className="absolute left-1/2 top-0 -ml-[5px] h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.18)] animate-travel-down [--travel:66px] motion-reduce:hidden"
            />
            <span className="relative inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white py-1 pl-1.5 pr-3.5 text-sm font-bold text-emerald-700 shadow-md shadow-emerald-900/5 dark:border-emerald-500/30 dark:bg-slate-950 dark:text-emerald-300">
              <span className="absolute inset-0 -z-10 rounded-full bg-emerald-400/30 motion-safe:animate-ping [animation-duration:2.4s]" />
              <ScoreRing score={pair.score} />
              <span className="tabular-nums">{pair.score}% match</span>
            </span>
          </div>

          <ReportCard kind="found" report={pair.found} pair={pair} />

          <ul className="mt-3 flex flex-wrap gap-1.5 px-0.5" aria-label="Why it matched">
            {pair.reasons.map((reason) => (
              <li
                key={reason}
                className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200/80 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700/80"
              >
                <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" aria-hidden />
                {reason}
              </li>
            ))}
          </ul>

          {/* Private chat preview */}
          <div className="mt-3 rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <Lock className="h-3 w-3" aria-hidden />
              Private chat
            </p>
            <div className="mt-2 flex items-end gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" aria-hidden>
                F
              </span>
              <p className="rounded-2xl rounded-bl-md bg-slate-100 px-3 py-2 text-[13px] leading-snug text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {pair.message}
              </p>
            </div>
          </div>
        </div>
      </div>

      <figcaption className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
        Illustrative example of how a lost report is matched with a found one
      </figcaption>
    </figure>
  );
}
