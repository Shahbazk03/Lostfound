import { NextResponse } from "next/server";
import { db } from "@/db";
import { cmsHero } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

    const [hero] = await db.select().from(cmsHero).limit(1);
    return NextResponse.json({ hero: hero || null });
  } catch (error) {
    console.error("Error fetching hero:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const body = await req.json();
    
    // Check if hero exists
    const [existing] = await db.select().from(cmsHero).limit(1);

    if (existing) {
      const [updated] = await db.update(cmsHero)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(cmsHero.id, existing.id))
        .returning();
      return NextResponse.json({ hero: updated });
    } else {
      const [created] = await db.insert(cmsHero).values(body).returning();
      return NextResponse.json({ hero: created });
    }
  } catch (error) {
    console.error("Error updating hero:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
