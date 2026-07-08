import { NextResponse } from "next/server";
import { db } from "@/db";
import { mediaLibrary } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { join } from "path";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";

export async function GET(req: Request) {
  try {
    const files = await db.select().from(mediaLibrary).orderBy(desc(mediaLibrary.createdAt));
    return NextResponse.json({ files });
  } catch (error) {
    console.error("Error fetching media:", error);
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create a unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
    const filename = `${uniqueSuffix}-${originalName}`;
    
    // Define upload path
    const uploadDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);
    
    // Public URL
    const url = `/uploads/${filename}`;
    
    // Save to database
    const [savedFile] = await db.insert(mediaLibrary).values({
      fileName: originalName,
      url,
      fileType: file.type,
      sizeBytes: file.size,
      folderPath: "/",
    }).returning();
    
    return NextResponse.json({ file: savedFile }, { status: 201 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "No ID provided" }, { status: 400 });

    // In a production environment, you should also delete the file from the filesystem/S3 here.
    await db.delete(mediaLibrary).where(eq(mediaLibrary.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
