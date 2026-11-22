import type { Metadata } from "next";
import type { ReactNode } from "react";

// The page itself is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Profile | LOSTFOUND",
  description: "Manage your profile, wallet and settings.",
  // Private, per-user page: keep it out of search results.
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
