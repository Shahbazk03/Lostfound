"use server";

import { db } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { users, items, userSubscriptions, payments, activityLogs, supportTickets } from "@/db/schema";
import { count, eq, sql, sum, gte, desc } from "drizzle-orm";

export async function getDashboardStats() {
  await requireAdmin();
  const [totalUsersData] = await db.select({ count: count() }).from(users);
  const [activeUsersData] = await db.select({ count: count() }).from(users).where(eq(users.verified, true));
  const [premiumUsersData] = await db.select({ count: count() }).from(userSubscriptions).where(eq(userSubscriptions.status, "active"));
  const [lostItemsData] = await db.select({ count: count() }).from(items).where(eq(items.type, "lost"));
  const [foundItemsData] = await db.select({ count: count() }).from(items).where(eq(items.type, "found"));
  const [recoveredItemsData] = await db.select({ count: count() }).from(items).where(eq(items.status, "resolved"));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [todaysReportsData] = await db.select({ count: count() }).from(items).where(gte(items.createdAt, today));

  const [revenueData] = await db.select({ total: sum(payments.amount) }).from(payments).where(eq(payments.status, "completed"));
  const revenue = revenueData.total ? Number(revenueData.total) / 100 : 0;

  const [transactionsData] = await db.select({ count: count() }).from(payments);
  const [supportTicketsData] = await db.select({ count: count() }).from(supportTickets);

  return {
    totalUsers: totalUsersData.count,
    activeUsers: activeUsersData.count,
    premiumUsers: premiumUsersData.count,
    lostItems: lostItemsData.count,
    foundItems: foundItemsData.count,
    recoveredItems: recoveredItemsData.count,
    todaysReports: todaysReportsData.count,
    revenue,
    transactions: transactionsData.count,
    supportTickets: supportTicketsData.count,
  };
}

export async function getRevenueChartData() {
  await requireAdmin();
  // Last 6 months of revenue grouped by month
  const rows = await db.execute(sql`
    SELECT
      TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS month,
      DATE_TRUNC('month', created_at) AS month_date,
      COALESCE(SUM(amount), 0) / 100.0 AS revenue
    FROM payments
    WHERE status = 'completed'
      AND created_at >= NOW() - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month_date ASC
  `);

  return (rows as any[]).map((r: any) => ({
    month: r.month,
    revenue: Number(r.revenue),
  }));
}

export async function getItemsChartData() {
  await requireAdmin();
  // Last 7 days: lost vs found count per day
  const rows = await db.execute(sql`
    SELECT
      TO_CHAR(DATE_TRUNC('day', created_at), 'Dy') AS day,
      DATE_TRUNC('day', created_at) AS day_date,
      SUM(CASE WHEN type = 'lost' THEN 1 ELSE 0 END) AS lost,
      SUM(CASE WHEN type = 'found' THEN 1 ELSE 0 END) AS found
    FROM items
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY DATE_TRUNC('day', created_at)
    ORDER BY day_date ASC
  `);

  return (rows as any[]).map((r: any) => ({
    day: r.day,
    lost: Number(r.lost),
    found: Number(r.found),
  }));
}

export async function getRecentActivity() {
  await requireAdmin();
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
    .limit(8);

    if (logs.length > 0) return logs;

    // Fallback: show recent user registrations
    const recentUsers = await db.select().from(users).orderBy(desc(users.createdAt)).limit(8);
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

// ---------------------------------------------------------------------------
// Admin shell + dashboard (each statement is one round trip; the database is
// far away, so related numbers are fetched together rather than one by one).
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>;
const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));
const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

/** Sidebar badges: open support tickets and pending withdrawals. */
export async function getNavCounts() {
  await requireAdmin();
  const rows = (await db.execute(sql`
    SELECT
      (SELECT count(*) FROM support_tickets WHERE status = 'open') AS open_tickets,
      (SELECT count(*) FROM withdrawal_requests WHERE status = 'pending') AS pending_withdrawals
  `)) as unknown as Row[];
  const r = rows[0] ?? {};
  return { openTickets: num(r.open_tickets), pendingWithdrawals: num(r.pending_withdrawals) };
}

export type MoneyByCurrency = { currency: string; amount: number; count: number };
export type DaySeries = { day: string; lost: number; found: number; signups: number; visits: number };
export type RevenuePoint = { day: string; currency: string; amount: number };
export type ActivityEntry = {
  kind: "item" | "user" | "payment" | "ticket";
  id: number;
  title: string;
  sub: string;
  extra: string;
  amount: number | null;
  currency: string | null;
  at: number;
};
export type AttentionEntry = {
  kind: "withdrawal" | "ticket" | "item";
  id: number;
  title: string;
  sub: string;
  amount: number | null;
  currency: string | null;
  at: number;
};

/**
 * Everything the /admin dashboard shows, in five parallel statements.
 * Times are epoch milliseconds (timestamps are stored in UTC).
 */
export async function getDashboardOverview() {
  await requireAdmin();

  const since = sql`date_trunc('day', now()::timestamp) - interval '29 days'`;

  const [countsRows, moneyRows, seriesRows, revenueRows, feedRows] = (await Promise.all([
    db.execute(sql`
      SELECT
        (SELECT count(*) FROM items WHERE type = 'lost') AS lost,
        (SELECT count(*) FROM items WHERE type = 'found') AS found,
        (SELECT count(*) FROM items WHERE status = 'active') AS active,
        (SELECT count(*) FROM items WHERE status = 'resolved') AS resolved,
        (SELECT count(*) FROM items WHERE status = 'archived') AS archived,
        (SELECT count(*) FROM items WHERE created_at >= now()::timestamp - interval '24 hours') AS items_24h,
        (SELECT count(*) FROM items WHERE created_at >= now()::timestamp - interval '30 days') AS items_30d,
        (SELECT count(*) FROM items WHERE created_at >= now()::timestamp - interval '60 days'
            AND created_at < now()::timestamp - interval '30 days') AS items_prev_30d,
        (SELECT count(*) FROM users) AS users_total,
        (SELECT count(*) FROM users WHERE created_at >= now()::timestamp - interval '7 days') AS users_week,
        (SELECT count(*) FROM users WHERE created_at >= now()::timestamp - interval '14 days'
            AND created_at < now()::timestamp - interval '7 days') AS users_prev_week,
        (SELECT count(*) FROM support_tickets WHERE status = 'open') AS tickets_open,
        (SELECT count(*) FROM support_tickets WHERE status = 'in_progress') AS tickets_in_progress,
        (SELECT count(*) FROM withdrawal_requests WHERE status = 'pending') AS withdrawals_pending,
        (SELECT count(*) FROM visitor_sessions WHERE start_time >= now()::timestamp - interval '7 days') AS visits_week,
        (SELECT count(*) FROM visitor_sessions WHERE start_time >= now()::timestamp - interval '14 days'
            AND start_time < now()::timestamp - interval '7 days') AS visits_prev_week,
        (SELECT count(*) FROM visitor_sessions WHERE last_heartbeat >= now()::timestamp - interval '2 minutes') AS online_now
    `),
    db.execute(sql`
      SELECT 'revenue' AS kind, upper(currency) AS currency, coalesce(sum(amount), 0) AS amount, count(*) AS n
        FROM payments WHERE status = 'completed' GROUP BY upper(currency)
      UNION ALL
      SELECT 'withdrawals', upper(currency), coalesce(sum(amount), 0), count(*)
        FROM withdrawal_requests WHERE status = 'pending' GROUP BY upper(currency)
    `),
    db.execute(sql`
      WITH days AS (
        SELECT generate_series(${since}, date_trunc('day', now()::timestamp), interval '1 day') AS day
      ),
      it AS (
        SELECT date_trunc('day', created_at) AS d,
               count(*) FILTER (WHERE type = 'lost') AS lost,
               count(*) FILTER (WHERE type = 'found') AS found
        FROM items WHERE created_at >= ${since} GROUP BY 1
      ),
      us AS (SELECT date_trunc('day', created_at) AS d, count(*) AS n FROM users WHERE created_at >= ${since} GROUP BY 1),
      vs AS (SELECT date_trunc('day', start_time) AS d, count(*) AS n FROM visitor_sessions WHERE start_time >= ${since} GROUP BY 1)
      SELECT to_char(days.day, 'YYYY-MM-DD') AS day,
             coalesce(it.lost, 0) AS lost, coalesce(it.found, 0) AS found,
             coalesce(us.n, 0) AS signups, coalesce(vs.n, 0) AS visits
      FROM days
      LEFT JOIN it ON it.d = days.day
      LEFT JOIN us ON us.d = days.day
      LEFT JOIN vs ON vs.d = days.day
      ORDER BY days.day
    `),
    db.execute(sql`
      SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day, upper(currency) AS currency,
             coalesce(sum(amount), 0) AS amount
      FROM payments
      WHERE status = 'completed' AND created_at >= ${since}
      GROUP BY 1, 2
    `),
    db.execute(sql`
      (SELECT 'item' AS kind, i.id, i.title, coalesce(u.name, '') AS sub, i.type::text AS extra,
              NULL::int AS amount, NULL::text AS currency,
              (extract(epoch FROM i.created_at) * 1000)::bigint AS at
         FROM items i LEFT JOIN users u ON u.id = i.user_id
        ORDER BY i.created_at DESC LIMIT 8)
      UNION ALL
      (SELECT 'user', id, name, email, role::text, NULL, NULL, (extract(epoch FROM created_at) * 1000)::bigint
         FROM users ORDER BY created_at DESC LIMIT 6)
      UNION ALL
      (SELECT 'payment', p.id, coalesce(it.title, 'Item #' || p.item_id), coalesce(u.name, ''), p.status::text,
              p.amount, upper(p.currency), (extract(epoch FROM p.created_at) * 1000)::bigint
         FROM payments p LEFT JOIN users u ON u.id = p.user_id LEFT JOIN items it ON it.id = p.item_id
        ORDER BY p.created_at DESC LIMIT 6)
      UNION ALL
      (SELECT 'ticket', id, name, email, status::text, NULL, NULL, (extract(epoch FROM created_at) * 1000)::bigint
         FROM support_tickets ORDER BY created_at DESC LIMIT 6)
      UNION ALL
      (SELECT 'att_withdrawal', w.id, coalesce(u.name, u.email, 'User #' || w.user_id), coalesce(u.email, ''), w.status::text,
              w.amount, upper(w.currency), (extract(epoch FROM w.created_at) * 1000)::bigint
         FROM withdrawal_requests w LEFT JOIN users u ON u.id = w.user_id
        WHERE w.status = 'pending' ORDER BY w.created_at ASC LIMIT 5)
      UNION ALL
      (SELECT 'att_ticket', id, name, left(message, 140), status::text, NULL, NULL, (extract(epoch FROM created_at) * 1000)::bigint
         FROM support_tickets WHERE status = 'open' ORDER BY created_at ASC LIMIT 5)
    `),
  ])) as unknown as [Row[], Row[], Row[], Row[], Row[]];

  const c = countsRows[0] ?? {};

  const money = (kind: string): MoneyByCurrency[] =>
    moneyRows
      .filter((r) => r.kind === kind)
      .map((r) => ({ currency: str(r.currency) || "USD", amount: num(r.amount), count: num(r.n) }))
      .sort((a, b) => b.amount - a.amount);

  const series: DaySeries[] = seriesRows.map((r) => ({
    day: str(r.day),
    lost: num(r.lost),
    found: num(r.found),
    signups: num(r.signups),
    visits: num(r.visits),
  }));

  const revenueSeries: RevenuePoint[] = revenueRows.map((r) => ({
    day: str(r.day),
    currency: str(r.currency) || "USD",
    amount: num(r.amount),
  }));

  const generatedAt = Date.now();
  const dayAgo = generatedAt - 24 * 60 * 60 * 1000;
  const activity: ActivityEntry[] = [];
  const attention: AttentionEntry[] = [];
  for (const r of feedRows) {
    const kind = str(r.kind);
    const base = {
      id: num(r.id),
      title: str(r.title),
      sub: str(r.sub),
      amount: r.amount === null || r.amount === undefined ? null : num(r.amount),
      currency: r.currency ? str(r.currency) : null,
      at: num(r.at),
    };
    if (kind === "att_withdrawal") attention.push({ kind: "withdrawal", ...base });
    else if (kind === "att_ticket") attention.push({ kind: "ticket", ...base });
    else {
      activity.push({ kind: kind as ActivityEntry["kind"], extra: str(r.extra), ...base });
      if (kind === "item" && base.at >= dayAgo) {
        attention.push({ kind: "item", ...base, sub: [str(r.extra), base.sub].filter(Boolean).join(" · ") });
      }
    }
  }
  activity.sort((a, b) => b.at - a.at);

  return {
    generatedAt,
    counts: {
      lost: num(c.lost),
      found: num(c.found),
      active: num(c.active),
      resolved: num(c.resolved),
      archived: num(c.archived),
      items24h: num(c.items_24h),
      items30d: num(c.items_30d),
      itemsPrev30d: num(c.items_prev_30d),
      usersTotal: num(c.users_total),
      usersWeek: num(c.users_week),
      usersPrevWeek: num(c.users_prev_week),
      ticketsOpen: num(c.tickets_open),
      ticketsInProgress: num(c.tickets_in_progress),
      withdrawalsPending: num(c.withdrawals_pending),
      visitsWeek: num(c.visits_week),
      visitsPrevWeek: num(c.visits_prev_week),
      onlineNow: num(c.online_now),
    },
    revenueByCurrency: money("revenue"),
    pendingWithdrawalsByCurrency: money("withdrawals"),
    series,
    revenueSeries,
    activity: activity.slice(0, 14),
    attention,
  };
}

export type DashboardOverview = Awaited<ReturnType<typeof getDashboardOverview>>;
