import { NextResponse } from "next/server";
import { db } from "@/db";
import { blogTags } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    await requireAdmin();
    const tags = await db
      .select()
      .from(blogTags)
      .orderBy(desc(blogTags.createdAt));

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("GET Tags Error:", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();

    const [newTag] = await db
      .insert(blogTags)
      .values({
        name: body.name,
        slug: body.slug,
      })
      .returning();

    return NextResponse.json({ tag: newTag });
  } catch (error: any) {
    console.error("POST Tag Error:", error);
    if (error?.code === "23505") { // unique constraint violation
      return NextResponse.json({ error: "Tag slug must be unique" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }
}
