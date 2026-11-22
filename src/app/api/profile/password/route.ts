import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, requireAuth, verifyPassword } from "@/lib/auth";
import { authErrorResponse, badRequest } from "@/lib/api-errors";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { passwordProblem, readJsonBody } from "@/app/api/auth/_lib/auth-helpers";

/**
 * POST { currentPassword, newPassword } — the signed-in user changes their
 * own password. Accounts created with Google have a random password nobody
 * knows; they should use "Forgot password" to set one.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const limit = rateLimit(`change-password:${user.id}`, 5, 15 * 60 * 1000);
    if (!limit.ok) return tooManyRequests(limit.retryAfter);

    const body = (await readJsonBody(request)) as
      | { currentPassword?: unknown; newPassword?: unknown }
      | null;
    const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
    if (!currentPassword) return badRequest("Enter your current password");

    const problem = passwordProblem(body?.newPassword);
    if (problem) return badRequest(problem);
    const newPassword = body!.newPassword as string;
    if (newPassword === currentPassword) {
      return badRequest("The new password must be different from the current one");
    }

    const [row] = await db
      .select({ password: users.password })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    if (!row || !(await verifyPassword(currentPassword, row.password).catch(() => false))) {
      return NextResponse.json({ error: "Your current password is incorrect" }, { status: 400 });
    }

    await db
      .update(users)
      .set({ password: await hashPassword(newPassword), updatedAt: new Date() })
      .where(eq(users.id, user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Could not change the password" }, { status: 500 });
  }
}
