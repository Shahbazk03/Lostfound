import { notFound } from "next/navigation";
import { db } from "@/db";
import { cmsPages, cmsPageBlocks, users } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { GlobalFooter } from "@/components/cms/GlobalFooter";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const p = await params;
  const slug = p.slug;
  const [page] = await db
    .select()
    .from(cmsPages)
    .where(and(eq(cmsPages.slug, slug), eq(cmsPages.status, "published")))
    .limit(1);

  if (!page) {
    return { title: "Page Not Found" };
  }

  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || "",
    keywords: page.keywords || "",
    openGraph: page.ogImage ? { images: [page.ogImage] } : undefined,
    alternates: page.canonicalUrl ? { canonical: page.canonicalUrl } : undefined,
    robots: page.robots || "index, follow",
  };
}

export default async function DynamicCMSPage({ params }: PageProps) {
  const p = await params;
  const slug = p.slug;

  const [page] = await db
    .select()
    .from(cmsPages)
    .where(and(eq(cmsPages.slug, slug), eq(cmsPages.status, "published")))
    .limit(1);

  if (!page) {
    notFound();
  }

  const blocks = await db
    .select()
    .from(cmsPageBlocks)
    .where(eq(cmsPageBlocks.pageId, page.id))
    .orderBy(asc(cmsPageBlocks.orderIndex));

  return (
    <>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 pb-24">
        {blocks.map((block) => (
          <BlockRenderer key={block.id} block={block} />
        ))}
      </div>
      <GlobalFooter />
    </>
  );
}
