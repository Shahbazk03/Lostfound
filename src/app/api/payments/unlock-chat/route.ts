import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createConversationUnlockSession } from "@/lib/stripe";
import { db } from "@/db";
import { organizationSettings } from "@/db/schema";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId } = await request.json();
    
    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    const settings = await db.select().from(organizationSettings).limit(1);
    const amount = settings.length > 0 && settings[0].metadata?.oneTimeUnlockFee 
      ? Number(settings[0].metadata.oneTimeUnlockFee) 
      : 100;
    const currency = settings.length > 0 && settings[0].currency ? settings[0].currency : "usd";

    const sessionUrl = await createConversationUnlockSession({
      userId: user.id,
      itemId,
      amount,
      currency,
    });

    if (!sessionUrl) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessionUrl });
  } catch (error) {
    console.error("Conversation unlock checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
