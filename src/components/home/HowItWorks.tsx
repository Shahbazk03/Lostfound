"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Camera, Check, CheckCircle2, Lock, MapPin, MessagesSquare, PenLine, Sparkles, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    id: "report",
    icon: PenLine,
    title: "Report it in a minute",
    body: "Describe the item, add a photo and mark roughly where it went missing or turned up. The exact spot stays private.",
  },
  {
    id: "match",
    icon: Sparkles,
    title: "Get smart matches",
    body: "LostFound compares category, place, date and description with reports from the other side and shows the likeliest matches first.",
  },
  {
    id: "reunite",
    icon: MessagesSquare,
    title: "Chat and reunite",
    body: "Message privately, ask about a detail only the owner would know, and arrange a safe handover in a public place.",
  },
] as const;

/* ---- Step visuals (small UI mock-ups, decorative) ---------------------- */

function Field({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof MapPin }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
        {Icon && <Icon className="h-3.5 w-3.5 text-slate-400" aria-hidden />}
        <span className="truncate">{value}</span>
      </p>
    </div>
  );
}

function ReportVisual() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white p-4 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">New report</p>
        <div className="flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-semibold dark:bg-slate-800">
          <span className="rounded-md bg-white px-2 py-1 text-rose-600 shadow-sm dark:bg-slate-950 dark:text-rose-400">Lost</span>
          <span className="px-2 py-1 text-slate-500">Found</span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-[88px_1fr] gap-3">
        <div className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-950">
          <Camera className="h-5 w-5" aria-hidden />
          <span className="text-[10px] font-medium">Add photo</span>
        </div>
        <div className="space-y-2.5">
          <Field label="Title" value="Black leather wallet" />
          <Field label="Category" value="Wallet / Purse" icon={Wallet} />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field label="Approximate area" value="Hazratganj" icon={MapPin} />
        <Field label="Exact spot" value="Hidden" icon={Lock} />
      </div>
      <div className="mt-4 flex h-9 items-center justify-center rounded-lg bg-emerald-600 text-[13px] font-semibold text-white">
        Post report
      </div>
    </div>
  );
}

const MATCHES = [
  { title: "Wallet with ID cards", place: "Hazratganj Metro", score: 92, tone: "text-emerald-600 dark:text-emerald-400", reasons: ["Same area", "Same category"] },
  { title: "Brown leather wallet", place: "Charbagh", score: 74, tone: "text-amber-600 dark:text-amber-400", reasons: ["Same category"] },
  { title: "Card holder", place: "Indira Nagar", score: 41, tone: "text-slate-500", reasons: ["Same city"] },
];

function MatchVisualMini() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white p-4 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-semibold text-slate-900 dark:text-white">Matches for your report</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">Black leather wallet · Hazratganj</p>
      <ul className="mt-3 space-y-2">
        {MATCHES.map((m, i) => (
          <li
            key={m.title}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-2.5",
              i === 0
                ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-500/5"
                : "border-slate-200/80 dark:border-slate-800"
            )}
          >
            <span className={cn("w-11 shrink-0 text-center text-base font-bold tabular-nums", m.tone)}>{m.score}%</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-slate-900 dark:text-white">{m.title}</span>
              <span className="mt-0.5 flex flex-wrap gap-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{m.place} ·</span>
                {m.reasons.map((r) => (
                  <span key={r} className="text-[11px] text-slate-500 dark:text-slate-400">{r}</span>
                ))}
              </span>
            </span>
            <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">Found</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChatVisual() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white p-4 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">F</span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-white">Wallet with ID cards</p>
          <p className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <Lock className="h-3 w-3" aria-hidden /> Private conversation
          </p>
        </div>
      </div>
      <div className="mt-3 space-y-2 text-[13px] leading-snug">
        <p className="mr-10 rounded-2xl rounded-bl-md bg-slate-100 px-3 py-2 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          Hi! Is there a blue metro card inside?
        </p>
        <p className="ml-10 rounded-2xl rounded-br-md bg-emerald-600 px-3 py-2 text-white">
          Yes, and a library card with my name on it.
        </p>
        <p className="mr-10 rounded-2xl rounded-bl-md bg-slate-100 px-3 py-2 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          Great. Meet at the Hazratganj Metro gate at 6?
        </p>
      </div>
      <p className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
        <CheckCircle2 className="h-4 w-4" aria-hidden /> Marked as reunited
      </p>
    </div>
  );
}

const VISUALS = [ReportVisual, MatchVisualMini, ChatVisual];

/**
 * Interactive three-step explainer. Hovering, clicking or arrowing through
 * the steps swaps the illustration. Uses the ARIA tabs pattern; without
 * JavaScript the first step shows.
 */
export default function HowItWorks() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const Visual = VISUALS[active];

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const delta = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!delta && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const next =
      e.key === "Home" ? 0 : e.key === "End" ? STEPS.length - 1 : (active + delta + STEPS.length) % STEPS.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
      <div role="tablist" aria-label="How LostFound works" aria-orientation="vertical" onKeyDown={onKeyDown} className="space-y-3">
        {STEPS.map((step, i) => {
          const selected = i === active;
          return (
            <button
              key={step.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              id={`how-tab-${step.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="how-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(i)}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "group relative flex w-full gap-4 rounded-2xl border p-5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950",
                selected
                  ? "border-slate-200 bg-white shadow-md shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-900"
                  : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-900/50"
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-colors",
                  selected
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                    : "bg-slate-100 text-slate-500 group-hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                )}
              >
                {selected ? <step.icon className="h-5 w-5" aria-hidden /> : i + 1}
              </span>
              <span>
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Step {i + 1}
                  {i < active && <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden />}
                </span>
                <span className={cn("mt-0.5 block text-lg font-semibold", selected ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300")}>
                  {step.title}
                </span>
                <span className="mt-1 block text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">{step.body}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div
        id="how-panel"
        role="tabpanel"
        aria-labelledby={`how-tab-${STEPS[active].id}`}
        className="relative flex min-h-[340px] items-center justify-center overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-emerald-50/60 p-5 dark:border-slate-800 dark:from-slate-900 dark:to-emerald-950/30 sm:min-h-[380px] sm:p-8"
      >
        <div aria-hidden className="absolute inset-0 bg-[url('/grid.svg')] opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] dark:opacity-10" />
        <div key={active} className="relative flex w-full justify-center animate-fade-up motion-reduce:animate-none" aria-hidden>
          <Visual />
        </div>
        <p className="sr-only">{STEPS[active].body}</p>
      </div>
    </div>
  );
}
