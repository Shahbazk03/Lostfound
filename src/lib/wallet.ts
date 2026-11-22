import { db } from "@/db";
import { items, payments, withdrawalRequests, gameRewards } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
/** Either the shared db handle or a transaction handle from db.transaction(). */
export type DbOrTx = typeof db | Tx;

/** Every amount is in minor units (cents / paise) of `currency`. */
export type WalletBalance = {
  currency: string;
  /** Completed payments for items the user owns. */
  earned: number;
  /** Game rewards (only ever INR today). */
  gameRewards: number;
  /** Requested but not yet paid out (pending, and approved if that status exists). */
  pendingWithdrawals: number;
  /** Already paid out. */
  withdrawn: number;
  /** earned + gameRewards - pendingWithdrawals - withdrawn */
  available: number;
};

/** Currencies the item form offers. Withdrawals and prices must use one of these. */
export const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "INR", "AUD", "CAD"] as const;

/** Smallest withdrawal per currency, in minor units. Default is 1.00. */
const MIN_WITHDRAWAL_CENTS: Record<string, number> = { INR: 10000 }; // ₹100, roughly the same as 1.00 elsewhere
const DEFAULT_MIN_WITHDRAWAL_CENTS = 100;

export function minWithdrawalCents(currency: string): number {
  return MIN_WITHDRAWAL_CENTS[currency] ?? DEFAULT_MIN_WITHDRAWAL_CENTS;
}

/** "usd" / " USD " -> "USD" if supported, otherwise null. */
export function normalizeCurrency(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const c = value.trim().toUpperCase();
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(c) ? c : null;
}

/**
 * Parse an amount given in major units (5, "5.00", 12.5) into integer cents.
 * Returns null for anything that isn't a finite positive number.
 */
export function majorToCents(value: unknown): number | null {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : NaN;
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

/**
 * game_rewards.amount is decimal(10,3), but /api/game/reward has always written
 * it in MINOR units: 1.000 per level = 1 paisa, daily cap 500 = ₹5, and the game
 * page shows amount / 100 as rupees. So the stored value is already "cents".
 * If the reward route is ever changed to store rupees, change this to * 100.
 */
function gameRewardToCents(sum: unknown): number {
  const n = Number(sum ?? 0);
  return Number.isFinite(n) ? Math.floor(n) : 0;
}

/**
 * Lock the user's row until the surrounding transaction ends. Everything that
 * reads a balance and then writes based on it (withdrawal requests, admin
 * payouts, game rewards) takes this lock first so parallel requests queue up.
 */
export async function lockUserRow(tx: Tx, userId: number) {
  await tx.execute(sql`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`);
}

/**
 * The user's wallet, one entry per currency, sorted by currency code.
 * Pass the transaction handle when this is used to authorise a write.
 */
export async function getWalletBalances(
  userId: number,
  tx: DbOrTx = db
): Promise<WalletBalance[]> {
  const paymentCurrency = sql<string>`upper(${payments.currency})`;
  const earnedRows = await tx
    .select({
      currency: paymentCurrency,
      total: sql<string>`coalesce(sum(${payments.amount}), 0)`,
    })
    .from(payments)
    .innerJoin(items, eq(payments.itemId, items.id))
    .where(and(eq(items.userId, userId), eq(payments.status, "completed")))
    .groupBy(paymentCurrency);

  const rewardCurrency = sql<string>`upper(${gameRewards.currency})`;
  const rewardRows = await tx
    .select({
      currency: rewardCurrency,
      total: sql<string>`coalesce(sum(${gameRewards.amount}), 0)`,
    })
    .from(gameRewards)
    .where(eq(gameRewards.userId, userId))
    .groupBy(rewardCurrency);

  const withdrawalCurrency = sql<string>`upper(${withdrawalRequests.currency})`;
  const withdrawalRows = await tx
    .select({
      currency: withdrawalCurrency,
      status: withdrawalRequests.status,
      total: sql<string>`coalesce(sum(${withdrawalRequests.amount}), 0)`,
    })
    .from(withdrawalRequests)
    .where(eq(withdrawalRequests.userId, userId))
    .groupBy(withdrawalCurrency, withdrawalRequests.status);

  const map = new Map<string, WalletBalance>();
  const entry = (currency: string) => {
    let b = map.get(currency);
    if (!b) {
      b = { currency, earned: 0, gameRewards: 0, pendingWithdrawals: 0, withdrawn: 0, available: 0 };
      map.set(currency, b);
    }
    return b;
  };

  for (const r of earnedRows) entry(r.currency).earned += Number(r.total);
  for (const r of rewardRows) entry(r.currency).gameRewards += gameRewardToCents(r.total);
  for (const r of withdrawalRows) {
    const b = entry(r.currency);
    if (r.status === "completed") b.withdrawn += Number(r.total);
    else if (r.status !== "rejected") b.pendingWithdrawals += Number(r.total);
  }

  for (const b of map.values()) {
    b.available = b.earned + b.gameRewards - b.pendingWithdrawals - b.withdrawn;
  }

  return [...map.values()].sort((a, b) => a.currency.localeCompare(b.currency));
}

/** Balance for one currency; all zeros if the user has none in that currency. */
export async function getWalletBalance(
  userId: number,
  currency: string,
  tx: DbOrTx = db
): Promise<WalletBalance> {
  const balances = await getWalletBalances(userId, tx);
  return (
    balances.find((b) => b.currency === currency) ?? {
      currency,
      earned: 0,
      gameRewards: 0,
      pendingWithdrawals: 0,
      withdrawn: 0,
      available: 0,
    }
  );
}
