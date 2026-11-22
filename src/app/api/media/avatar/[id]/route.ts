import { eq } from "drizzle-orm";
import { db, withDbRetry } from "@/db";
import { users } from "@/db/schema";
import { parseId } from "@/lib/api-errors";
import { decodeImageDataUrl, getCachedImage, imageResponse, setCachedImage } from "@/lib/media";

// Serves a user's inline (base64) avatar as a real, cacheable image.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = parseId((await params).id);
  if (!id) return new Response("Not found", { status: 404 });

  const version = new URL(request.url).searchParams.get("v");
  const cacheKey = version ? `avatar:${id}:${version}` : null;

  let image = cacheKey ? getCachedImage(cacheKey) : undefined;
  if (!image) {
    const [row] = await withDbRetry(() =>
      db.select({ avatar: users.avatar }).from(users).where(eq(users.id, id)).limit(1)
    );
    image = (row?.avatar && decodeImageDataUrl(row.avatar)) || undefined;
    if (image && cacheKey) setCachedImage(cacheKey, image);
  }

  if (!image) return new Response("Not found", { status: 404 });
  return imageResponse(image, { versioned: Boolean(version) });
}
