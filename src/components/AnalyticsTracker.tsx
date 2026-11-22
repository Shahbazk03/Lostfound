"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const HEARTBEAT_MS = 60_000;

function getVisitorId(): string | null {
  try {
    let id = sessionStorage.getItem("visitorId");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("visitorId", id);
    }
    return id;
  } catch {
    return null; // storage blocked (private mode etc.)
  }
}

/**
 * Lightweight visit tracking for the admin analytics page.
 * - Skips admin pages (admins browsing their own panel isn't traffic).
 * - Sends nothing while the tab is hidden.
 * - Uses sendBeacon/keepalive so it never competes with page requests.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const visitorId = getVisitorId();
    if (!visitorId) return;

    const send = () => {
      if (document.visibilityState !== "visible") return;
      const body = JSON.stringify({ visitorId, path: pathname });
      try {
        if (navigator.sendBeacon?.("/api/analytics/heartbeat", new Blob([body], { type: "application/json" }))) {
          return;
        }
      } catch {
        // fall through to fetch
      }
      fetch("/api/analytics/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    };

    // Let the page finish loading before the first beat.
    const first = window.setTimeout(send, 2000);
    const interval = window.setInterval(send, HEARTBEAT_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
    };
  }, [pathname]);

  return null;
}
