import type { Metadata } from "next";
import type { ReactNode } from "react";

// The page itself is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Report a Lost or Found Item | LOSTFOUND",
  description: "Post a listing for something you lost or found, with photos and location details.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
