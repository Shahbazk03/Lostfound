import type { Metadata } from "next";
import type { ReactNode } from "react";

// The page itself is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Sign In | LOSTFOUND",
  description: "Sign in to your LOSTFOUND account to manage listings and messages.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
