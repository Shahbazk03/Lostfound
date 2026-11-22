import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages, users, items, unlockedConversations } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { authErrorResponse, badRequest, parseId } from "@/lib/api-errors";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { eq, desc, and, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { firstPhoto, mediaRefColumns, resolveMediaRef } from "@/lib/media-sql";

const MAX_CONTENT_LENGTH = 2000;

type MessageRow = {
  senderId: number;
  receiverId: number;
  senderName: string | null;
  receiverName: string | null;
  senderAvatarRef: { remote: string | null; inline: boolean };
  receiverAvatarRef: { remote: string | null; inline: boolean };
  senderUpdatedAt: Date | null;
  receiverUpdatedAt: Date | null;
};

/** Replace avatar refs with URLs and add the "other user" fields. */
function formatMessage<T extends MessageRow>(msg: T, meId: number) {
  const { senderAvatarRef, receiverAvatarRef, senderUpdatedAt, receiverUpdatedAt, ...rest } = msg;
  const senderAvatar = resolveMediaRef(senderAvatarRef, `/api/media/avatar/${msg.senderId}`, senderUpdatedAt);
  const receiverAvatar = resolveMediaRef(receiverAvatarRef, `/api/media/avatar/${msg.receiverId}`, receiverUpdatedAt);
  const isMeSender = msg.senderId === meId;
  return {
    ...rest,
    senderAvatar,
    receiverAvatar,
    otherUserId: isMeSender ? msg.receiverId : msg.senderId,
    otherUserName: isMeSender ? msg.receiverName : msg.senderName,
    otherUserAvatar: isMeSender ? receiverAvatar : senderAvatar,
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const itemIdParam = searchParams.get("itemId");

    const sender = alias(users, "sender");
    const receiver = alias(users, "receiver");
    const isParticipant = or(eq(messages.senderId, user.id), eq(messages.receiverId, user.id));

    if (itemIdParam !== null) {
      const itemId = parseId(itemIdParam);
      if (!itemId) return badRequest("Invalid itemId");

      const [item] = await db
        .select({ userId: items.userId })
        .from(items)
        .where(eq(items.id, itemId))
        .limit(1);
      if (!item) return NextResponse.json({ messages: [] });

      // The owner and admins see every thread on the item; anyone else only
      // the messages they sent or received.
      const seesAll = item.userId === user.id || user.role === "admin";

      const results = await db
        .select({
          id: messages.id,
          content: messages.content,
          read: messages.read,
          createdAt: messages.createdAt,
          itemId: messages.itemId,
          senderId: messages.senderId,
          senderName: sender.name,
          senderAvatarRef: mediaRefColumns(sender.avatar),
          senderUpdatedAt: sender.updatedAt,
          receiverId: messages.receiverId,
          receiverName: receiver.name,
          receiverAvatarRef: mediaRefColumns(receiver.avatar),
          receiverUpdatedAt: receiver.updatedAt,
        })
        .from(messages)
        .leftJoin(sender, eq(messages.senderId, sender.id))
        .leftJoin(receiver, eq(messages.receiverId, receiver.id))
        .where(seesAll ? eq(messages.itemId, itemId) : and(eq(messages.itemId, itemId), isParticipant))
        .orderBy(desc(messages.createdAt));

      const formattedMessages = results.map((msg) => formatMessage(msg, user.id));

      return NextResponse.json({ messages: formattedMessages });
    }

    // All conversations the user is part of.
    const results = await db
      .select({
        id: messages.id,
        content: messages.content,
        read: messages.read,
        createdAt: messages.createdAt,
        senderId: messages.senderId,
        senderName: sender.name,
        senderAvatarRef: mediaRefColumns(sender.avatar),
          senderUpdatedAt: sender.updatedAt,
        receiverId: messages.receiverId,
        receiverName: receiver.name,
        receiverAvatarRef: mediaRefColumns(receiver.avatar),
          receiverUpdatedAt: receiver.updatedAt,
        itemId: messages.itemId,
        itemTitle: items.title,
        // A URL for the first photo, never the base64 image itself.
        itemPhotoRef: mediaRefColumns(firstPhoto(items.photos)),
        itemUpdatedAt: items.updatedAt,
      })
      .from(messages)
      .leftJoin(sender, eq(messages.senderId, sender.id))
      .leftJoin(receiver, eq(messages.receiverId, receiver.id))
      .leftJoin(items, eq(messages.itemId, items.id))
      .where(isParticipant)
      .orderBy(desc(messages.createdAt));

    // Make it easy for the frontend to identify the "other user".
    const formattedMessages = results.map(({ itemPhotoRef, itemUpdatedAt, ...msg }) => {
      const photo = resolveMediaRef(itemPhotoRef, `/api/media/items/${msg.itemId}/0`, itemUpdatedAt);
      return { ...formatMessage(msg, user.id), itemPhotos: photo ? [photo] : [] };
    });

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Get messages error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Body: { itemId, receiverId, content }
 * - Item owner: may only reply to someone who has already messaged them about this item.
 * - Anyone else: may only message the item owner, and needs a paid chat unlock
 *   for this item or an active subscription (admins are exempt from paying).
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const limit = rateLimit(`messages:${user.id}`, 30, 60_000);
    if (!limit.ok) return tooManyRequests(limit.retryAfter);

    const body = await request.json().catch(() => null);
    const itemId = parseId(body?.itemId);
    const receiverId = parseId(body?.receiverId);
    const content = typeof body?.content === "string" ? body.content.trim() : "";

    if (!itemId || !receiverId || !content) return badRequest("Missing required fields");
    if (content.length > MAX_CONTENT_LENGTH) {
      return badRequest(`Messages can be at most ${MAX_CONTENT_LENGTH} characters`);
    }
    if (receiverId === user.id) return badRequest("You can't message yourself");

    // Ownership always comes from the database, never from the request.
    const [item] = await db
      .select({ id: items.id, userId: items.userId })
      .from(items)
      .where(eq(items.id, itemId))
      .limit(1);
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    if (item.userId === user.id) {
      const [priorMessage] = await db
        .select({ id: messages.id })
        .from(messages)
        .where(
          and(
            eq(messages.itemId, itemId),
            eq(messages.senderId, receiverId),
            eq(messages.receiverId, user.id)
          )
        )
        .limit(1);
      if (!priorMessage) {
        return NextResponse.json(
          { error: "You can only reply to people who have messaged you about this item." },
          { status: 403 }
        );
      }
    } else {
      if (receiverId !== item.userId) {
        return NextResponse.json(
          { error: "Messages about this item can only be sent to its owner." },
          { status: 403 }
        );
      }

      if (user.role !== "admin" && !user.hasSubscription) {
        const [unlock] = await db
          .select({ id: unlockedConversations.id })
          .from(unlockedConversations)
          .where(
            and(eq(unlockedConversations.userId, user.id), eq(unlockedConversations.itemId, itemId))
          )
          .limit(1);
        if (!unlock) {
          return NextResponse.json(
            { error: "You must subscribe or unlock to send messages." },
            { status: 403 }
          );
        }
      }
    }

    const [newMessage] = await db
      .insert(messages)
      .values({ senderId: user.id, receiverId, itemId, content })
      .returning();

    return NextResponse.json({ message: newMessage });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Create message error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
