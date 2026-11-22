"use client";

import { useCallback, useEffect, useState } from "react";
import type { ItemMatch } from "@/lib/matching";

interface MatchesResult {
  key: string;
  matches: ItemMatch[] | null;
  error: boolean;
}

/**
 * Loads GET /api/items/{id}/matches. `matches` is null while loading or after
 * an error; `retry()` fetches again.
 */
export function useItemMatches(itemId: number | null, limit?: number) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<MatchesResult | null>(null);
  const key = itemId ? `${itemId}:${limit ?? ""}:${attempt}` : null;

  useEffect(() => {
    if (!key || !itemId) return;
    const controller = new AbortController();
    const query = limit ? `?limit=${limit}` : "";
    fetch(`/api/items/${itemId}/matches${query}`, { signal: controller.signal, cache: "no-store" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Failed to load matches");
        setResult({ key, matches: Array.isArray(data.matches) ? data.matches : [], error: false });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key, matches: null, error: true });
      });
    return () => controller.abort();
  }, [key, itemId, limit]);

  const current = result?.key === key ? result : null;
  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  return {
    matches: current?.matches ?? null,
    loading: !!key && !current,
    error: current?.error ?? false,
    retry,
  };
}
