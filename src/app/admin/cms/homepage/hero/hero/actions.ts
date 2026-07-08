"use server";

import { db } from "@/db";
import { cmsHero } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getHeroContent() {
  const [hero] = await db.select().from(cmsHero).limit(1);
  return hero || null;
}

export async function updateHeroContent(data: any) {
  try {
    const existing = await getHeroContent();
    
    if (existing) {
      await db.update(cmsHero).set({
        headline: data.headline,
        highlightedWords: data.highlightedWords,
        subheading: data.subheading,
        primaryButtonText: data.primaryButtonText,
        primaryButtonLink: data.primaryButtonLink,
        secondaryButtonText: data.secondaryButtonText,
        secondaryButtonLink: data.secondaryButtonLink,
        backgroundImage: data.backgroundImage,
        illustrationImage: data.illustrationImage,
        illustrationAnimation: data.illustrationAnimation,
        trustBadges: data.trustBadges,
        updatedAt: new Date(),
      }).where(eq(cmsHero.id, existing.id));
    } else {
      await db.insert(cmsHero).values({
        headline: data.headline,
        highlightedWords: data.highlightedWords,
        subheading: data.subheading,
        primaryButtonText: data.primaryButtonText,
        primaryButtonLink: data.primaryButtonLink,
        secondaryButtonText: data.secondaryButtonText,
        secondaryButtonLink: data.secondaryButtonLink,
        backgroundImage: data.backgroundImage,
        illustrationImage: data.illustrationImage,
        illustrationAnimation: data.illustrationAnimation,
        trustBadges: data.trustBadges,
      });
    }

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating hero content:", error);
    return { success: false, error: error.message };
  }
}
