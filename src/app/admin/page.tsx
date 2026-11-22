import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getDashboardOverview } from "./actions";
import DashboardView from "./DashboardView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard" };

/**
 * Server-rendered dashboard: all numbers arrive with the HTML; only the
 * charts (recharts) load afterwards on the client.
 */
export default async function AdminDashboardPage() {
  // getDashboardOverview() checks too; running both in parallel costs no extra round trip.
  const [, data] = await Promise.all([requireAdmin(), getDashboardOverview()]);
  return <DashboardView data={data} />;
}
