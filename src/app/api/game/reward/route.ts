import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { gameRewards } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and, sql, gte } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { level } = await request.json();
    if (typeof level !== 'number' || level < 1) {
      return NextResponse.json({ error: "Invalid level" }, { status: 400 });
    }

    // Check if user already received reward for this level
    const existingReward = await db
      .select()
      .from(gameRewards)
      .where(
        and(
          eq(gameRewards.userId, user.id),
          eq(gameRewards.level, level)
        )
      )
      .limit(1);

    if (existingReward.length > 0) {
      return NextResponse.json({
        success: true,
        reward: 0,
        alreadyRewarded: true,
        limitReached: false,
      });
    }

    // Reward formula: Flat 1 paisa (1 cent) per level up
    // 100 paise = 1 Rupee. So 100 levels = 1 Rupee.
    const rewardAmount = 1;

    // Get today's total
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const result = await db
      .select({ total: sql<number>`sum(${gameRewards.amount})` })
      .from(gameRewards)
      .where(
        and(
          eq(gameRewards.userId, user.id),
          gte(gameRewards.createdAt, startOfDay)
        )
      );

    const todayTotal = result[0]?.total ? Number(result[0].total) : 0;
    const dailyLimit = 500; // 500 cents = ₹5 daily limit

    let actualReward = rewardAmount;
    let limitReached = false;

    if (todayTotal >= dailyLimit) {
      actualReward = 0;
      limitReached = true;
    } else if (todayTotal + rewardAmount > dailyLimit) {
      actualReward = dailyLimit - todayTotal;
    }

    if (actualReward > 0) {
      await db.insert(gameRewards).values({
        userId: user.id,
        level: level,
        amount: actualReward.toFixed(3),
        currency: "INR"
      });
    }

    return NextResponse.json({
      success: true,
      reward: actualReward,
      limitReached: limitReached || (todayTotal + rewardAmount >= dailyLimit),
      todayTotal: todayTotal + actualReward
    });

  } catch (error) {
    console.error("Error processing game reward:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
