"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { ui } from "./styles";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  /** Controlled visibility (e.g. shared by password + confirm). */
  visible?: boolean;
  onToggleVisible?: () => void;
  invalid?: boolean;
};

/** Password field with a show/hide toggle. */
export function PasswordInput({ visible, onToggleVisible, invalid, className, ...props }: Props) {
  const [ownVisible, setOwnVisible] = useState(false);
  const shown = visible ?? ownVisible;
  const toggle = onToggleVisible ?? (() => setOwnVisible((v) => !v));

  return (
    <div className="relative">
      <input
        {...props}
        type={shown ? "text" : "password"}
        aria-invalid={invalid || undefined}
        className={cn(ui.input, "pr-12", invalid && ui.inputInvalid, className)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={shown ? "Hide password" : "Show password"}
        aria-pressed={shown}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-slate-400 transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 dark:text-slate-500 dark:hover:text-slate-200"
      >
        {shown ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  );
}
