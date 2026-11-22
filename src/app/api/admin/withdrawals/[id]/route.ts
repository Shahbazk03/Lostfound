import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { withdrawalRequests, withdrawalStatusEnum } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { authErrorResponse, badRequest, parseId } from "@/lib/api-errors";
import { getWalletBalance, lockUserRow } from "@/lib/wallet";
import { eq } from "drizzle-orm";

type WithdrawalStatus = (typeof withdrawalStatusEnum.enumValues)[number];
const STATUSES: readonly string[] = withdrawalStatusEnum.enumValues;
const HAS_APPROVED = STATUSES.includes("approved");

// Intended flow: pending -> approved | rejected, approved -> completed | rejected,
// nothing out of completed or rejected. The DB enum has no "approved" value yet
// (it needs a schema migration), so until it does an admin pays out straight
// from pending. Once "approved" is added to the enum the strict flow applies.
const TRANSITIONS: Record<string, readonly string[]> = HAS_APPROVED
  ? { pending: ["approved", "rejected"], approved: ["completed", "rejected"] }
  : { pending: ["completed", "rejected"] };

// The admin page sends "failed" for Reject.
const ALIASES: Record<string, string> = { failed: "rejected" };

type RouteContext = { params: Promise<{ id: string }> };

/** Body: { status: "completed" | "rejected" | "approved" (when supported) | "failed" (= rejected) } */
async function updateWithdrawal(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();
    const withdrawalId = parseId((await params).id);
    if (!withdrawalId) return badRequest("Invalid withdrawal id");

    const body = await request.json().catch(() => null);
    const raw = typeof body?.status === "string" ? body.status.trim().toLowerCase() : "";
    const next = ALIASES[raw] ?? raw;
    if (!STATUSES.includes(next)) return badRequest("Invalid status");

    const [found] = await db
      .select({ userId: withdrawalRequests.userId })
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.id, withdrawalId))
      .limit(1);
    if (!found) {
      return NextResponse.json({ error: "Withdrawal request not found" }, { status: 404 });
    }

    const result = await db.transaction(async (tx) => {
      // Same lock order as the user's withdrawal POST: user row first.
      await lockUserRow(tx, found.userId);
      const [w] = await tx
        .select()
        .from(withdrawalRequests)
        .where(eq(withdrawalRequests.id, withdrawalId))
        .for("update");
      if (!w) return { status: 404, error: "Withdrawal request not found" };

      if (!(TRANSITIONS[w.status] ?? []).includes(next)) {
        return { status: 409, error: `A ${w.status} withdrawal can't be changed to ${next}` };
      }

      if (next === "approved" || next === "completed") {
        // Money in minus money already paid out must still cover this request.
        // Other pending requests don't block it; they're checked when paid.
        const b = await getWalletBalance(w.userId, w.currency.toUpperCase(), tx);
        const covered = b.earned + b.gameRewards - b.withdrawn;
        if (covered < w.amount) {
          return {
            status: 409,
            error: "The user's balance no longer covers this withdrawal",
            covered: Math.max(0, covered),
          };
        }
      }

      const [updated] = await tx
        .update(withdrawalRequests)
        .set({ status: next as WithdrawalStatus, updatedAt: new Date() })
        .where(eq(withdrawalRequests.id, withdrawalId))
        .returning();
      return { updated };
    });

    if ("updated" in result) return NextResponse.json(result.updated);
    const { status, ...payload } = result;
    return NextResponse.json(payload, { status });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Error updating withdrawal status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export { updateWithdrawal as PATCH, updateWithdrawal as PUT };
