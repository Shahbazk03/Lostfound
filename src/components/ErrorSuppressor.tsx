"use client";

import { useEffect } from "react";

if (typeof window !== "undefined") {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    // Suppress React 19 + next-themes script tag warning
    if (typeof args[0] === "string" && args[0].includes("Encountered a script tag while rendering React component")) {
      return;
    }
    // Suppress Next.js default props warning from third party libs
    if (typeof args[0] === "string" && args[0].includes("defaultProps will be removed")) {
      return;
    }
    originalError.apply(console, args);
  };
}

export function ErrorSuppressor() {
  useEffect(() => {
    // Component simply exists to run the client-side code above.
  }, []);
  return null;
}
