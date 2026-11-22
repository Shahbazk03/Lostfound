"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/admin/AdminStates";
import { PageContainer } from "@/components/admin/ui/PageHeader";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const message =
    error.message === "Forbidden" || error.message === "Unauthorized"
      ? "Your session has expired or you don't have admin access. Sign in again to continue."
      : "This page couldn't be loaded. Check your connection and try again.";

  return (
    <PageContainer>
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <ErrorState message={message} onRetry={reset} />
      </div>
    </PageContainer>
  );
}
