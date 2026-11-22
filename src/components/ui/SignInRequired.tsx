import Link from "next/link";
import { Lock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ui } from "./styles";

/** Logged-out state for private pages, with a sign-in link that returns here. */
export function SignInRequired({
  title,
  description,
  next,
  icon: Icon = Lock,
}: {
  title: string;
  description: string;
  /** Path to come back to after signing in. */
  next: string;
  icon?: LucideIcon;
}) {
  const query = `?next=${encodeURIComponent(next)}`;
  return (
    <div className="flex min-h-[calc(100dvh-64px)] items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className={cn(ui.card, "w-full max-w-md p-8 text-center sm:p-10")}>
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href={`/login${query}`} className={ui.btnPrimary}>
            Sign in
          </Link>
          <Link href={`/register${query}`} className={ui.btnSecondary}>
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
