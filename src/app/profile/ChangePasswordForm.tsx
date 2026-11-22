"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert } from "@/components/ui/Alert";
import { Field } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { Spinner } from "@/components/ui/Spinner";
import { ui } from "@/components/ui/styles";

const MIN = 8;
const MAX = 128;

/** "Change password" block for the profile's Account section. */
export function ChangePasswordForm() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const errors = {
    current: current ? undefined : "Enter your current password",
    next:
      next.length < MIN
        ? `At least ${MIN} characters`
        : next.length > MAX
          ? `At most ${MAX} characters`
          : next === current
            ? "Choose a password different from the current one"
            : undefined,
    confirm: confirm === next ? undefined : "Passwords don't match",
  };
  const valid = !errors.current && !errors.next && !errors.confirm;

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
    setTouched(false);
    setError("");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError("");
    if (!valid) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not change your password. Please try again.");
        return;
      }
      reset();
      setOpen(false);
      setSuccess(true);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <div className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <KeyRound className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Password</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {success ? "Your password was changed." : "Change the password you use to sign in."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setSuccess(false);
            setOpen(true);
          }}
          className={cn(ui.btnSecondary, "self-start sm:self-auto")}
        >
          Change password
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4 px-5 py-5 sm:px-6">
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">Change password</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Signed up with Google and never set a password?{" "}
          <Link href="/forgot-password" className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
            Set one with a reset code
          </Link>
          .
        </p>
      </div>

      {error && <Alert onDismiss={() => setError("")}>{error}</Alert>}

      <Field id="current-password" label="Current password" required error={touched ? errors.current : undefined}>
        <PasswordInput
          id="current-password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          invalid={touched && !!errors.current}
          autoFocus
        />
      </Field>

      <Field
        id="new-password"
        label="New password"
        required
        hint={`At least ${MIN} characters.`}
        error={touched ? errors.next : undefined}
      >
        <PasswordInput
          id="new-password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          invalid={touched && !!errors.next}
        />
      </Field>
      {next && <PasswordStrength password={next} />}

      <Field id="confirm-password" label="Confirm new password" required error={touched ? errors.confirm : undefined}>
        <PasswordInput
          id="confirm-password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          invalid={touched && !!errors.confirm}
        />
      </Field>

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={saving} className={ui.btnPrimary}>
          {saving && <Spinner />}
          Update password
        </button>
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          disabled={saving}
          className={ui.btnSecondary}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
