"use server";

import { db } from "@/db";
import { cmsPricingPlans } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getPricingPlans() {
  return await db.select().from(cmsPricingPlans).orderBy(asc(cmsPricingPlans.orderIndex));
}

export async function savePricingPlans(plans: any[]) {
  await db.delete(cmsPricingPlans);
  
  if (plans.length > 0) {
    await db.insert(cmsPricingPlans).values(
      plans.map((p, idx) => ({
        name: p.name,
        price: p.price,
        period: p.period || "",
        description: p.description || "",
        features: p.features || [],
        buttonText: p.buttonText || "Get Started",
        buttonLink: p.buttonLink || "/register",
        isPopular: p.isPopular ?? false,
        orderIndex: idx,
        isActive: p.isActive ?? true,
      }))
    );
  }
  
  revalidatePath("/");
  revalidatePath("/admin/cms/pricing");
}
