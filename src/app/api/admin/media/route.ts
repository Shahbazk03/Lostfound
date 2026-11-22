import { NextResponse } from "next/server";
import { db } from "@/db";
import { mediaLibrary } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { join, basename } from "path";
import { writeFile, mkdir, unlink } from "fs/promises";
import { randomBytes } from "crypto";
import { requireAdmin } from "@/lib/auth";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// Only raster images. SVG is excluded on purpose: it can carry script.
// The stored extension comes from this map, never from the uploaded file name.
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

function authError(error: unknown) {
  const msg = error instanceof Error ? error.message : "";
  if (msg === "Unauthorized" || msg === "Forbidden") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

/** Check the first bytes so a renamed HTML file can't pass as an image. */
function looksLikeImage(buf: Buffer, mime: string): boolean {
  if (buf.length < 12) return false;
  switch (mime) {
    case "image/jpeg":
      return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    case "image/png":
      return buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case "image/gif":
      return buf.subarray(0, 4).toString("ascii") === "GIF8";
    case "image/webp":
      return buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP";
    case "image/avif":
      return buf.subarray(4, 8).toString("ascii") === "ftyp";
    default:
      return false;
  }
}

export async function GET() {
  try {
    await requireAdmin();
    const files = await db.select().from(mediaLibrary).orderBy(desc(mediaLibrary.createdAt));
    return NextResponse.json({ files });
  } catch (error) {
    const denied = authError(error);
    if (denied) return denied;
    console.error("Error fetching media:", error);
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > MAX_BYTES + 64 * 1024) {
      return NextResponse.json({ error: "File is too large (max 5 MB)" }, { status: 413 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: "Only JPG, PNG, WebP, GIF or AVIF images are allowed" },
        { status: 415 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File is too large (max 5 MB)" }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!looksLikeImage(buffer, file.type)) {
      return NextResponse.json({ error: "File content is not a valid image" }, { status: 415 });
    }

    const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(join(UPLOAD_DIR, filename), buffer);

    const displayName = file.name.replace(/[^a-zA-Z0-9._ -]/g, "").slice(0, 200) || filename;

    const [savedFile] = await db
      .insert(mediaLibrary)
      .values({
        fileName: displayName,
        url: `/uploads/${filename}`,
        fileType: file.type,
        sizeBytes: file.size,
        folderPath: "/",
      })
      .returning();

    return NextResponse.json({ file: savedFile }, { status: 201 });
  } catch (error) {
    const denied = authError(error);
    if (denied) return denied;
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin();

    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "No ID provided" }, { status: 400 });
    }

    const [deleted] = await db
      .delete(mediaLibrary)
      .where(eq(mediaLibrary.id, id))
      .returning();

    // Remove the file too, but only files we stored ourselves in /uploads.
    if (deleted?.url?.startsWith("/uploads/")) {
      const name = basename(deleted.url);
      if (/^[\w.-]+$/.test(name)) {
        await unlink(join(UPLOAD_DIR, name)).catch(() => {});
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const denied = authError(error);
    if (denied) return denied;
    console.error("Error deleting file:", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
