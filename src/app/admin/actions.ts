"use server";

import { db } from "@/db";
import { users, items, userSubscriptions, payments, activityLogs } from "@/db/schema";
import { count, eq, sql, and, sum, gte, desc } from "drizzle-orm";

export async function getDashboardStats() {
  const [totalUsersData] = await db.select({ count: count() }).from(users);
  const totalUsers = totalUsersData.count;

  // Active users count (using verified)
  const [activeUsersData] = await db.select({ count: count() }).from(users).where(eq(users.verified, true));
  const activeUsers = activeUsersData.count;

  // Premium users
  const [premiumUsersData] = await db.select({ count: count() }).from(userSubscriptions).where(eq(userSubscriptions.status, "active"));
  const premiumUsers = premiumUsersData.count;

  const [lostItemsData] = await db.select({ count: count() }).from(items).where(eq(items.type, "lost"));
  const lostItems = lostItemsData.count;

  const [foundItemsData] = await db.select({ count: count() }).from(items).where(eq(items.type, "found"));
  const foundItems = foundItemsData.count;

  const [recoveredItemsData] = await db.select({ count: count() }).from(items).where(eq(items.status, "resolved"));
  const recoveredItems = recoveredItemsData.count;

  // Todays reports
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [todaysReportsData] = await db.select({ count: count() }).from(items).where(gte(items.createdAt, today));
  const todaysReports = todaysReportsData.count;

  // Revenue from completed payments
  const [revenueData] = await db.select({ total: sum(payments.amount) }).from(payments).where(eq(payments.status, "completed"));
  const revenue = revenueData.total ? Number(revenueData.total) / 100 : 0; // Assuming amount is in cents

  // Total transactions
  const [transactionsData] = await db.select({ count: count() }).from(payments);
  const transactions = transactionsData.count;
  
  return {
    totalUsers,
    activeUsers,
    premiumUsers,
    lostItems,
    foundItems,
    recoveredItems,
    todaysReports,
    revenue,
    transactions,
    supportTickets: 0, // No support tickets table exists yet
  };
}

export async function getRecentActivity() {
  try {
    const logs = await db.select({
      id: activityLogs.id,
      action: activityLogs.action,
      entityType: activityLogs.entityType,
      createdAt: activityLogs.createdAt,
      userName: users.name
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .orderBy(desc(activityLogs.createdAt))
    .limit(5);

    if (logs.length > 0) return logs;
    
    // Fallback if no logs
    const recentUsers = await db.select().from(users).orderBy(desc(users.createdAt)).limit(5);
    return recentUsers.map(u => ({
      id: u.id,
      action: "New user registered",
      entityType: "USER",
      createdAt: u.createdAt,
      userName: u.name
    }));
  } catch (error) {
    console.error("Failed to fetch activity:", error);
    return [];
  }
}
