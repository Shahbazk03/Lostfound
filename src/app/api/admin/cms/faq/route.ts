import { NextResponse } from "next/server";
import { db } from "@/db";
import { cmsHomepageFaq } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const body = await req.json();
    
    const [existing] = await db.select().from(cmsHomepageFaq).limit(1);

    if (existing) {
      const [updated] = await db.update(cmsHomepageFaq)
        .set(body)
        .where(eq(cmsHomepageFaq.id, existing.id))
        .returning();
      return NextResponse.json({ faq: updated });
    } else {
      const [created] = await db.insert(cmsHomepageFaq).values(body).returning();
      return NextResponse.json({ faq: created });
    }
  } catch (error) {
    console.error("Error updating homepage FAQ:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
