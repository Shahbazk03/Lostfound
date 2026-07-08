import { db } from "@/db";
import { items, users, organizationSettings, cmsHero, cmsStatistics, cmsCategories, cmsFeatures, cmsTestimonials, cmsPricingPlans, cmsGlobalNetwork, cmsFooter } from "@/db/schema";
import { eq, sql, count, asc, desc } from "drizzle-orm";
import HomepageVisuals from "@/components/home/HomepageVisuals";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [recoveredItemsData] = await db.select({ count: count() }).from(items).where(eq(items.status, "resolved"));
  const recoveredItemsCount = recoveredItemsData.count;

  const [usersData] = await db.select({ count: count() }).from(users);
  const usersCount = usersData.count;
  
  const [countriesData] = await db.select({
    count: sql<number>`count(distinct ${items.country})`
  }).from(items).where(sql`${items.country} IS NOT NULL`);
  const countriesCount = Number(countriesData.count);

  const [totalItemsData] = await db.select({ count: count() }).from(items);
  const totalItemsCount = totalItemsData.count;

  const successRate = totalItemsCount > 0 ? Math.round((recoveredItemsCount / totalItemsCount) * 100) : 0;

  const [heroData] = await db.select().from(cmsHero).limit(1);
  const statisticsList = await db.select().from(cmsStatistics).orderBy(asc(cmsStatistics.orderIndex));
  const categoriesList = await db.select().from(cmsCategories).orderBy(asc(cmsCategories.orderIndex));
  const featuresList = await db.select().from(cmsFeatures).orderBy(asc(cmsFeatures.orderIndex));
  const testimonialsList = await db.select().from(cmsTestimonials).orderBy(desc(cmsTestimonials.createdAt));
  const pricingPlansList = await db.select().from(cmsPricingPlans).orderBy(asc(cmsPricingPlans.orderIndex));
  const [globalNetwork] = await db.select().from(cmsGlobalNetwork).limit(1);
  const [footer] = await db.select().from(cmsFooter).limit(1);
  
  // Defaults in case CMS data is empty
  const hero = heroData || {
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
  };

  const homepageData = {
    hero,
    statisticsList,
    categoriesList,
    featuresList,
    testimonialsList,
    pricingPlansList,
    recoveredItemsCount,
    usersCount,
    successRate,
    countriesCount,
    globalNetwork: globalNetwork || null,
    footer: footer || null
  };

  return <HomepageVisuals data={homepageData} />;
}
