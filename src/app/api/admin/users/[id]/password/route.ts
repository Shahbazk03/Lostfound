import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { authErrorResponse, badRequest, parseId } from "@/lib/api-errors";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { passwordProblem, readJsonBody } from "@/app/api/auth/_lib/auth-helpers";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST { password } — an admin sets a new password for a user.
 * The user can then sign in with it (share it with them securely). Any
 * pending "forgot password" codes for that account are cancelled.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();

    const limit = rateLimit(`admin-reset-password:${admin.id}`, 20, 15 * 60 * 1000);
    if (!limit.ok) return tooManyRequests(limit.retryAfter);

    const id = parseId((await params).id);
    if (!id) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = (await readJsonBody(request)) as { password?: unknown } | null;
    const problem = passwordProblem(body?.password);
    if (problem) return badRequest(problem);
    const password = body!.password as string;

    const hashed = await hashPassword(password);

    const [updated] = await db
      .update(users)
      // An admin-set password also proves nothing about email ownership, so
      // the verified flag is left as it is.
      .set({ password: hashed, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({ id: users.id, email: users.email });

    if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await db
      .delete(passwordResetTokens)
      .where(sql`lower(${passwordResetTokens.email}) = lower(${updated.email})`);

    return NextResponse.json({ success: true });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Admin reset password error:", error);
    return NextResponse.json({ error: "Could not reset the password" }, { status: 500 });
  }
}
