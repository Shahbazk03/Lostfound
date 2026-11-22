import type { Metadata } from "next";
import { Suspense, cache } from "react";
import { notFound } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { items } from "@/db/schema";
import { ItemDetailSkeleton } from "@/components/items/ItemDetailSkeleton";
import ItemDetailClient from "./ItemDetailClient";

type PageProps = { params: Promise<{ id: string }> };

/**
 * Public fields only (never preciseLocation). The first photo is resolved in
 * SQL and dropped when it is a data: URL, so large inline images are never
 * pulled just to build metadata.
 */
const getItemSummary = cache(async (id: string) => {
  const itemId = Number(id);
  if (!Number.isSafeInteger(itemId) || itemId <= 0) return null;
  const [row] = await db
    .select({
      id: items.id,
      type: items.type,
      title: items.title,
      description: items.description,
      category: items.category,
      approximateLocation: items.approximateLocation,
      city: items.city,
      country: items.country,
      firstPhoto: sql<string | null>`case when left(${items.photos}->>0, 5) = 'data:' then null else ${items.photos}->>0 end`,
    })
    .from(items)
    .where(eq(items.id, itemId))
    .limit(1);
  return row ?? null;
});

function truncate(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

function isUsableImageUrl(value: string | null): value is string {
  if (!value) return false;
  return /^https?:\/\//i.test(value) || (value.startsWith("/") && !value.startsWith("//"));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  let item: Awaited<ReturnType<typeof getItemSummary>> = null;
  try {
    item = await getItemSummary(id);
  } catch {
    return { title: "Lost & Found Item | LOSTFOUND" };
  }
  if (!item) return { title: "Item Not Found | LOSTFOUND" };

  const typeLabel = item.type === "lost" ? "Lost" : "Found";
  const place = [item.city, item.country].filter(Boolean).join(", ") || item.approximateLocation;
  const title = `${typeLabel}: ${item.title}`;
  const description = truncate(
    `${typeLabel} ${item.category.toLowerCase()} near ${place}. ${item.description}`,
    160
  );
  const image = isUsableImageUrl(item.firstPhoto) ? item.firstPhoto : null;
  const url = `/items/${item.id}`;

  return {
    title: `${title} | LOSTFOUND`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      images: image ? [{ url: image, alt: item.title }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ItemDetailPage({ params }: PageProps) {
  const { id } = await params;

  let exists = true;
  try {
    exists = (await getItemSummary(id)) !== null;
  } catch {
    // Database hiccup: let the client UI try the API instead of a hard 404.
  }
  if (!exists) notFound();

  return (
    <Suspense fallback={<ItemDetailSkeleton />}>
      <ItemDetailClient />
    </Suspense>
  );
}
