import { ItemsManager } from "@/components/admin/ItemsManager";

export default function FoundReportsPage() {
  return (
    <ItemsManager
      type="found"
      title="Found Reports"
      description="Manage all items reported as found by users."
    />
  );
}
