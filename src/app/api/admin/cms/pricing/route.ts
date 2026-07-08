import { NextResponse } from "next/server";
import { db } from "@/db";
import { cmsPricingPlans } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const { pricing } = await req.json();
    
    // Simplest approach: delete all and insert new
    await db.delete(cmsPricingPlans);

    if (pricing && pricing.length > 0) {
      const toInsert = pricing.map((p: any, index: number) => ({
        name: p.name || "Plan",
        description: p.description || "",
        monthlyPrice: typeof p.monthlyPrice === "number" ? p.monthlyPrice : 0,
        yearlyPrice: typeof p.yearlyPrice === "number" ? p.yearlyPrice : 0,
        benefits: p.benefits || [],
        buttonText: p.buttonText || "Subscribe",
        buttonLink: p.buttonLink || "",
        isPopular: p.isPopular === true,
        gradientClass: p.gradientClass || null,
        orderIndex: index,
        isActive: p.isActive !== false,
      }));

      await db.insert(cmsPricingPlans).values(toInsert);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating pricing plans:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
