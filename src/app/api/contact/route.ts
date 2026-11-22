import { NextResponse } from "next/server";
import { db } from "@/db";
import { supportTickets } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

const NAME_MAX = 100;
const EMAIL_MAX = 255;
const MESSAGE_MAX = 5000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await req.json();
    if (!parsed || typeof parsed !== "object") return badRequest("Invalid request body");
    body = parsed as Record<string, unknown>;
  } catch {
    return badRequest("Invalid request body");
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!name || !email || !message) {
    return badRequest("Name, email, and message are required");
  }
  if (name.length > NAME_MAX) {
    return badRequest(`Name must be at most ${NAME_MAX} characters`);
  }
  if (email.length > EMAIL_MAX || !EMAIL_PATTERN.test(email)) {
    return badRequest("Please enter a valid email address");
  }
  if (message.length > MESSAGE_MAX) {
    return badRequest(`Message must be at most ${MESSAGE_MAX} characters`);
  }

  const limit = rateLimit(`contact:ip:${getClientIp(req)}`, 5, 60 * 60 * 1000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  try {
    // Optional: link the ticket to the signed-in user. Anonymous is fine.
    const user = await getCurrentUser().catch(() => null);

    await db.insert(supportTickets).values({
      name,
      email,
      message,
      status: "open",
      userId: user?.id ?? null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return NextResponse.json({ error: "Failed to submit message" }, { status: 500 });
  }
}
