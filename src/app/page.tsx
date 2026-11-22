import { db, withDbRetry } from "@/db";
import {
  items,
  users,
  organizationSettings,
  cmsHero,
  cmsStatistics,
  cmsCategories,
  cmsFeatures,
  cmsPricingPlans,
  cmsGlobalNetwork,
  cmsHomepageFaq,
  cmsHomepageCta,
  cmsFooter,
  cmsPages,
} from "@/db/schema";
import { eq, sql, count, asc, desc } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { PUBLIC_CONTENT_TAG } from "@/lib/cache";
import { firstPhoto, mediaRefColumns, resolveMediaRef } from "@/lib/media-sql";
import { DEFAULT_CHAT_UNLOCK_FEE_CENTS, DEFAULT_SUBSCRIPTION_FEE_CENTS, feeToCents, normalizeCurrency } from "@/lib/stripe";
import { toItemCategory } from "@/lib/utils";
import { prettyPlace } from "@/components/home/format";
import HomepageVisuals, {
  type CommunityStat,
  type CityCount,
  type HomepageData,
  type LatestItem,
} from "@/components/home/HomepageVisuals";

// Rendered per request, but the data comes from a cache that is refreshed at
// most once a minute and purged immediately when admins or users change
// content (see invalidatePublicContent). The database is ~250 ms away per
// round trip, so this is the single biggest speed-up for the homepage.
export const dynamic = "force-dynamic";

const TOP_CITIES = 6;
const LATEST_ITEMS = 6;

// Cities are free text, so "Lucknow", " lucknow" and "LUCKNOW" are one city.
const cityKey = sql<string>`lower(trim(${items.city}))`;
const hasCity = sql`nullif(trim(${items.city}), '') is not null`;

const numberFormat = new Intl.NumberFormat("en-IN");

/** Everything the homepage shows, read in one go. */
async function getHomepageData(): Promise<HomepageData> {
  // The queries are independent, so run them concurrently instead of one
  // round-trip after another.
  const [
    [itemTotals],
    [usersData],
    topCityRows,
    categoryRows,
    latestItemRows,
    [feeRow],
    [heroData],
    statisticsList,
    categoriesList,
    featuresList,
    pricingPlansList,
    [globalNetwork],
    [faq],
    [cta],
    [footer],
  ] = await Promise.all([
    // Item totals in one round trip.
    db
      .select({
        total: count(),
        resolved: sql<number>`count(*) filter (where ${items.status} = 'resolved')`.mapWith(Number),
        active: sql<number>`count(*) filter (where ${items.status} = 'active')`.mapWith(Number),
        cities: sql<number>`count(distinct ${cityKey}) filter (where ${hasCity})`.mapWith(Number),
      })
      .from(items),
    db.select({ count: count() }).from(users),
    db
      .select({ city: cityKey, count: count() })
      .from(items)
      .where(hasCity)
      .groupBy(cityKey)
      .orderBy(desc(count()), cityKey)
      .limit(TOP_CITIES),
    // Active listings per category, for the category tiles.
    db
      .select({ category: items.category, count: count() })
      .from(items)
      .where(eq(items.status, "active"))
      .groupBy(items.category),
    // Public fields only: never preciseLocation or anything about the owner.
    // Feeds both the live feed and the "Recently reported" cards.
    db
      .select({
        id: items.id,
        type: items.type,
        title: items.title,
        category: items.category,
        approximateLocation: items.approximateLocation,
        city: items.city,
        dateLostFound: items.dateLostFound,
        status: items.status,
        createdAt: items.createdAt,
        updatedAt: items.updatedAt,
        // A URL for the first photo, never the base64 image itself.
        photoRef: mediaRefColumns(firstPhoto(items.photos)),
      })
      .from(items)
      .where(eq(items.status, "active"))
      .orderBy(desc(items.createdAt), desc(items.id))
      .limit(LATEST_ITEMS),
    // Only the fee fields: settings.metadata can hold large images.
    db
      .select({
        currency: organizationSettings.currency,
        chatFee: sql<unknown>`${organizationSettings.metadata} -> 'oneTimeUnlockFee'`,
        subscriptionFee: sql<unknown>`${organizationSettings.metadata} -> 'premiumSubscriptionFee'`,
      })
      .from(organizationSettings)
      .limit(1),
    db.select().from(cmsHero).limit(1),
    db.select().from(cmsStatistics).orderBy(asc(cmsStatistics.orderIndex)),
    db.select().from(cmsCategories).orderBy(asc(cmsCategories.orderIndex)),
    db.select().from(cmsFeatures).orderBy(asc(cmsFeatures.orderIndex)),
    db.select().from(cmsPricingPlans).orderBy(asc(cmsPricingPlans.orderIndex)),
    db.select().from(cmsGlobalNetwork).limit(1),
    db.select().from(cmsHomepageFaq).limit(1),
    db.select().from(cmsHomepageCta).limit(1),
    db.select().from(cmsFooter).limit(1),
  ]);

  const totalItems = itemTotals?.total ?? 0;
  const resolvedItems = itemTotals?.resolved ?? 0;
  const activeItems = itemTotals?.active ?? 0;
  const cities = itemTotals?.cities ?? 0;
  const members = usersData?.count ?? 0;

  // Real numbers only. A stat with a value of 0 is never shown, and the strip
  // is hidden rather than showing a single lonely number.
  const stat = (n: number, singular: string, plural: string, accent = false): [number, CommunityStat] => [
    n,
    { label: n === 1 ? singular : plural, value: numberFormat.format(n), accent },
  ];
  const statCandidates = [
    stat(totalItems, "Item reported", "Items reported"),
    stat(resolvedItems, "Item reunited", "Items reunited", true),
    stat(members, "Member", "Members"),
    stat(cities, "City covered", "Cities covered"),
  ];
  if (resolvedItems > 0 && totalItems > 0) {
    const rate = Math.round((resolvedItems / totalItems) * 100);
    statCandidates.push([rate, { label: "Success rate", value: `${rate}%`, accent: true }]);
  }
  const shownStats = statCandidates.filter(([n]) => n > 0).map(([, s]) => s);
  const communityStats = shownStats.length >= 2 ? shownStats : [];

  const topCities: CityCount[] = topCityRows.map((row) => ({
    key: row.city,
    name: prettyPlace(row.city),
    count: row.count,
  }));

  // Free-text categories ("phones", "Wallets") fold into the canonical ones.
  const categoryCounts: Record<string, number> = {};
  for (const row of categoryRows) {
    const key = toItemCategory(row.category) ?? "Other";
    categoryCounts[key] = (categoryCounts[key] ?? 0) + row.count;
  }

  const latestItems: LatestItem[] = latestItemRows.map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title.trim(),
    area: prettyPlace(item.approximateLocation),
    city: prettyPlace(item.city),
    createdAt: item.createdAt.toISOString(),
    category: item.category,
    dateLostFound: item.dateLostFound.toISOString(),
    status: item.status,
    photo: resolveMediaRef(item.photoRef, `/api/media/items/${item.id}/0`, item.updatedAt),
  }));

  const pricing = {
    currency: normalizeCurrency(feeRow?.currency),
    chatUnlockFee: feeToCents(feeRow?.chatFee, DEFAULT_CHAT_UNLOCK_FEE_CENTS),
    subscriptionFee: feeToCents(feeRow?.subscriptionFee, DEFAULT_SUBSCRIPTION_FEE_CENTS),
  };

  // CMS footer links that point at CMS pages are resolved to the page's slug,
  // and dropped when that page isn't published (same rule as GlobalFooter).
  let footerData = footer || null;
  const footerColumns = Array.isArray(footer?.footerLinks) ? footer.footerLinks : [];
  if (footerData && footerColumns.some((col) => Array.isArray(col?.links) && col.links.some((l) => l?.pageId))) {
    const published = await db
      .select({ id: cmsPages.id, slug: cmsPages.slug })
      .from(cmsPages)
      .where(eq(cmsPages.status, "published"));
    const slugById = new Map(published.map((p) => [p.id, p.slug]));
    footerData = {
      ...footerData,
      footerLinks: footerColumns.map((col) => ({
        ...col,
        links: (Array.isArray(col.links) ? col.links : []).flatMap((link) => {
          if (!link.pageId) return [link];
          const slug = slugById.get(link.pageId);
          return slug ? [{ ...link, url: `/${slug}` }] : [];
        }),
      })),
    };
  }

  // Defaults while the CMS hero is empty.
  const hero = heroData || {
    headline: "Lost something?\nLet's get it back.",
    highlightedWords: "get it back",
    subheading:
      "Report a lost or found item in a minute. LostFound suggests likely matches and lets you chat privately to arrange a safe return.",
    primaryButtonText: "Browse all listings",
    primaryButtonLink: "/browse",
    secondaryButtonText: "Report an item",
    secondaryButtonLink: "/report",
    backgroundImage: "",
    illustrationImage: "",
    illustrationAnimation: "float",
    trustBadges: ["Free to report", "Exact location stays private", "Private messaging"],
  };

  return {
    hero,
    statisticsList,
    categoriesList,
    featuresList,
    pricingPlansList,
    communityStats,
    topCities,
    latestItems,
    categoryCounts,
    activeItems,
    citiesCount: cities,
    pricing,
    // Reference time for "3h ago" labels, so server and client render the same text.
    renderedAt: Date.now(),
    globalNetwork: globalNetwork || null,
    faq: faq || null,
    cta: cta || null,
    footer: footerData,
  };
}

const getCachedHomepageData = unstable_cache(() => withDbRetry(getHomepageData), ["homepage-data-v3"], {
  revalidate: 60,
  tags: [PUBLIC_CONTENT_TAG],
});

export default async function HomePage() {
  return <HomepageVisuals data={await getCachedHomepageData()} />;
}
