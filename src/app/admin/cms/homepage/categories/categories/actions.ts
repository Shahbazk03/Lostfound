"use server";

import { db } from "@/db";
import { cmsCategories } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getCategories() {
  return await db.select().from(cmsCategories).orderBy(asc(cmsCategories.orderIndex));
}

export async function saveCategories(categories: any[]) {
  await db.delete(cmsCategories);
  
  if (categories.length > 0) {
    await db.insert(cmsCategories).values(
      categories.map((c, idx) => ({
        name: c.name,
        description: c.description || "",
        icon: c.icon || "",
        image: c.image || "",
        orderIndex: idx,
        isActive: c.isActive ?? true,
      }))
    );
  }
  
  revalidatePath("/");
  revalidatePath("/admin/cms/categories");
}
