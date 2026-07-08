import { NextResponse } from "next/server";
import { db } from "@/db";
import { cmsStatistics } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const { statistics } = await req.json();
    
    // For arrays, simplest approach is delete all and insert new
    await db.delete(cmsStatistics);

    if (statistics && statistics.length > 0) {
      // Add orderIndex and timestamps
      const toInsert = statistics.map((stat: any, index: number) => ({
        ...stat,
        orderIndex: index,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await db.insert(cmsStatistics).values(toInsert);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating statistics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
