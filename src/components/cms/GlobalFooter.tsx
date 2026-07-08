import { db } from "@/db";
import { cmsFooter, cmsPages } from "@/db/schema";
import DynamicFooter from "@/components/DynamicFooter";

export async function GlobalFooter() {
  const [footerData] = await db.select().from(cmsFooter).limit(1);
  const allPages = await db.select({ id: cmsPages.id, slug: cmsPages.slug }).from(cmsPages);

  // Map the pageId in footerLinks to actual slugs
  let enrichedFooterData = footerData;
  if (footerData && Array.isArray(footerData.footerLinks)) {
    enrichedFooterData = {
      ...footerData,
      footerLinks: footerData.footerLinks.map((col: any) => ({
        ...col,
        links: col.links?.map((link: any) => {
          if (link.pageId) {
            const page = allPages.find(p => p.id === link.pageId);
            if (page) {
              return { ...link, url: `/${page.slug}` };
            }
          }
          return link;
        })
      }))
    };
  }

  return <DynamicFooter footerData={enrichedFooterData} />;
}
