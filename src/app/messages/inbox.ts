/**
 * Client-side helpers for the inbox: grouping messages into threads and
 * tracking which threads have unread replies.
 *
 * The API never flips `read` to true, so "unread" is worked out per browser:
 * a thread is unread when its newest message is from the other person and
 * arrived after the user last opened that thread here.
 */

export interface InboxMessage {
  id: number;
  content: string;
  read: boolean;
  createdAt: string;
  senderId: number;
  receiverId: number;
  itemId: number;
  itemTitle?: string | null;
  /** GET /api/messages returns the item's first photo as a one-element list. */
  itemPhotos?: string[];
  itemPhoto?: string | null;
  otherUserId?: number;
  otherUserName?: string | null;
  otherUserAvatar?: string | null;
}

export interface Conversation {
  /** `${itemId}-${otherUserId}`: one thread per item per other participant. */
  key: string;
  itemId: number;
  otherUserId: number;
  /** Oldest first. */
  messages: InboxMessage[];
  latest: InboxMessage;
  itemTitle: string | null;
  itemPhoto: string | null;
  otherUserName: string | null;
  otherUserAvatar: string | null;
}

const time = (m: InboxMessage) => new Date(m.createdAt).getTime();

/**
 * Group by (item, other participant) so an item owner talking to several
 * people gets one thread per person, and replies go to that person.
 * Newest thread first.
 */
export function groupConversations(messages: InboxMessage[], meId: number): Conversation[] {
  const byKey = new Map<string, InboxMessage[]>();
  for (const msg of messages) {
    const otherId = msg.senderId === meId ? msg.receiverId : msg.senderId;
    const key = `${msg.itemId}-${otherId}`;
    const list = byKey.get(key);
    if (list) list.push(msg);
    else byKey.set(key, [msg]);
  }
  return Array.from(byKey, ([key, msgs]) => {
    const sorted = [...msgs].sort((a, b) => time(a) - time(b));
    const latest = sorted[sorted.length - 1];
    const named = sorted.find((m) => m.otherUserName) ?? latest;
    const withItem = sorted.find((m) => m.itemTitle) ?? latest;
    const withPhoto = sorted.find((m) => m.itemPhotos?.[0] || m.itemPhoto);
    return {
      key,
      itemId: latest.itemId,
      otherUserId: latest.senderId === meId ? latest.receiverId : latest.senderId,
      messages: sorted,
      latest,
      itemTitle: withItem.itemTitle ?? null,
      itemPhoto: withPhoto?.itemPhotos?.[0] ?? withPhoto?.itemPhoto ?? null,
      otherUserName: named.otherUserName ?? null,
      otherUserAvatar: named.otherUserAvatar ?? null,
    };
  }).sort((a, b) => time(b.latest) - time(a.latest));
}

type SeenMap = Record<string, number>;

const seenKey = (userId: number) => `lf:inbox-seen:${userId}`;

/** Thread key -> time (ms) of the newest message the user has seen. */
export function readSeen(userId: number): SeenMap {
  try {
    const raw = window.localStorage.getItem(seenKey(userId));
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? (parsed as SeenMap) : {};
  } catch {
    return {};
  }
}

/** Records that the user has seen a thread up to its newest message. */
export function markSeen(userId: number, conversation: Conversation): SeenMap {
  const seen = readSeen(userId);
  const at = time(conversation.latest);
  if ((seen[conversation.key] ?? 0) >= at) return seen;
  const next = { ...seen, [conversation.key]: at };
  try {
    window.localStorage.setItem(seenKey(userId), JSON.stringify(next));
  } catch {
    // Private mode / storage full: unread dots just won't persist.
  }
  return next;
}

export function isUnread(conversation: Conversation, meId: number, seen: SeenMap): boolean {
  const { latest } = conversation;
  if (latest.senderId === meId || latest.read) return false;
  return time(latest) > (seen[conversation.key] ?? 0);
}
