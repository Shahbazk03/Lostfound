import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages, users, items } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, desc, and, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    const sender = alias(users, "sender");
    const receiver = alias(users, "receiver");

    if (itemId) {
      const results = await db
        .select({
          id: messages.id,
          content: messages.content,
          read: messages.read,
          createdAt: messages.createdAt,
          senderId: messages.senderId,
          senderName: sender.name,
          senderAvatar: sender.avatar,
          receiverId: messages.receiverId,
          receiverName: receiver.name,
          receiverAvatar: receiver.avatar,
        })
        .from(messages)
        .leftJoin(sender, eq(messages.senderId, sender.id))
        .leftJoin(receiver, eq(messages.receiverId, receiver.id))
        .where(eq(messages.itemId, parseInt(itemId)))
        .orderBy(desc(messages.createdAt));

      const formattedMessages = results.map((msg) => {
        const isMeSender = msg.senderId === user.id;
        return {
          ...msg,
          otherUserId: isMeSender ? msg.receiverId : msg.senderId,
          otherUserName: isMeSender ? msg.receiverName : msg.senderName,
          otherUserAvatar: isMeSender ? msg.receiverAvatar : msg.senderAvatar,
        };
      });

      return NextResponse.json({ messages: formattedMessages });
    }

    // Get all conversations for user
    const results = await db
      .select({
        id: messages.id,
        content: messages.content,
        read: messages.read,
        createdAt: messages.createdAt,
        senderId: messages.senderId,
        senderName: sender.name,
        senderAvatar: sender.avatar,
        receiverId: messages.receiverId,
        receiverName: receiver.name,
        receiverAvatar: receiver.avatar,
        itemId: messages.itemId,
        itemTitle: items.title,
        itemPhotos: items.photos,
      })
      .from(messages)
      .leftJoin(sender, eq(messages.senderId, sender.id))
      .leftJoin(receiver, eq(messages.receiverId, receiver.id))
      .leftJoin(items, eq(messages.itemId, items.id))
      .where(
        or(
          eq(messages.senderId, user.id),
          eq(messages.receiverId, user.id)
        )
      )
      .orderBy(desc(messages.createdAt));

    // Format the response to make it easy for the frontend to identify the "other user"
    const formattedMessages = results.map((msg) => {
      const isMeSender = msg.senderId === user.id;
      return {
        ...msg,
        otherUserId: isMeSender ? msg.receiverId : msg.senderId,
        otherUserName: isMeSender ? msg.receiverName : msg.senderName,
        otherUserAvatar: isMeSender ? msg.receiverAvatar : msg.senderAvatar,
        itemPhoto: msg.itemPhotos && msg.itemPhotos.length > 0 ? msg.itemPhotos[0] : null,
      };
    });

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error("Get messages error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { receiverId, itemId, content } = body;

    if (!receiverId || !itemId || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newMessage = await db
      .insert(messages)
      .values({
        senderId: user.id,
        receiverId: parseInt(receiverId),
        itemId: parseInt(itemId),
        content,
      })
      .returning();

    return NextResponse.json({ message: newMessage[0] });
  } catch (error) {
    console.error("Create message error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
