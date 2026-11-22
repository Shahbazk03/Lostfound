import { sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

/**
 * SQL fragments that let list queries return a photo/avatar *reference*
 * without pulling the base64 image itself out of the database (each one can
 * be 100–300 KB, and the database is far away).
 *
 * Pair each with resolveMediaRef() from below.
 */
export function mediaRefColumns(value: SQL | AnyPgColumn) {
  return {
    remote: sql<string | null>`case when (${value}) like 'data:%' then null else (${value}) end`,
    inline: sql<boolean>`coalesce((${value}) like 'data:%', false)`,
  };
}

/** First element of a jsonb photos array, as text. */
export function firstPhoto(photos: AnyPgColumn) {
  return sql`${photos} ->> 0`;
}

/**
 * Turn the {remote, inline} pair into a URL: remote URLs pass through,
 * inline images point at the /api/media route, versioned by `version`.
 */
export function resolveMediaRef(
  ref: { remote: string | null; inline: boolean } | null | undefined,
  inlineUrl: string,
  version?: Date | string | number | null
): string | null {
  if (!ref) return null;
  if (ref.inline) {
    const t = version ? new Date(version).getTime() : NaN;
    return Number.isFinite(t) ? `${inlineUrl}?v=${t}` : inlineUrl;
  }
  return ref.remote || null;
}
