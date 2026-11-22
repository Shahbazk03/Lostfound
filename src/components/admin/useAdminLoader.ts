"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "./admin-api";

/**
 * Runs `load` on mount and tracks loading / error state for an admin page.
 * `load` fetches and stores its own data; any thrown error becomes `error`.
 *
 *   const { loading, error, reload, refresh } = useAdminLoader(loadUsers, "Failed to load users");
 *
 * - reload():  show the loading state again and re-run (use for "Try again").
 * - refresh(): re-run quietly, keeping current data on screen (use after a mutation).
 *
 * State is only set from the promise callbacks, never synchronously in the
 * effect body, and results from a superseded run are ignored.
 */
export function useAdminLoader(load: () => Promise<unknown>, fallbackError = "Failed to load data") {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    loadRef.current().then(
      () => {
        if (cancelled) return;
        setError("");
        setLoading(false);
      },
      (err) => {
        if (cancelled) return;
        setError(errorMessage(err, fallbackError));
        setLoading(false);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [version, fallbackError]);

  const reload = useCallback(() => {
    setLoading(true);
    setVersion((v) => v + 1);
  }, []);

  const refresh = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  return { loading, error, reload, refresh };
}
