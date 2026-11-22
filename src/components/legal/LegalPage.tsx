import Link from "next/link";
import type { ReactNode } from "react";
import DynamicFooter from "@/components/DynamicFooter";

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

const LEGAL_LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/cookies", label: "Cookies" },
];

/** Shared shell for the static Terms / Privacy / Cookies pages. */
export function LegalPage({
  title,
  intro,
  lastUpdated,
  currentPath,
  sections,
}: {
  title: string;
  intro: ReactNode;
  lastUpdated: string;
  currentPath: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <div className="bg-white dark:bg-slate-950">
        <header className="border-b border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
            <nav aria-label="Legal" className="inline-flex rounded-xl bg-slate-200/60 p-1 dark:bg-slate-800/80">
              {LEGAL_LINKS.map((link) => {
                const active = link.href === currentPath;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      active
                        ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <h1 className="mt-8 text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">{title}</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Last updated <time>{lastUpdated}</time>
            </p>
            <div className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">{intro}</div>
          </div>
        </header>

        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-14 lg:px-8">
          <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">On this page</h2>
            <ol className="mt-3 space-y-1 border-l border-slate-200 text-sm dark:border-slate-800">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="-ml-px block border-l border-transparent py-1 pl-4 text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-white"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="min-w-0 space-y-12">
            {sections.map((section, i) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  <span className="mr-2 text-slate-400 dark:text-slate-500">{i + 1}.</span>
                  {section.title}
                </h2>
                <div className="mt-4 space-y-4 text-[15px] leading-7 text-slate-700 dark:text-slate-300 [&_a]:font-medium [&_a]:text-emerald-700 [&_a]:underline [&_a]:underline-offset-4 dark:[&_a]:text-emerald-400 [&_strong]:font-semibold [&_strong]:text-slate-900 dark:[&_strong]:text-white [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_li]:marker:text-slate-400">
                  {section.body}
                </div>
              </section>
            ))}
          </article>
        </div>
      </div>
      <DynamicFooter />
    </>
  );
}
