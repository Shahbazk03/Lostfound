"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  animation?: "fade-up" | "slide-in" | "scale-up" | "fade-in";
  delay?: number; // seconds
  duration?: number; // seconds
  className?: string;
  once?: boolean;
}

/**
 * Reveal-on-scroll without framer-motion.
 *
 * The hidden starting state is applied by CSS only when scripting is enabled
 * and the user hasn't asked for reduced motion (see `[data-reveal]` in
 * globals.css), so content is never invisible for crawlers, no-JS visitors or
 * people who prefer less motion. An IntersectionObserver flips
 * `data-revealed` when the element scrolls into view.
 */
export default function ScrollReveal({
  children,
  animation = "fade-up",
  delay = 0,
  duration = 0.5,
  className = "",
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      el.dataset.revealed = "true";
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.dataset.revealed = "true";
            if (once) observer.disconnect();
          } else if (!once) {
            delete el.dataset.revealed;
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  return (
    <div
      ref={ref}
      data-reveal={animation}
      className={className}
      style={{
        transitionDuration: `${duration}s`,
        transitionDelay: `${Math.min(delay, 0.6)}s`,
      }}
    >
      {children}
    </div>
  );
}
