import { NextResponse } from "next/server";
import { db } from "@/db";
import { cmsPricingPlans } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { authErrorResponse, badRequest } from "@/lib/api-errors";
import { invalidatePublicContent } from "@/lib/cache";

const MAX_ROWS = 20;
const MAX_PRICE = 100_000_000; // cents

/** null for empty, false for invalid, otherwise the string. */
function text(v: unknown, max: number): string | null | false {
  if (v === undefined || v === null || v === "") return null;
  return typeof v === "string" && v.length <= max ? v : false;
}

/** Price in cents; missing means 0. */
function price(v: unknown): number | false {
  if (v === undefined || v === null || v === "") return 0;
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 0 && n <= MAX_PRICE ? Math.round(n) : false;
}

function toRow(raw: unknown, index: number): typeof cmsPricingPlans.$inferInsert | string {
  if (!raw || typeof raw !== "object") return "must be an object";
  const r = raw as Record<string, unknown>;
  const name = text(r.name, 100);
  const description = text(r.description, 2000);
  const buttonText = text(r.buttonText, 50);
  const buttonLink = text(r.buttonLink, 255);
  const gradientClass = text(r.gradientClass, 100);
  if ([name, description, buttonText, buttonLink, gradientClass].includes(false)) {
    return "a text field is invalid or too long";
  }
  const monthlyPrice = price(r.monthlyPrice);
  const yearlyPrice = price(r.yearlyPrice);
  if (monthlyPrice === false || yearlyPrice === false) return "prices must be non-negative numbers";

  const benefits = r.benefits ?? [];
  if (
    !Array.isArray(benefits) ||
    benefits.length > 50 ||
    !benefits.every((b) => typeof b === "string" && b.length <= 500)
  ) {
    return "benefits must be a list of up to 50 short texts";
  }

  return {
    name: (name as string | null) || "Plan",
    description: (description as string | null) ?? "",
    monthlyPrice,
    yearlyPrice,
    benefits: benefits as string[],
    buttonText: (buttonText as string | null) || "Subscribe",
    buttonLink: (buttonLink as string | null) ?? "",
    isPopular: r.isPopular === true,
    gradientClass: gradientClass as string | null,
    orderIndex: index,
    isActive: r.isActive !== false,
  };
}

/** Body: { pricing: [...] }. Replaces the whole list; order is the array order. */
async function POSTImpl(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => null);
    const list: unknown = body?.pricing;
    if (!Array.isArray(list)) return badRequest("pricing must be a list");
    if (list.length > MAX_ROWS) return badRequest(`At most ${MAX_ROWS} plans`);

    // Validate everything before touching the table.
    const rows: (typeof cmsPricingPlans.$inferInsert)[] = [];
    for (const [i, raw] of list.entries()) {
      const row = toRow(raw, i);
      if (typeof row === "string") return badRequest(`Plan ${i + 1}: ${row}`);
      rows.push(row);
    }

    await db.transaction(async (tx) => {
      await tx.delete(cmsPricingPlans);
      if (rows.length > 0) await tx.insert(cmsPricingPlans).values(rows);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Error updating pricing plans:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Writes here change what the public homepage shows, so purge its cache.
export async function POST(...args: Parameters<typeof POSTImpl>) {
  const res = await POSTImpl(...args);
  if (res.ok) invalidatePublicContent();
  return res;
}
