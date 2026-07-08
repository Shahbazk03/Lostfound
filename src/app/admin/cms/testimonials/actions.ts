"use server";

import { db } from "@/db";
import { cmsTestimonials } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getTestimonials() {
  return await db.select().from(cmsTestimonials).orderBy(asc(cmsTestimonials.orderIndex));
}

export async function saveTestimonials(testimonials: any[]) {
  await db.delete(cmsTestimonials);
  
  if (testimonials.length > 0) {
    await db.insert(cmsTestimonials).values(
      testimonials.map((t, idx) => ({
        customerName: t.customerName,
        customerRole: t.customerRole || "",
        customerPhoto: t.customerPhoto || "",
        reviewText: t.reviewText,
        rating: t.rating ?? 5,
        orderIndex: idx,
        isActive: t.isActive ?? true,
      }))
    );
  }
  
  revalidatePath("/");
  revalidatePath("/admin/cms/testimonials");
}
