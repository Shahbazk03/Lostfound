"use server";

import { db } from "@/db";
import { cmsFeatures } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getFeatures() {
  return await db.select().from(cmsFeatures).orderBy(asc(cmsFeatures.orderIndex));
}

export async function saveFeatures(features: any[]) {
  await db.delete(cmsFeatures);
  
  if (features.length > 0) {
    await db.insert(cmsFeatures).values(
      features.map((f, idx) => ({
        title: f.title,
        description: f.description || "",
        icon: f.icon || "",
        orderIndex: idx,
        isActive: f.isActive ?? true,
      }))
    );
  }
  
  revalidatePath("/");
  revalidatePath("/admin/cms/features");
}
