import type { Metadata } from "next";
import type { ReactNode } from "react";
import DynamicFooter from "@/components/DynamicFooter";

// The page itself is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Browse Lost & Found Items | LOSTFOUND",
  description: "Search lost and found listings by keyword, category, location and date.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <DynamicFooter />
    </>
  );
}
