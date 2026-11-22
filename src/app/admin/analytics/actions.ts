"use server";

import { db } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { sql } from "drizzle-orm";

type Row = Record<string, unknown>;
const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));
const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

export type AnalyticsRange = 7 | 30 | 90;
const RANGES: AnalyticsRange[] = [7, 30, 90];

const BUCKETS = [
  { code: "b1", label: "Under 1 min" },
  { code: "b2", label: "1–5 min" },
  { code: "b3", label: "5–15 min" },
  { code: "b4", label: "15–60 min" },
  { code: "b5", label: "Over 1 hour" },
];

/**
 * Visitor analytics from visitor_sessions (one row per browser tab session;
 * `path` is the last page the session was on). Four statements, run in
 * parallel. Times are in the database's timezone (UTC).
 */
export async function getAnalyticsData(rangeDays: number = 30) {
  await requireAdmin();
  const range: AnalyticsRange = RANGES.includes(rangeDays as AnalyticsRange) ? (rangeDays as AnalyticsRange) : 30;

  const since = sql`(date_trunc('day', now()::timestamp) - make_interval(days => ${range - 1}::int))`;
  const prevSince = sql`(date_trunc('day', now()::timestamp) - make_interval(days => ${range * 2 - 1}::int))`;
  const today = sql`date_trunc('day', now()::timestamp)`;
  const live = sql`now()::timestamp - interval '2 minutes'`;

  const [scalarRows, dailyRows, breakdownRows] = (await Promise.all([
    db.execute(sql`
      SELECT
        (SELECT count(*) FROM visitor_sessions WHERE last_heartbeat >= ${live}) AS online,
        (SELECT count(*) FROM visitor_sessions WHERE start_time >= ${today}) AS today,
        (SELECT coalesce(avg(duration_seconds), 0) FROM visitor_sessions WHERE start_time >= ${today}) AS avg_today,
        (SELECT count(*) FROM visitor_sessions WHERE start_time >= ${since}) AS sessions,
        (SELECT coalesce(avg(duration_seconds), 0) FROM visitor_sessions WHERE start_time >= ${since}) AS avg_duration,
        (SELECT count(*) FROM visitor_sessions WHERE start_time >= ${prevSince} AND start_time < ${since}) AS prev_sessions,
        (SELECT coalesce(avg(duration_seconds), 0) FROM visitor_sessions
            WHERE start_time >= ${prevSince} AND start_time < ${since}) AS prev_avg_duration,
        (SELECT count(*) FROM visitor_sessions WHERE start_time >= ${since} AND duration_seconds < 60) AS short_sessions
    `),
    db.execute(sql`
      WITH days AS (
        SELECT generate_series(${since}, ${today}, interval '1 day') AS day
      ),
      vs AS (
        SELECT date_trunc('day', start_time) AS d, count(*) AS n, avg(duration_seconds) AS a
        FROM visitor_sessions WHERE start_time >= ${since} GROUP BY 1
      )
      SELECT to_char(days.day, 'YYYY-MM-DD') AS day, coalesce(vs.n, 0) AS sessions, coalesce(round(vs.a), 0) AS avg_duration
      FROM days LEFT JOIN vs ON vs.d = days.day
      ORDER BY days.day
    `),
    db.execute(sql`
      (SELECT 'page' AS kind, coalesce(path, '(unknown)')::text AS label, count(*) AS n,
              coalesce(round(avg(duration_seconds)), 0)::numeric AS a
         FROM visitor_sessions WHERE start_time >= ${since}
        GROUP BY 2 ORDER BY 3 DESC LIMIT 10)
      UNION ALL
      (SELECT 'live', coalesce(path, '(unknown)')::text, count(*), 0::numeric
         FROM visitor_sessions WHERE last_heartbeat >= ${live}
        GROUP BY 2 ORDER BY 3 DESC LIMIT 8)
      UNION ALL
      (SELECT 'bucket',
              CASE WHEN duration_seconds < 60 THEN 'b1'
                   WHEN duration_seconds < 300 THEN 'b2'
                   WHEN duration_seconds < 900 THEN 'b3'
                   WHEN duration_seconds < 3600 THEN 'b4'
                   ELSE 'b5' END,
              count(*), 0::numeric
         FROM visitor_sessions WHERE start_time >= ${since}
        GROUP BY 2)
      UNION ALL
      (SELECT 'hour', extract(hour FROM start_time)::int::text, count(*), 0::numeric
         FROM visitor_sessions WHERE start_time >= ${since}
        GROUP BY 2)
    `),
  ])) as unknown as [Row[], Row[], Row[]];

  const s = scalarRows[0] ?? {};
  const byKind = (kind: string) => breakdownRows.filter((r) => r.kind === kind);

  const bucketCounts = new Map(byKind("bucket").map((r) => [str(r.label), num(r.n)]));
  const hourCounts = new Map(byKind("hour").map((r) => [num(r.label), num(r.n)]));

  const activeUsersCount = num(s.online);
  const totalVisitorsToday = num(s.today);
  const avgTodaySeconds = num(s.avg_today);

  return {
    range,
    // Fields the page has always returned.
    activeUsersCount,
    totalVisitorsToday,
    avgDurationMinutes: Math.round(avgTodaySeconds / 60),

    avgTodaySeconds: Math.round(avgTodaySeconds),
    sessions: num(s.sessions),
    prevSessions: num(s.prev_sessions),
    avgDurationSeconds: Math.round(num(s.avg_duration)),
    prevAvgDurationSeconds: Math.round(num(s.prev_avg_duration)),
    shortSessions: num(s.short_sessions),
    daily: dailyRows.map((r) => ({ day: str(r.day), sessions: num(r.sessions), avgDuration: num(r.avg_duration) })),
    topPages: byKind("page").map((r) => ({ path: str(r.label), sessions: num(r.n), avgDuration: num(r.a) })),
    livePages: byKind("live").map((r) => ({ path: str(r.label), sessions: num(r.n) })),
    durationBuckets: BUCKETS.map((b) => ({ label: b.label, sessions: bucketCounts.get(b.code) ?? 0 })),
    hourly: Array.from({ length: 24 }, (_, hour) => ({ hour, sessions: hourCounts.get(hour) ?? 0 })),
  };
}

export type AnalyticsData = Awaited<ReturnType<typeof getAnalyticsData>>;
