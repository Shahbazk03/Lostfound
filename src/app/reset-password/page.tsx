"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert } from "@/components/ui/Alert";
import { AuthFormSkeleton, AuthShell } from "@/components/ui/AuthShell";
import { Field } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { Spinner } from "@/components/ui/Spinner";
import { ui } from "@/components/ui/styles";

const backToLogin = (
  <Link
    href="/login"
    className="inline-flex items-center gap-1.5 rounded font-medium text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-400 dark:hover:text-white"
  >
    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
    Back to sign in
  </Link>
);

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthShell
        title="Password updated"
        subtitle="You can now sign in with your new password. Taking you to sign in…"
      >
        <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </span>
        <Link href="/login" className={cn(ui.btnPrimary, "w-full")}>
          Go to sign in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Enter the 6-digit code from your email, then pick a new password."
      footer={
        <>
          Didn&apos;t get a code?{" "}
          <Link href="/forgot-password" className="font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300">
            Send another
          </Link>
          <div className="mt-4">{backToLogin}</div>
        </>
      }
    >
      {error && (
        <Alert tone="error" className="mb-6" onDismiss={() => setError("")}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field id="reset-email" label="Email">
          <input
            type="email"
            id="reset-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className={cn(ui.input, initialEmail && "bg-slate-50 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300")}
            placeholder="you@example.com"
            required
            readOnly={!!initialEmail}
          />
        </Field>

        <Field id="reset-code" label="Reset code">
          <input
            type="text"
            id="reset-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\s/g, ""))}
            className={cn(ui.input, "h-14 text-center font-mono text-2xl tracking-[0.5em]")}
            placeholder="••••••"
            maxLength={6}
            autoFocus={!!initialEmail}
            required
          />
        </Field>

        <div>
          <Field id="reset-password" label="New password">
            <PasswordInput
              id="reset-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              aria-describedby="reset-password-strength"
              required
              minLength={8}
            />
          </Field>
          <PasswordStrength password={password} id="reset-password-strength" />
        </div>

        <button type="submit" disabled={loading} className={cn(ui.btnPrimary, "w-full")}>
          {loading ? (
            <>
              <Spinner />
              Updating password…
            </>
          ) : (
            "Reset password"
          )}
        </button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Choose a new password" subtitle="Enter the 6-digit code from your email, then pick a new password.">
          <AuthFormSkeleton />
        </AuthShell>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
