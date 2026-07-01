import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizationSettings } from "@/db/schema";

export async function GET() {
  try {
    const settings = await db
      .select()
      .from(organizationSettings)
      .limit(1);

    return NextResponse.json({ 
      settings: settings[0] || null 
    });
  } catch (error) {
    console.error("Get public settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
