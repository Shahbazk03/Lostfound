import { NextResponse } from "next/server";
import { db } from "@/db";
import { cmsFooter } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const body = await req.json();
    
    const [existing] = await db.select().from(cmsFooter).limit(1);

    if (existing) {
      const [updated] = await db.update(cmsFooter)
        .set(body)
        .where(eq(cmsFooter.id, existing.id))
        .returning();
      return NextResponse.json({ footer: updated });
    } else {
      const [created] = await db.insert(cmsFooter).values(body).returning();
      return NextResponse.json({ footer: created });
    }
  } catch (error) {
    console.error("Error updating footer:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
