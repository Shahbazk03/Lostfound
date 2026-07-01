import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { withdrawalRequests } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = await request.json();
    
    if (!["completed", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updatedRequest = await db
      .update(withdrawalRequests)
      .set({ 
        status: status as "completed" | "rejected",
        updatedAt: new Date()
      })
      .where(eq(withdrawalRequests.id, parseInt(id)))
      .returning();

    if (updatedRequest.length === 0) {
      return NextResponse.json({ error: "Withdrawal request not found" }, { status: 404 });
    }

    return NextResponse.json(updatedRequest[0]);

  } catch (error) {
    console.error("Error updating withdrawal status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
