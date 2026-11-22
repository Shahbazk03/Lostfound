"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, MailCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { cn, safeNextPath } from "@/lib/utils";
import { Alert } from "@/components/ui/Alert";
import { AuthFormSkeleton, AuthShell, OrDivider } from "@/components/ui/AuthShell";
import { Field } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { Spinner } from "@/components/ui/Spinner";
import { ui } from "@/components/ui/styles";

const linkCls =
  "font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300";

function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
      <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 bg-white transition checked:border-emerald-600 checked:bg-emerald-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-900 dark:checked:border-emerald-500 dark:checked:bg-emerald-500"
          required
        />
        <Check
          className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 transition peer-checked:opacity-100"
          aria-hidden="true"
          strokeWidth={3}
        />
      </span>
      <span className="leading-6">{children}</span>
    </label>
  );
}

function RegisterContent() {
  const { register, verifyOTP } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const loginHref = searchParams.get("next") ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Verification state
  const [requireVerification, setRequireVerification] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!agreeTerms || !agreePrivacy) {
      setError("You must agree to the Terms of Service and Privacy Policy");
      return;
    }

    setLoading(true);

    try {
      const res = await register(email, password, name, phone || undefined);
      if (res.requireVerification) {
        setRequireVerification(true);
      } else {
        router.push(nextPath);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setVerifyLoading(true);

    try {
      await verifyOTP(email, otp);
      router.push(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setResendMessage("");
    setResendLoading(true);
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setResendMessage(data.message || "If your account still needs verification, a new code has been sent.");
      } else {
        // Includes 429 when too many codes were requested.
        setError(data.error || "Could not send a new code. Please try again later.");
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setResendLoading(false);
    }
  };

  if (requireVerification) {
    return (
      <AuthShell
        title="Check your email"
        subtitle={
          <>
            We sent a 6-digit code to <strong className="font-semibold text-slate-900 dark:text-white">{email}</strong>.
            Enter it below to verify your account.
          </>
        }
        footer={
          <button
            type="button"
            onClick={() => {
              setRequireVerification(false);
              setOtp("");
              setError("");
              setResendMessage("");
            }}
            className="inline-flex items-center gap-1.5 rounded font-medium text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Use a different email
          </button>
        }
      >
        <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20">
          <MailCheck className="h-6 w-6" aria-hidden="true" />
        </span>
        {error && (
          <Alert tone="error" className="mb-5" onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}
        {resendMessage && (
          <Alert tone="success" className="mb-5">
            {resendMessage}
          </Alert>
        )}

        <form onSubmit={handleVerify} className="space-y-5">
          <Field id="register-otp" label="Verification code">
            <input
              type="text"
              id="register-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className={cn(ui.input, "h-14 text-center font-mono text-2xl tracking-[0.5em]")}
              placeholder="••••••"
              maxLength={6}
              autoFocus
              required
            />
          </Field>

          <button type="submit" disabled={verifyLoading || otp.length !== 6} className={cn(ui.btnPrimary, "w-full")}>
            {verifyLoading ? (
              <>
                <Spinner />
                Verifying…
              </>
            ) : (
              "Verify and continue"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Didn&apos;t get a code? Check your spam folder, or{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading}
            className={cn(linkCls, "rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50")}
          >
            {resendLoading ? "sending…" : "send a new one"}
          </button>
          .
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free to join. Report items, get matched and chat privately."
      footer={
        <>
          Already have an account?{" "}
          <Link href={loginHref} className={linkCls}>
            Sign in
          </Link>
        </>
      }
    >
      {error && (
        <Alert tone="error" className="mb-6" onDismiss={() => setError("")}>
          {error}
        </Alert>
      )}

      <GoogleLoginButton action="register" next={nextPath} />

      <OrDivider label="or sign up with email" />

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field id="register-name" label="Full name">
          <input
            type="text"
            id="register-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className={ui.input}
            placeholder="Your name"
            required
          />
        </Field>

        <Field id="register-email" label="Email">
          <input
            type="email"
            id="register-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
            className={ui.input}
            placeholder="you@example.com"
            required
          />
        </Field>

        <Field id="register-phone" label="Phone number" optional hint="Never shown publicly.">
          <input
            type="tel"
            id="register-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            aria-describedby="register-phone-hint"
            className={ui.input}
            placeholder="+1 (555) 000-0000"
          />
        </Field>

        <div>
          <Field id="register-password" label="Password">
            <PasswordInput
              id="register-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              visible={showPassword}
              onToggleVisible={() => setShowPassword((v) => !v)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              aria-describedby="register-password-strength"
              minLength={8}
              required
            />
          </Field>
          <PasswordStrength password={password} id="register-password-strength" />
        </div>

        <Field id="register-confirm-password" label="Confirm password" error={mismatch ? "Passwords don't match yet." : undefined}>
          <PasswordInput
            id="register-confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            visible={showPassword}
            onToggleVisible={() => setShowPassword((v) => !v)}
            placeholder="Type it again"
            autoComplete="new-password"
            invalid={mismatch}
            aria-describedby={mismatch ? "register-confirm-password-error" : undefined}
            minLength={8}
            required
          />
        </Field>

        <div className="space-y-3 pt-1">
          <Checkbox checked={agreeTerms} onChange={setAgreeTerms}>
            I agree to the{" "}
            <Link href="/terms" className={linkCls}>
              Terms &amp; Conditions
            </Link>
          </Checkbox>
          <Checkbox checked={agreePrivacy} onChange={setAgreePrivacy}>
            I agree to the{" "}
            <Link href="/privacy" className={linkCls}>
              Privacy Policy
            </Link>
          </Checkbox>
        </div>

        <button
          type="submit"
          disabled={loading || !agreeTerms || !agreePrivacy}
          className={cn(ui.btnPrimary, "w-full")}
        >
          {loading ? (
            <>
              <Spinner />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Create your account" subtitle="Free to join. Report items, get matched and chat privately.">
          <AuthFormSkeleton />
        </AuthShell>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
