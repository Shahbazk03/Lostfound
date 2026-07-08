"use server";

import { db } from "@/db";
import { cmsStatistics } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getStatistics() {
  return await db.select().from(cmsStatistics).orderBy(asc(cmsStatistics.orderIndex));
}

export async function saveStatistics(stats: any[]) {
  // Clear all and insert new (simple sync approach)
  // For safety, let's delete all and reinsert since the ID isn't linked to other tables
  await db.delete(cmsStatistics);
  
  if (stats.length > 0) {
    await db.insert(cmsStatistics).values(
      stats.map((s, idx) => ({
        label: s.label,
        numberValue: s.numberValue,
        icon: s.icon || "",
        color: s.color || "",
        orderIndex: idx,
        isActive: s.isActive ?? true,
      }))
    );
  }
  
  revalidatePath("/");
  revalidatePath("/admin/cms/statistics");
}
