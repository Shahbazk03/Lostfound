import { ItemsManager } from "@/components/admin/ItemsManager";

export default function LostReportsPage() {
  return (
    <ItemsManager
      type="lost"
      title="Lost Reports"
      description="Manage all items reported as lost by users."
    />
  );
}
