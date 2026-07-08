import { NextResponse } from "next/server";
import { db } from "@/db";
import { cmsGlobalNetwork } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const body = await req.json();
    
    const [existing] = await db.select().from(cmsGlobalNetwork).limit(1);

    if (existing) {
      const [updated] = await db.update(cmsGlobalNetwork)
        .set(body)
        .where(eq(cmsGlobalNetwork.id, existing.id))
        .returning();
      return NextResponse.json({ globalNetwork: updated });
    } else {
      const [created] = await db.insert(cmsGlobalNetwork).values(body).returning();
      return NextResponse.json({ globalNetwork: created });
    }
  } catch (error) {
    console.error("Error updating global network:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
