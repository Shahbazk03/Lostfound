import { NextResponse } from "next/server";
import { db } from "@/db";
import { blogComments } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const p = await params;
    const commentId = parseInt(p.id);
    const body = await req.json();

    const [updatedComment] = await db
      .update(blogComments)
      .set({
        status: body.status,
      })
      .where(eq(blogComments.id, commentId))
      .returning();

    if (!updatedComment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    return NextResponse.json({ comment: updatedComment });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const p = await params;
    const commentId = parseInt(p.id);

    await db.delete(blogComments).where(eq(blogComments.id, commentId));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
