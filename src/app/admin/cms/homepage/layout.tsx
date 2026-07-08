import { ReactNode } from "react";
import { db } from "@/db";
import { items, users, cmsHero, cmsStatistics, cmsCategories, cmsFeatures, cmsTestimonials, cmsPricingPlans, cmsGlobalNetwork, cmsFooter } from "@/db/schema";
import { count, asc, desc } from "drizzle-orm";
import CMSLayoutClient from "./CMSLayoutClient";
import { CMSProvider } from "./CMSProvider";

export const dynamic = "force-dynamic";

export default async function CMSLayout({ children }: { children: ReactNode }) {
  const [heroData] = await db.select().from(cmsHero).limit(1);
  const statisticsList = await db.select().from(cmsStatistics).orderBy(asc(cmsStatistics.orderIndex));
  const categoriesList = await db.select().from(cmsCategories).orderBy(asc(cmsCategories.orderIndex));
  const featuresList = await db.select().from(cmsFeatures).orderBy(asc(cmsFeatures.orderIndex));
  const testimonialsList = await db.select().from(cmsTestimonials).orderBy(desc(cmsTestimonials.createdAt));
  const pricingPlansList = await db.select().from(cmsPricingPlans).orderBy(asc(cmsPricingPlans.orderIndex));
  const [globalNetwork] = await db.select().from(cmsGlobalNetwork).limit(1);
  const [footer] = await db.select().from(cmsFooter).limit(1);
  
  const [totalItemsData] = await db.select({ count: count() }).from(items);
  const [usersData] = await db.select({ count: count() }).from(users);

  const initialData = {
    hero: heroData || {
      headline: "Find What Matters.\nReconnect With Confidence.",
      highlightedWords: "Reconnect",
      subheading: "LostFound helps people recover lost belongings through AI-powered matching, real-time notifications, and a trusted community network.",
      primaryButtonText: "Browse Lost Items",
      primaryButtonLink: "/browse",
      secondaryButtonText: "Report Lost Item",
      secondaryButtonLink: "/report",
      backgroundImage: "",
      illustrationImage: "/hero-3d-illustration.png",
      illustrationAnimation: "float",
      trustBadges: ["Trusted Community", "AI Powered Matching", "Secure Platform", "Global Reach"],
    },
    statisticsList,
    categoriesList,
    featuresList,
    testimonialsList,
    pricingPlansList,
    recoveredItemsCount: 15420,
    usersCount: usersData.count,
    successRate: 85,
    countriesCount: 142,
    globalNetwork: globalNetwork || null,
    footer: footer || null
  };

  return (
    <CMSProvider initialData={initialData}>
      <CMSLayoutClient>
        {children}
      </CMSLayoutClient>
    </CMSProvider>
  );
}
