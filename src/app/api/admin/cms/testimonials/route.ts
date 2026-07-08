import { NextResponse } from "next/server";
import { db } from "@/db";
import { cmsTestimonials } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const { testimonials } = await req.json();
    
    // Simplest approach: delete all and insert new
    await db.delete(cmsTestimonials);

    if (testimonials && testimonials.length > 0) {
      const toInsert = testimonials.map((t: any) => ({
        customerName: t.customerName || "Anonymous",
        position: t.position || null,
        company: t.company || null,
        review: t.review || "",
        rating: typeof t.rating === "number" ? t.rating : 5,
        avatar: t.avatar || null,
        isActive: t.isActive !== false,
        createdAt: new Date(),
      }));

      await db.insert(cmsTestimonials).values(toInsert);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating testimonials:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
