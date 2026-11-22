import { Suspense } from "react";
import { PageSkeleton } from "@/components/admin/ui/Skeleton";
import UsersClient from "./UsersClient";

export const metadata = { title: "Users" };

export default function UsersPage() {
  // UsersClient reads ?new=1 (from the command palette) with useSearchParams.
  return (
    <Suspense fallback={<PageSkeleton cards={0} />}>
      <UsersClient />
    </Suspense>
  );
}
