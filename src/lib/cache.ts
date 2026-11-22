import { revalidateTag } from "next/cache";

/**
 * Tag for public, rarely-changing content (homepage CMS sections, homepage
 * stats, latest listings). Cached reads use it; any write that changes what
 * the public homepage shows must call invalidatePublicContent().
 */
export const PUBLIC_CONTENT_TAG = "public-content";

/** Expire cached public content immediately (next request reads fresh data). */
export function invalidatePublicContent() {
  try {
    revalidateTag(PUBLIC_CONTENT_TAG, { expire: 0 });
  } catch (error) {
    // Outside a request context (e.g. scripts) there is no cache to purge.
    console.warn("invalidatePublicContent skipped:", error);
  }
}
