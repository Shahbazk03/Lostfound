/**
 * Photos and avatars are stored in the database as base64 data URLs
 * (often 100–300 KB each). Shipping those inside every JSON response made
 * lists slow and uncacheable. Instead, API responses carry small URLs that
 * point at /api/media/*, which decode the image once and let the browser
 * cache it. The `v` query param changes whenever the record changes, so
 * cached copies never go stale.
 */

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

function versionParam(version?: Date | string | number | null) {
  if (version === null || version === undefined) return "";
  const t = new Date(version).getTime();
  return Number.isFinite(t) && t > 0 ? `?v=${t}` : "";
}

/** True for values we store inline (and must serve via /api/media). */
export function isDataUrl(value: string | null | undefined): value is string {
  return typeof value === "string" && value.startsWith("data:");
}

/**
 * Public URL for a user's avatar. Remote URLs (e.g. Google photos) are
 * returned unchanged; inline data URLs become /api/media/avatar/{id}.
 */
export function avatarUrl(
  userId: number,
  avatar: string | null | undefined,
  version?: Date | string | number | null
): string | null {
  if (!avatar) return null;
  if (!isDataUrl(avatar)) return avatar;
  return `/api/media/avatar/${userId}${versionParam(version)}`;
}

/** Public URL for photo `index` of an item (same rules as avatarUrl). */
export function itemPhotoUrl(
  itemId: number,
  index: number,
  photo: string | null | undefined,
  version?: Date | string | number | null
): string | null {
  if (!photo) return null;
  if (!isDataUrl(photo)) return photo;
  return `/api/media/items/${itemId}/${index}${versionParam(version)}`;
}

/** Decode an image data URL. Returns null for anything that isn't a safe raster image. */
export function decodeImageDataUrl(dataUrl: string): { mime: string; data: Buffer } | null {
  const match = /^data:([a-z]+\/[a-z0-9.+-]+);base64,(.+)$/i.exec(dataUrl.trim());
  if (!match) return null;
  const mime = match[1].toLowerCase();
  if (!ALLOWED_MIME.has(mime)) return null; // never serve SVG or HTML
  try {
    return { mime, data: Buffer.from(match[2], "base64") };
  } catch {
    return null;
  }
}

type DecodedImage = { mime: string; data: Buffer };

/**
 * Small in-process LRU of decoded images, so a popular photo is fetched from
 * the (distant) database once rather than once per new visitor. Bounded by
 * total bytes. Keys include the record's version, so edits are never stale.
 */
const MAX_CACHE_BYTES = 40 * 1024 * 1024;
const globalForMedia = globalThis as unknown as {
  __mediaCache?: { map: Map<string, DecodedImage>; bytes: number };
};
const mediaCache = (globalForMedia.__mediaCache ??= { map: new Map(), bytes: 0 });

export function getCachedImage(key: string): DecodedImage | undefined {
  const hit = mediaCache.map.get(key);
  if (hit) {
    // refresh recency
    mediaCache.map.delete(key);
    mediaCache.map.set(key, hit);
  }
  return hit;
}

export function setCachedImage(key: string, image: DecodedImage) {
  if (image.data.length > MAX_CACHE_BYTES / 4) return;
  const existing = mediaCache.map.get(key);
  if (existing) {
    mediaCache.bytes -= existing.data.length;
    mediaCache.map.delete(key);
  }
  mediaCache.map.set(key, image);
  mediaCache.bytes += image.data.length;
  for (const [k, v] of mediaCache.map) {
    if (mediaCache.bytes <= MAX_CACHE_BYTES) break;
    mediaCache.map.delete(k);
    mediaCache.bytes -= v.data.length;
  }
}

/** Response for a decoded image. Versioned URLs are cached for a year. */
export function imageResponse(
  image: { mime: string; data: Buffer },
  { versioned }: { versioned: boolean }
) {
  return new Response(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.mime,
      "Content-Length": String(image.data.length),
      "Cache-Control": versioned
        ? "public, max-age=31536000, immutable"
        : "public, max-age=300, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
