import Form from "next/form";
import { Search, SearchX, HandHeart, Info } from "lucide-react";

// "I lost something" means the visitor wants items others have FOUND, and
// vice versa, so each mode searches the opposite item type.
const SEARCH_MODES = [
  {
    id: "hero-mode-lost",
    label: "I lost something",
    shortLabel: "I lost it",
    icon: SearchX,
    searchType: "found",
  },
  {
    id: "hero-mode-found",
    label: "I found something",
    shortLabel: "I found it",
    icon: HandHeart,
    searchType: "lost",
  },
] as const;

/**
 * Hero search. No client state at all: it is a plain GET form to
 * /browse?type=…&search=… (next/form adds client-side navigation once
 * hydrated), and the mode hint switches with CSS (:has(:checked)), so it
 * works and looks right before any JavaScript runs.
 */
export default function HeroSearch() {
  return (
    <Form
      action="/browse"
      role="search"
      aria-label="Search lost and found items"
      className="group rounded-2xl border border-slate-200/80 bg-white p-2 shadow-lg shadow-slate-900/[0.06] dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30 sm:p-2.5"
    >
      <fieldset>
        <legend className="sr-only">What happened?</legend>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
          {SEARCH_MODES.map((m, i) => (
            <label key={m.id} htmlFor={m.id} className="relative block cursor-pointer">
              <input
                id={m.id}
                type="radio"
                name="type"
                value={m.searchType}
                defaultChecked={i === 0}
                className="peer sr-only"
              />
              <span className="flex h-10 items-center justify-center gap-2 rounded-lg px-2 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 peer-checked:bg-white peer-checked:text-slate-900 peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500 dark:text-slate-300 dark:hover:text-white dark:peer-checked:bg-slate-950 dark:peer-checked:text-white">
                <m.icon className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                <span className="sm:hidden">{m.shortLabel}</span>
                <span className="hidden sm:inline">{m.label}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="hero-search" className="sr-only">
            What are you looking for?
          </label>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            id="hero-search"
            name="search"
            type="search"
            autoComplete="off"
            enterKeyHint="search"
            maxLength={200}
            placeholder="Try “black wallet” or “iPhone”"
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950/60 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
        >
          Search
        </button>
      </div>

      <p className="mt-2 flex items-center gap-1.5 px-1.5 pb-0.5 text-sm text-slate-500 dark:text-slate-400">
        <Info className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
        <span className="group-has-[#hero-mode-found:checked]:hidden">We&apos;ll search items other people have found.</span>
        <span className="hidden group-has-[#hero-mode-found:checked]:inline">We&apos;ll search items other people have lost.</span>
      </p>
    </Form>
  );
}
