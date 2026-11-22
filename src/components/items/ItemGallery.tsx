"use client";
/* eslint-disable @next/next/no-img-element -- listing photos are often data: URLs, which next/image can't optimise */

import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";
import { ChevronLeft, ChevronRight, Expand, ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SWIPE_PX = 45;

function useSwipe(onPrev: () => void, onNext: () => void) {
  const startX = useRef<number | null>(null);
  const startY = useRef(0);
  return {
    onTouchStart: (e: TouchEvent) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
    },
    onTouchEnd: (e: TouchEvent) => {
      if (startX.current === null) return;
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;
      startX.current = null;
      if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy)) return;
      if (dx > 0) onPrev();
      else onNext();
    },
  };
}

const navBtn =
  "absolute top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:bg-slate-900/80 dark:text-slate-100 dark:ring-white/10 dark:hover:bg-slate-900";

/**
 * Main photo with thumbnails and a full-screen viewer (arrow keys, Escape,
 * swipe). The main box has a fixed aspect ratio so nothing shifts on load.
 */
export function ItemGallery({ photos, title }: { photos: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const count = photos.length;
  const current = Math.min(index, Math.max(0, count - 1));

  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);
  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const swipe = useSwipe(prev, next);

  if (count === 0) {
    return (
      <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-100/70 text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500 sm:aspect-[16/10]">
        <ImageIcon className="h-12 w-12" aria-hidden="true" />
        <p className="text-sm font-medium">No photos added</p>
      </div>
    );
  }

  const photo = photos[current];

  return (
    <div>
      <div
        className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-inset ring-slate-900/5 dark:bg-slate-900 dark:ring-white/5 sm:aspect-[16/10]"
        {...(count > 1 ? swipe : {})}
      >
        {/* Soft, blurred copy fills the letterbox so portrait photos still look intentional. */}
        <img
          src={photo}
          alt=""
          aria-hidden="true"
          decoding="async"
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl dark:opacity-30"
        />
        <img
          src={photo}
          alt={count > 1 ? `${title}, photo ${current + 1} of ${count}` : title}
          decoding="async"
          fetchPriority="high"
          className="relative h-full w-full object-contain"
        />
        <button
          type="button"
          onClick={() => setViewerOpen(true)}
          aria-label="View photos full screen"
          className="absolute inset-0 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-slate-950/60 px-2.5 py-1 text-xs font-medium text-white opacity-0 backdrop-blur transition group-hover:opacity-100 [@media(hover:none)]:opacity-100"
        >
          <Expand className="h-3.5 w-3.5" />
          {count > 1 ? `${current + 1} / ${count}` : "View"}
        </span>
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous photo"
              className={cn(navBtn, "left-3 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100")}
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next photo"
              className={cn(navBtn, "right-3 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100")}
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Photos">
          {photos.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1} of ${count}`}
              aria-current={i === current ? "true" : undefined}
              className={cn(
                "relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-2 ring-offset-2 ring-offset-slate-50 transition focus-visible:outline-none focus-visible:ring-emerald-500 dark:bg-slate-800 dark:ring-offset-slate-950 sm:h-[4.5rem] sm:w-24",
                i === current ? "ring-emerald-500" : "ring-transparent opacity-70 hover:opacity-100"
              )}
            >
              <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {viewerOpen && (
        <Lightbox
          photos={photos}
          title={title}
          index={current}
          onIndex={setIndex}
          onPrev={prev}
          onNext={next}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
}

function Lightbox({
  photos,
  title,
  index,
  onIndex,
  onPrev,
  onNext,
  onClose,
}: {
  photos: string[];
  title: string;
  index: number;
  onIndex: (i: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const count = photos.length;
  const closeRef = useRef<HTMLButtonElement>(null);
  const swipe = useSwipe(onPrev, onNext);

  // Latest handlers, so the mount effect below runs once per open.
  const handlers = useRef({ onClose, onPrev, onNext });
  useEffect(() => {
    handlers.current = { onClose, onPrev, onNext };
  });

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handlers.current.onClose();
      else if (e.key === "ArrowLeft" && count > 1) handlers.current.onPrev();
      else if (e.key === "ArrowRight" && count > 1) handlers.current.onNext();
      else if (e.key === "Tab") {
        // Keep focus inside the viewer.
        const root = closeRef.current?.closest('[role="dialog"]');
        const nodes = root ? Array.from(root.querySelectorAll<HTMLElement>("button")) : [];
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) last.focus();
        else if (!e.shiftKey && document.activeElement === last) first.focus();
        else return;
      } else return;
      e.preventDefault();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [count]);

  const bigBtn =
    "inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Photos of ${title}`}
      className="fixed inset-0 z-[70] flex flex-col bg-slate-950/95 text-white transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none"
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <p className="min-w-0 truncate text-sm font-medium text-white/80">
          {title}
          {count > 1 && <span className="ml-2 tabular-nums text-white/50">{index + 1} / {count}</span>}
        </p>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close viewer" className={bigBtn}>
          <X className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-20"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        {...swipe}
      >
        <img
          key={index}
          src={photos[index]}
          alt={count > 1 ? `${title}, photo ${index + 1} of ${count}` : title}
          decoding="async"
          className="max-h-full max-w-full select-none rounded-lg object-contain transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none"
        />
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={onPrev}
              aria-label="Previous photo"
              className={cn(bigBtn, "absolute left-3 top-1/2 -translate-y-1/2 sm:left-5")}
            >
              <ChevronLeft className="h-7 w-7" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label="Next photo"
              className={cn(bigBtn, "absolute right-3 top-1/2 -translate-y-1/2 sm:right-5")}
            >
              <ChevronRight className="h-7 w-7" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="flex justify-center gap-2 overflow-x-auto px-4 py-4">
          {photos.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onIndex(i)}
              aria-label={`Show photo ${i + 1} of ${count}`}
              aria-current={i === index ? "true" : undefined}
              className={cn(
                "h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-2 transition focus-visible:outline-none focus-visible:ring-white",
                i === index ? "ring-white" : "ring-transparent opacity-50 hover:opacity-100"
              )}
            >
              <img src={src} alt="" decoding="async" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
