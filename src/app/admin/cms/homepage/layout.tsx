import { ReactNode } from "react";
import { db } from "@/db";
import {
  items,
  users,
  cmsHero,
  cmsStatistics,
  cmsCategories,
  cmsFeatures,
  cmsPricingPlans,
  cmsGlobalNetwork,
  cmsHomepageFaq,
  cmsHomepageCta,
  cmsFooter,
} from "@/db/schema";
import { count, asc, desc, eq, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import CMSLayoutClient from "./CMSLayoutClient";
import { CMSProvider } from "@/app/admin/cms/homepage/CMSProvider";

export const dynamic = "force-dynamic";

export default async function CMSLayout({ children }: { children: ReactNode }) {
  // Middleware already gates /admin; this keeps the DB reads below admin-only
  // even if that ever changes.
  await requireAdmin();

  const [
    [heroData],
    statisticsList,
    categoriesList,
    featuresList,
    pricingPlansList,
    [globalNetwork],
    [faq],
    [cta],
    [footer],
    [recoveredItemsData],
    [totalItemsData],
    [usersData],
    [countriesData],
  ] = await Promise.all([
    db.select().from(cmsHero).limit(1),
    db.select().from(cmsStatistics).orderBy(asc(cmsStatistics.orderIndex)),
    db.select().from(cmsCategories).orderBy(asc(cmsCategories.orderIndex)),
    db.select().from(cmsFeatures).orderBy(asc(cmsFeatures.orderIndex)),
    db.select().from(cmsPricingPlans).orderBy(asc(cmsPricingPlans.orderIndex)),
    db.select().from(cmsGlobalNetwork).limit(1),
    // FAQ and CTA must be loaded, otherwise their editors open blank and a
    // save overwrites the live content.
    db.select().from(cmsHomepageFaq).limit(1),
    db.select().from(cmsHomepageCta).limit(1),
    db.select().from(cmsFooter).limit(1),
    // Preview stats, computed the same way as the public homepage (src/app/page.tsx).
    db.select({ count: count() }).from(items).where(eq(items.status, "resolved")),
    db.select({ count: count() }).from(items),
    db.select({ count: count() }).from(users),
    db
      .select({ count: sql<number>`count(distinct ${items.country})` })
      .from(items)
      .where(sql`${items.country} IS NOT NULL`),
  ]);

  const recoveredItemsCount = recoveredItemsData.count;
  const totalItemsCount = totalItemsData.count;

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
    pricingPlansList,
    recoveredItemsCount,
    usersCount: usersData.count,
    successRate: totalItemsCount > 0 ? Math.round((recoveredItemsCount / totalItemsCount) * 100) : 0,
    countriesCount: Number(countriesData.count),
    globalNetwork: globalNetwork || null,
    faq: faq || null,
    cta: cta || null,
    footer: footer || null,
  };

  return (
    <CMSProvider initialData={initialData}>
      <CMSLayoutClient>{children}</CMSLayoutClient>
    </CMSProvider>
  );
}
