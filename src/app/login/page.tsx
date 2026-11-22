"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { safeNextPath } from "@/lib/utils";
import { Alert } from "@/components/ui/Alert";
import { AuthFormSkeleton, AuthShell, OrDivider } from "@/components/ui/AuthShell";
import { Field } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Spinner } from "@/components/ui/Spinner";
import { ui } from "@/components/ui/styles";

// Error codes the Google OAuth callback can send back in ?error=. Raw values
// are never shown, so a crafted link can't put arbitrary text on this page.
const LOGIN_ERRORS: Record<string, string> = {
  GoogleAuthCancelled: "Google sign-in was cancelled.",
  GoogleAuthFailed: "We couldn't sign you in with Google. Please try again.",
  GoogleAuthNotConfigured:
    "Google sign-in isn't available right now. Please use your email and password.",
  GoogleEmailNotVerified:
    "Your Google account's email address isn't verified. Verify it with Google, or sign in with your email and password.",
  NoCodeProvided: "Google sign-in didn't complete. Please try again.",
  ServerConfigurationError: "Sign-in is temporarily unavailable. Please try again later.",
};

function LoginContent() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const nextPath = safeNextPath(searchParams.get("next"));
  const registerHref = searchParams.get("next") ? `/register?next=${encodeURIComponent(nextPath)}` : "/register";

  const urlErrorCode = searchParams.get("error");
  const [urlErrorDismissed, setUrlErrorDismissed] = useState(false);
  const urlError =
    urlErrorCode && !urlErrorDismissed
      ? LOGIN_ERRORS[urlErrorCode] ?? "Something went wrong signing you in. Please try again."
      : "";
  const shownError = error || urlError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setUrlErrorDismissed(true);
    setLoading(true);

    try {
      await login(email, password);
      // Only same-site relative paths are honoured (no "//evil.com").
      router.push(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage your listings, matches and messages."
      footer={
        <>
          New to LostFound?{" "}
          <Link href={registerHref} className="font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300">
            Create an account
          </Link>
        </>
      }
    >
      {shownError && (
        <Alert
          tone="error"
          className="mb-6"
          onDismiss={() => {
            setError("");
            setUrlErrorDismissed(true);
          }}
        >
          {shownError}
        </Alert>
      )}

      <GoogleLoginButton action="login" next={nextPath} />

      <OrDivider label="or sign in with email" />

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field id="login-email" label="Email">
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={ui.input}
            placeholder="you@example.com"
            required
          />
        </Field>

        <Field
          id="login-password"
          label="Password"
          labelAside={
            <Link
              href="/forgot-password"
              className="mb-1.5 rounded text-sm font-medium text-emerald-700 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              Forgot password?
            </Link>
          }
        >
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            required
          />
        </Field>

        <button type="submit" disabled={loading} className={`${ui.btnPrimary} w-full`}>
          {loading ? (
            <>
              <Spinner />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Welcome back" subtitle="Sign in to manage your listings, matches and messages.">
          <AuthFormSkeleton />
        </AuthShell>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
