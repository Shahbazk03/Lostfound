import type { MetadataRoute } from "next";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cmsPages, items } from "@/db/schema";
import { getSiteUrl } from "@/lib/utils";

// Regenerate at most once an hour.
export const revalidate = 3600;

// A single sitemap file may list at most 50,000 URLs.
const MAX_ITEMS = 40000;

const STATIC_ROUTES: { path: string; changeFrequency: "daily" | "weekly" | "monthly" | "yearly"; priority: number }[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/browse", changeFrequency: "daily", priority: 0.9 },
  { path: "/report", changeFrequency: "monthly", priority: 0.7 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/cookies", changeFrequency: "yearly", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${base}${route.path === "/" ? "" : route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // Each source is fetched independently so one failing query doesn't drop
  // the rest of the sitemap.
  const [activeItems, pages] = await Promise.all([
    db
      .select({ id: items.id, updatedAt: items.updatedAt })
      .from(items)
      .where(eq(items.status, "active"))
      .orderBy(desc(items.updatedAt))
      .limit(MAX_ITEMS)
      .catch((err) => {
        console.error("sitemap: failed to load items", err);
        return [];
      }),
    db
      .select({ slug: cmsPages.slug, updatedAt: cmsPages.updatedAt })
      .from(cmsPages)
      .where(and(eq(cmsPages.status, "published"), eq(cmsPages.visibility, "public")))
      .catch((err) => {
        console.error("sitemap: failed to load CMS pages", err);
        return [];
      }),
  ]);

  for (const page of pages) {
    entries.push({
      url: `${base}/${encodeURIComponent(page.slug)}`,
      lastModified: page.updatedAt ?? undefined,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  for (const item of activeItems) {
    entries.push({
      url: `${base}/items/${item.id}`,
      lastModified: item.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  return entries;
}
