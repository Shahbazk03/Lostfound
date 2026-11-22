"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, MailCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert } from "@/components/ui/Alert";
import { AuthShell } from "@/components/ui/AuthShell";
import { Field } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { ui } from "@/components/ui/styles";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to send reset link");
      }

      setSuccess(true);
      // Move on to the code entry step after a short pause.
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = (
    <Link
      href="/login"
      className="inline-flex items-center gap-1.5 rounded font-medium text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-400 dark:hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back to sign in
    </Link>
  );

  if (success) {
    return (
      <AuthShell
        title="Check your inbox"
        subtitle={
          <>
            If an account exists for <strong className="font-semibold text-slate-900 dark:text-white">{email}</strong>,
            we&apos;ve sent a 6-digit code. Taking you to the next step…
          </>
        }
        footer={backToLogin}
      >
        <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20">
          <MailCheck className="h-6 w-6" aria-hidden="true" />
        </span>
        <Link href={`/reset-password?email=${encodeURIComponent(email)}`} className={cn(ui.btnPrimary, "w-full")}>
          Enter code
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter the email you signed up with and we'll send you a 6-digit code to reset it."
      footer={backToLogin}
    >
      {error && (
        <Alert tone="error" className="mb-6" onDismiss={() => setError("")}>
          {error}
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field id="forgot-email" label="Email">
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={ui.input}
            placeholder="you@example.com"
            autoFocus
            required
          />
        </Field>

        <button type="submit" disabled={loading} className={cn(ui.btnPrimary, "w-full")}>
          {loading ? (
            <>
              <Spinner />
              Sending code…
            </>
          ) : (
            "Send reset code"
          )}
        </button>
      </form>
    </AuthShell>
  );
}
