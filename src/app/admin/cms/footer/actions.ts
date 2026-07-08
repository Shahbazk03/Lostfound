"use server";

import { db } from "@/db";
import { cmsFooter } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getFooter() {
  const result = await db.select().from(cmsFooter).limit(1);
  return result[0] || null;
}

export async function saveFooter(data: any) {
  const existing = await getFooter();
  
  if (existing) {
    await db.update(cmsFooter).set({
      logo: data.logo,
      description: data.description,
      copyrightText: data.copyrightText,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      socialLinks: data.socialLinks,
      footerLinks: data.footerLinks,
      newsletterEnabled: data.newsletterEnabled,
    }).where(eq(cmsFooter.id, existing.id));
  } else {
    await db.insert(cmsFooter).values({
      logo: data.logo,
      description: data.description,
      copyrightText: data.copyrightText,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      socialLinks: data.socialLinks,
      footerLinks: data.footerLinks,
      newsletterEnabled: data.newsletterEnabled,
    });
  }
  
  revalidatePath("/");
  revalidatePath("/admin/cms/footer");
}
