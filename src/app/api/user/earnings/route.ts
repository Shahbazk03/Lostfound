import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { authErrorResponse } from "@/lib/api-errors";
import { getWalletBalances } from "@/lib/wallet";

export async function GET() {
  try {
    const user = await requireAuth();
    const wallet = await getWalletBalances(user.id);

    // Same numbers the withdrawal endpoint checks against. The old field names
    // are kept for the profile and game pages. All amounts are in cents.
    const balances = wallet.map((b) => ({
      ...b,
      totalEarned: b.earned + b.gameRewards,
      totalWithdrawn: b.withdrawn,
      pendingWithdrawal: b.pendingWithdrawals,
      availableBalance: b.available,
    }));

    return NextResponse.json({ balances });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Error fetching earnings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
