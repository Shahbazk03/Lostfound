import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { withdrawalRequests } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { authErrorResponse, badRequest } from "@/lib/api-errors";
import {
  getWalletBalance,
  lockUserRow,
  majorToCents,
  minWithdrawalCents,
  normalizeCurrency,
} from "@/lib/wallet";

/**
 * Body: { amount: number | string, currency: string }
 * `amount` is in MAJOR units (12.50 = $12.50). It is stored in cents.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return badRequest("Invalid request body");

    const currency = normalizeCurrency(body.currency);
    if (!currency) return badRequest("A supported currency is required");

    const cents = majorToCents(body.amount);
    if (cents === null) return badRequest("Enter a valid amount");

    const min = minWithdrawalCents(currency);
    if (cents < min) {
      return badRequest(`The minimum withdrawal is ${(min / 100).toFixed(2)} ${currency}`);
    }

    // Lock the user row so two parallel requests can't both spend the same
    // balance: the second one waits here and then sees the first one's row.
    const result = await db.transaction(async (tx) => {
      await lockUserRow(tx, user.id);

      const balance = await getWalletBalance(user.id, currency, tx);
      if (cents > balance.available) {
        return { ok: false as const, available: balance.available };
      }

      const [created] = await tx
        .insert(withdrawalRequests)
        .values({ userId: user.id, amount: cents, currency, status: "pending" })
        .returning();
      return { ok: true as const, created };
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error: "Insufficient balance",
          available: Math.max(0, result.available),
          currency,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(result.created, { status: 201 });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Error creating withdrawal:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
