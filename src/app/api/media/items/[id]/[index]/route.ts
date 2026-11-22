import { eq, sql } from "drizzle-orm";
import { db, withDbRetry } from "@/db";
import { items } from "@/db/schema";
import { parseId } from "@/lib/api-errors";
import { decodeImageDataUrl, getCachedImage, imageResponse, setCachedImage } from "@/lib/media";

const MAX_PHOTOS = 6;

// Serves one inline (base64) item photo as a real, cacheable image.
// Item photos are already public on the item page, so no auth is needed.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; index: string }> }
) {
  const { id: rawId, index: rawIndex } = await params;
  const id = parseId(rawId);
  const index = Number(rawIndex);
  if (!id || !Number.isInteger(index) || index < 0 || index >= MAX_PHOTOS) {
    return new Response("Not found", { status: 404 });
  }

  const version = new URL(request.url).searchParams.get("v");
  const cacheKey = version ? `item:${id}:${index}:${version}` : null;

  let image = cacheKey ? getCachedImage(cacheKey) : undefined;
  if (!image) {
    // Pull just the one photo out of the JSON array, not all of them.
    // Cast: a bare parameter is inferred as text, and `jsonb ->> '0'` looks up
    // an object key (always NULL for an array) instead of an array index.
    const [row] = await withDbRetry(() =>
      db
        .select({ photo: sql<string | null>`${items.photos} ->> (${index})::int` })
        .from(items)
        .where(eq(items.id, id))
        .limit(1)
    );
    image = (row?.photo && decodeImageDataUrl(row.photo)) || undefined;
    if (image && cacheKey) setCachedImage(cacheKey, image);
  }

  if (!image) return new Response("Not found", { status: 404 });
  return imageResponse(image, { versioned: Boolean(version) });
}
