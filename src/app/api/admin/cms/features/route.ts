import { NextResponse } from "next/server";
import { db } from "@/db";
import { cmsFeatures } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const { features } = await req.json();
    
    // Simplest approach: delete all and insert new to manage ordering easily
    await db.delete(cmsFeatures);

    if (features && features.length > 0) {
      const toInsert = features.map((feat: any, index: number) => ({
        title: feat.title,
        description: feat.description || "",
        icon: feat.icon || null,
        orderIndex: index,
        isActive: feat.isActive !== false,
      }));

      await db.insert(cmsFeatures).values(toInsert);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating features:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
