import { db } from "@/db";
import { cmsFooter, cmsPages } from "@/db/schema";
import { eq } from "drizzle-orm";
import DynamicFooter from "@/components/DynamicFooter";

export async function GlobalFooter() {
  const [footerData] = await db.select().from(cmsFooter).limit(1);

  // Only published pages may be linked publicly; drafts, scheduled and archived
  // pages must not leak their slugs through the footer.
  const publishedPages = await db
    .select({ id: cmsPages.id, slug: cmsPages.slug })
    .from(cmsPages)
    .where(eq(cmsPages.status, "published"));
  const slugById = new Map(publishedPages.map((p) => [p.id, p.slug]));

  let enrichedFooterData = footerData;
  if (footerData && Array.isArray(footerData.footerLinks)) {
    enrichedFooterData = {
      ...footerData,
      footerLinks: footerData.footerLinks.map((col) => ({
        ...col,
        links: (Array.isArray(col.links) ? col.links : []).flatMap((link) => {
          if (!link.pageId) return [link];
          const slug = slugById.get(link.pageId);
          // A link to a page that isn't published is dropped rather than
          // falling back to whatever URL was stored with it.
          return slug ? [{ ...link, url: `/${slug}` }] : [];
        }),
      })),
    };
  }

  return <DynamicFooter footerData={enrichedFooterData} />;
}
