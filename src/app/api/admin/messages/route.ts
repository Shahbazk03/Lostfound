import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages, users, items } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export async function GET() {
  try {
    await requireAdmin();
    const sender = alias(users, "sender");
    const receiver = alias(users, "receiver");

    const results = await db
      .select({
        id: messages.id,
        content: messages.content,
        senderName: sender.name,
        receiverName: receiver.name,
        itemTitle: items.title,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .leftJoin(sender, eq(messages.senderId, sender.id))
      .leftJoin(receiver, eq(messages.receiverId, receiver.id))
      .leftJoin(items, eq(messages.itemId, items.id))
      .orderBy(desc(messages.createdAt))
      .limit(100);

    return NextResponse.json({ messages: results });
  } catch (error) {
    console.error("Get messages error:", error);
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
