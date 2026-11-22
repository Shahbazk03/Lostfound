import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Cookie Policy | LOSTFOUND",
  description:
    "The cookies and browser storage LOSTFOUND uses, what they are for, and how to control them.",
  alternates: { canonical: "/cookies" },
};

const rows = [
  {
    name: "token",
    type: "Cookie (essential)",
    purpose: "Keeps you signed in. It is HTTP-only, so page scripts cannot read it.",
    duration: "Up to 7 days, or until you log out",
  },
  {
    name: "theme",
    type: "Local storage (preference)",
    purpose: "Remembers whether you chose light or dark mode.",
    duration: "Until you clear site data",
  },
  {
    name: "visitorId",
    type: "Session storage (analytics)",
    purpose: "A random identifier used to count visits and page views. It is not linked to your name or email.",
    duration: "Until you close the tab",
  },
];

const sections: LegalSection[] = [
  {
    id: "what",
    title: "What cookies are",
    body: (
      <p>
        Cookies are small text files a website stores in your browser. Similar
        technologies, such as local storage and session storage, keep small
        amounts of data on your device in the same way. In this policy we call
        all of these &quot;cookies&quot;.
      </p>
    ),
  },
  {
    id: "list",
    title: "What we use",
    body: (
      <>
        <p>We keep this list short. We do not use advertising or cross-site tracking cookies.</p>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm text-left border-separate border-spacing-x-2">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400">
                <th scope="col" className="py-2 font-semibold">Name</th>
                <th scope="col" className="py-2 font-semibold">Type</th>
                <th scope="col" className="py-2 font-semibold">Purpose</th>
                <th scope="col" className="py-2 font-semibold">Duration</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name} className="align-top">
                  <td className="py-2 font-mono text-xs text-slate-900 dark:text-white">{row.name}</td>
                  <td className="py-2">{row.type}</td>
                  <td className="py-2">{row.purpose}</td>
                  <td className="py-2">{row.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          When you pay for a feature, you are taken to our payment
          processor&apos;s checkout page, which may set its own cookies under
          its own policy.
        </p>
      </>
    ),
  },
  {
    id: "control",
    title: "How to control cookies",
    body: (
      <>
        <p>
          You can view and delete cookies and site data in your browser
          settings, and most browsers let you block cookies altogether.
        </p>
        <p>
          The sign-in cookie is essential: if you block it, you will not be
          able to stay signed in. Preference and analytics storage is optional;
          clearing it simply resets your theme and starts a
          new anonymous visit count.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        If we start using new cookies we will update this page and the date at
        the top. See our <Link href="/privacy">Privacy Policy</Link> for more
        on how we handle personal information.
      </p>
    ),
  },
];

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      lastUpdated="November 22, 2026"
      currentPath="/cookies"
      intro={
        <p>
          This page explains the cookies and browser storage LOSTFOUND uses and
          how you can control them.
        </p>
      }
      sections={sections}
    />
  );
}
