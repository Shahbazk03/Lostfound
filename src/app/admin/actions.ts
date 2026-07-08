"use server";

import { db } from "@/db";
import { users, items } from "@/db/schema";
import { count, eq, sql } from "drizzle-orm";

export async function getDashboardStats() {
  const [totalUsersData] = await db.select({ count: count() }).from(users);
  const totalUsers = totalUsersData.count;

  // Assume active users are those verified or something. Let's just use a percentage for demo or count all for now.
  const activeUsers = Math.floor(totalUsers * 0.8);

  const premiumUsers = 0; // Replace with userSubscriptions table check later

  const [lostItemsData] = await db.select({ count: count() }).from(items).where(eq(items.type, "lost"));
  const lostItems = lostItemsData.count;

  const [foundItemsData] = await db.select({ count: count() }).from(items).where(eq(items.type, "found"));
  const foundItems = foundItemsData.count;

  const [recoveredItemsData] = await db.select({ count: count() }).from(items).where(eq(items.status, "resolved"));
  const recoveredItems = recoveredItemsData.count;

  // Revenue can be calculated from payments table if it exists, otherwise mock
  // Todays reports can be calculated with a date filter
  
  return {
    totalUsers,
    activeUsers,
    premiumUsers,
    lostItems,
    foundItems,
    recoveredItems,
    todaysReports: 12, // Mocked for now unless we add a complex date query
    revenue: 45000,    // Mocked for now
    transactions: 245, // Mocked for now
    supportTickets: 5, // Mocked for now
  };
}
