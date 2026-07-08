import { NextResponse } from "next/server";
import { db } from "@/db";
import { cmsHomepageCta } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const body = await req.json();
    
    const [existing] = await db.select().from(cmsHomepageCta).limit(1);

    if (existing) {
      const [updated] = await db.update(cmsHomepageCta)
        .set(body)
        .where(eq(cmsHomepageCta.id, existing.id))
        .returning();
      return NextResponse.json({ cta: updated });
    } else {
      const [created] = await db.insert(cmsHomepageCta).values(body).returning();
      return NextResponse.json({ cta: created });
    }
  } catch (error) {
    console.error("Error updating homepage CTA:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
