"use client";

import { useId, useState } from "react";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

const input =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white";
const label = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";

export function ContactForm({ content }: { content: any }) {
  const id = useId();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const message = formData.get("message") as string;

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, message }),
      });

      if (res.ok) {
        setIsSuccess(true);
      } else {
        setError("We couldn't send your message. Please try again in a moment.");
      }
    } catch (err) {
      console.error("Contact form error:", err);
      setError("We couldn't send your message. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center" role="status">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          <CheckCircle className="h-7 w-7" />
        </div>
        <h2 className="mb-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Message sent</h2>
        <p className="mb-8 text-slate-500 dark:text-slate-400">Thanks for reaching out. We&apos;ll get back to you shortly.</p>
        <button
          type="button"
          onClick={() => setIsSuccess(false)}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-xl px-4 py-16">
      <div className="text-center">
        <h2 className="mb-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{content.title || "Get in touch"}</h2>
        <p className="mb-8 text-slate-500 dark:text-slate-400">
          {content.subtitle || "Fill out the form below and we'll get back to you shortly."}
        </p>
      </div>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div>
          <label htmlFor={`${id}-name`} className={label}>
            Name
          </label>
          <input id={`${id}-name`} required name="name" type="text" autoComplete="name" className={input} placeholder="Jane Doe" />
        </div>
        <div>
          <label htmlFor={`${id}-email`} className={label}>
            Email
          </label>
          <input id={`${id}-email`} required name="email" type="email" autoComplete="email" className={input} placeholder="jane@example.com" />
        </div>
        <div>
          <label htmlFor={`${id}-message`} className={label}>
            Message
          </label>
          <textarea
            id={`${id}-message`}
            required
            name="message"
            rows={5}
            className={`${input} h-auto py-2.5`}
            placeholder="How can we help?"
          />
        </div>
        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 dark:focus-visible:ring-offset-slate-900"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Sending…" : content.buttonText || "Send message"}
        </button>
      </form>
    </section>
  );
}
