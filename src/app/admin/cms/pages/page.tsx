import { Suspense } from "react";
import { PageSkeleton } from "@/components/admin/ui/Skeleton";
import CMSPagesClient from "./CMSPagesClient";

export const metadata = { title: "Pages" };

// The client reads ?new=1 (from the command palette) with useSearchParams,
// which needs a Suspense boundary.
export default function CMSPagesList() {
  return (
    <Suspense fallback={<PageSkeleton cards={0} />}>
      <CMSPagesClient />
    </Suspense>
  );
}
