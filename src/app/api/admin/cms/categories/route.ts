import { NextResponse } from "next/server";
import { db } from "@/db";
import { cmsCategories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const { categories } = await req.json();
    
    // Simplest approach: delete all and insert new to manage ordering easily
    await db.delete(cmsCategories);

    if (categories && categories.length > 0) {
      const toInsert = categories.map((cat: any, index: number) => ({
        name: cat.name,
        description: cat.description || null,
        icon: cat.icon || null,
        image: cat.image || null,
        color: cat.color || null,
        orderIndex: index,
        isActive: cat.isActive !== false,
      }));

      await db.insert(cmsCategories).values(toInsert);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating categories:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
