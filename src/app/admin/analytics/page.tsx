import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getAnalyticsData } from "./actions";
import AnalyticsClient from "./AnalyticsClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Analytics",
  description: "Visitor sessions, top pages and session length.",
};

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range } = await searchParams;
  const days = Number(range);
  // getAnalyticsData() checks too; in parallel this costs no extra round trip.
  const [, data] = await Promise.all([requireAdmin(), getAnalyticsData(Number.isFinite(days) ? days : 30)]);
  return <AnalyticsClient data={data} />;
}
