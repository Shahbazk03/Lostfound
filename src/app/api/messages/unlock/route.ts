import { NextResponse } from "next/server";

/**
 * Retired. Per-message unlocking never had a webhook handler or a DB table,
 * and /api/messages never marks a message as locked, so nothing could be
 * unlocked. Messaging is unlocked per item via POST /api/payments/unlock-chat
 * (or the premium subscription).
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Unlocking individual messages is no longer supported. Unlock the conversation from the item page instead.",
      replacement: "/api/payments/unlock-chat",
    },
    { status: 410 }
  );
}
