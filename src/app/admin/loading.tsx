import { PageSkeleton } from "@/components/admin/ui/Skeleton";

// Shown while a server-rendered admin page (dashboard, analytics) loads.
export default function AdminLoading() {
  return <PageSkeleton cards={4} rows={5} />;
}
