import type { Metadata } from "next";
import type { ReactNode } from "react";

// The page itself is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Create an Account | LOSTFOUND",
  description: "Join LOSTFOUND to report lost and found items and connect with people who can help.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
