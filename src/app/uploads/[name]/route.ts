import { readFile } from "fs/promises";
import { join } from "path";

// Next.js only serves files that were in /public at BUILD time. Images that
// admins upload later land in public/uploads at runtime, so in production
// (`next start`) they would 404. This route serves those files.
// Files that existed at build time are still served statically first.

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;

  // Plain file names only — no slashes, no "..".
  if (!/^[\w-]+(\.[\w-]+)*$/.test(name)) {
    return new Response("Not found", { status: 404 });
  }

  const ext = name.split(".").pop()?.toLowerCase() || "";
  const type = TYPES[ext];
  if (!type) return new Response("Not found", { status: 404 });

  try {
    const data = await readFile(join(process.cwd(), "public", "uploads", name));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
