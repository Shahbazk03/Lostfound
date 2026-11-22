/**
 * Smart Matching: pairs lost reports with found reports (and vice versa).
 *
 * Two layers:
 *  - Pure scoring (`tokenize`, `overlapCoefficient`, `scoreMatch`,
 *    `rankCandidates`) with no I/O, so it can be unit tested.
 *  - Database helpers (`findMatches`, `getMatchSummaries`) that run a SELECT
 *    pre-filter and hand the rows to the scorer.
 *
 * Only public listing fields are ever read or returned: never the precise
 * location or any contact details of the poster.
 */
import { and, eq, gte, inArray, lte, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { firstPhoto, mediaRefColumns, resolveMediaRef } from "@/lib/media-sql";
import { items } from "@/db/schema";

export type ItemKind = "lost" | "found";

/** The fields the scorer needs from either side of a match. */
export interface MatchSubject {
  id: number;
  userId: number;
  type: ItemKind;
  title: string;
  description: string;
  category: string;
  approximateLocation: string;
  city: string | null;
  country: string | null;
  dateLostFound: Date;
}

/** What the API returns for each match (safe to show publicly). */
export interface ItemMatch {
  id: number;
  type: ItemKind;
  title: string;
  category: string;
  city: string | null;
  approximateLocation: string;
  /** ISO timestamp. */
  dateLostFound: string;
  /** First photo only (data URL or URL), or null. */
  photo: string | null;
  /** 0-100. */
  score: number;
  /** Short, human explanations, most convincing first. */
  reasons: string[];
}

export interface MatchSummary {
  count: number;
  topScore: number;
}

export const MIN_MATCH_SCORE = 35;
export const DEFAULT_MATCH_LIMIT = 6;
const MAX_CANDIDATES = 200;

const DAY_MS = 24 * 60 * 60 * 1000;
/** A found item may be reported up to 2 days before the loss date (clock/memory slack)… */
const FOUND_BEFORE_LOST_DAYS = 2;
/** …and up to 60 days after it. */
const FOUND_AFTER_LOST_DAYS = 60;

const WEIGHTS = { category: 30, city: 20, text: 35, area: 10, date: 5 } as const;
const OTHER_CATEGORY_POINTS = 10;
const COUNTRY_ONLY_POINTS = 5;
/** Days apart at which the date component reaches zero. */
const DATE_DECAY_DAYS = 30;
/** Highest score without any shared words: stays in the "possible" band (< 55). */
const NO_SHARED_WORDS_CAP = 54;

// ---------------------------------------------------------------------------
// Tokenizing
// ---------------------------------------------------------------------------

// English function words plus words every lost & found report uses, which
// would otherwise make unrelated listings look alike.
const STOPWORDS = new Set(
  (
    "a an and are as at be been but by can could did do does for from had has have he her his i if in " +
    "into is it its just me my near no not of off on or our out over she so some than that the their them " +
    "then there these they this those to too under up us very was we were what when where which while who " +
    "whom why will with would you your yours about after again all also am any around because before " +
    "behind below between both during each few further here how more most other own same should such " +
    "only once through until upon onto via per" +
    // domain words
    " lost found lose losing find finding finder owner item items thing things please help contact " +
    "reward someone anyone somewhere left dropped missing picked kept keep safe call message dm " +
    "today yesterday morning evening night afternoon pm am approx approximately around"
  ).split(/\s+/)
);

// Generic place words: "Gomti Nagar" and "Khurram Nagar" are not the same area.
const LOCATION_STOPWORDS = new Set([
  ...STOPWORDS,
  ..."road rd street st lane marg nagar colony area sector block city town market near opposite opp beside next main gate side station stop".split(
    " "
  ),
]);

// A few everyday synonyms. The original word is kept and the shared concept is
// added, so "iPhone" still matches "iphone" exactly and also matches "phone".
const CONCEPTS: Record<string, string> = {
  iphone: "phone",
  mobile: "phone",
  smartphone: "phone",
  cellphone: "phone",
  cell: "phone",
  purse: "wallet",
  billfold: "wallet",
  backpack: "bag",
  rucksack: "bag",
  handbag: "bag",
  satchel: "bag",
  spectacle: "glass",
  spec: "glass",
  sunglass: "glass",
  eyeglass: "glass",
  earbud: "earphone",
  airpod: "earphone",
  headphone: "earphone",
  earpod: "earphone",
  macbook: "laptop",
  keychain: "key",
  puppy: "dog",
  kitten: "cat",
  aadhaar: "id",
  aadhar: "id",
};

/** Folds simple English plurals so "keys" matches "key" and "glasses" matches "glass". */
function singular(token: string): string {
  if (token.length <= 3 || /\d/.test(token)) return token;
  if (token.endsWith("ies") && token.length > 4) return token.slice(0, -3) + "y";
  if (/(ss|sh|ch|x|z)es$/.test(token)) return token.slice(0, -2);
  if (token.endsWith("s") && !token.endsWith("ss") && !token.endsWith("us") && !token.endsWith("is")) {
    return token.slice(0, -1);
  }
  return token;
}

/**
 * Lowercases, strips punctuation, drops stopwords and 1-character tokens.
 * Numbers are kept ("16", "32"), and mixed tokens are also split, so "esp32"
 * yields "esp32", "esp" and "32". Returns unique tokens in first-seen order.
 */
export function tokenize(text: string, stopwords: ReadonlySet<string> = STOPWORDS): string[] {
  const seen = new Set<string>();
  const add = (t: string) => {
    if (t.length < 2 || stopwords.has(t)) return;
    const token = singular(t);
    seen.add(token);
    const concept = CONCEPTS[token];
    if (concept) seen.add(concept);
  };
  const words = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .split(/[^\p{L}\p{M}\p{N}]+/u);
  for (const word of words) {
    if (!word) continue;
    add(word);
    if (/\p{L}/u.test(word) && /\p{N}/u.test(word)) {
      for (const part of word.split(/(?<=\p{L})(?=\p{N})|(?<=\p{N})(?=\p{L})/u)) add(part);
    }
  }
  return [...seen];
}

/** |A ∩ B| / min(|A|, |B|); 0 when either side is empty. */
export function overlapCoefficient(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  return sharedTokens(a, b).length / Math.min(a.size, b.size);
}

function sharedTokens(a: ReadonlySet<string>, b: ReadonlySet<string>): string[] {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  return [...small].filter((t) => large.has(t));
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function normalizePlace(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function titleCase(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/(^|[\s-])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase());
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export interface ScoreResult {
  /** Integer 0-100. */
  score: number;
  reasons: string[];
  /**
   * True when the listings share words or an area. Category, city and date
   * alone are true of too many unrelated items to count as a match.
   */
  hasEvidence: boolean;
}

/**
 * Scores how likely `candidate` is the counterpart of `source`.
 *
 *   category 30  exact match; 10 when either side is "Other"
 *   city     20  same city (case/space-insensitive); 5 if only the country matches
 *   text     35  overlap coefficient of title+description tokens
 *                (the stronger of full text vs. title-only; a single shared
 *                word counts 80% since it is thin evidence)
 *   area     10  overlap coefficient of approximate-location tokens
 *   date      5  linear decay from same day to 30 days apart
 *
 * With no shared words at all the score is capped at 54 ("possible").
 *
 * Reasons are phrased from the source item's point of view
 * ("Found 1 day after" when looking at a lost item's matches).
 */
export function scoreMatch(source: MatchSubject, candidate: MatchSubject): ScoreResult {
  const scored: { points: number; reason: string | null; rank: number }[] = [];

  // Category
  const catA = source.category.trim().toLowerCase();
  const catB = candidate.category.trim().toLowerCase();
  if (catA === "other" || catB === "other") {
    scored.push({ points: OTHER_CATEGORY_POINTS, reason: null, rank: 9 });
  } else if (catA === catB) {
    scored.push({ points: WEIGHTS.category, reason: "Same category", rank: 5 });
  }

  // City / country
  const cityA = normalizePlace(source.city);
  const cityB = normalizePlace(candidate.city);
  if (cityA && cityA === cityB) {
    scored.push({ points: WEIGHTS.city, reason: `Same city · ${titleCase(candidate.city!)}`, rank: 3 });
  } else {
    const countryA = normalizePlace(source.country);
    if (countryA && countryA === normalizePlace(candidate.country)) {
      scored.push({ points: COUNTRY_ONLY_POINTS, reason: `Same country · ${titleCase(candidate.country!)}`, rank: 6 });
    }
  }

  // Text similarity
  const titleA = new Set(tokenize(source.title));
  const titleB = new Set(tokenize(candidate.title));
  const textA = new Set([...titleA, ...tokenize(source.description)]);
  const textB = new Set([...titleB, ...tokenize(candidate.description)]);
  const fullCoef = overlapCoefficient(textA, textB);
  const titleCoef = overlapCoefficient(titleA, titleB);
  const shared = sharedTokens(textA, textB);
  if (shared.length > 0) {
    const support = shared.length >= 2 ? 1 : 0.8;
    const points = WEIGHTS.text * Math.max(fullCoef, titleCoef) * support;
    // Show the most telling words: title words first, then longer words.
    const display = shared
      .sort((x, y) => Number(titleB.has(y)) - Number(titleB.has(x)) || y.length - x.length)
      .slice(0, 3);
    scored.push({ points, reason: `Similar words: ${display.join(", ")}`, rank: 1 });
  }

  // Area
  const areaA = new Set(tokenize(source.approximateLocation, LOCATION_STOPWORDS));
  const areaB = new Set(tokenize(candidate.approximateLocation, LOCATION_STOPWORDS));
  const areaCoef = overlapCoefficient(areaA, areaB);
  if (areaCoef > 0) {
    const label = candidate.approximateLocation.trim().replace(/\s+/g, " ");
    const reason =
      areaCoef >= 1
        ? `Same area · ${titleCase(label.length <= 28 ? label : sharedTokens(areaA, areaB).join(" "))}`
        : `Similar area · ${sharedTokens(areaA, areaB).slice(0, 3).map(titleCase).join(" ")}`;
    scored.push({ points: WEIGHTS.area * areaCoef, reason, rank: 2 });
  }

  // Date: days from the loss to the find (negative = found before the loss date).
  const lost = source.type === "lost" ? source : candidate;
  const found = source.type === "lost" ? candidate : source;
  const daysLostToFound = Math.round((found.dateLostFound.getTime() - lost.dateLostFound.getTime()) / DAY_MS);
  const gap = Math.abs(daysLostToFound);
  const datePoints = WEIGHTS.date * Math.max(0, 1 - gap / DATE_DECAY_DAYS);
  let dateReason: string | null = null;
  if (gap <= 14) {
    const verb = candidate.type === "found" ? "Found" : "Lost";
    // From the source's view: a found candidate after the loss is "after";
    // a lost candidate before the find is "before".
    const candidateLater = candidate.type === "found" ? daysLostToFound > 0 : daysLostToFound < 0;
    dateReason = gap === 0 ? `${verb} the same day` : `${verb} ${plural(gap, "day")} ${candidateLater ? "after" : "before"}`;
  }
  scored.push({ points: datePoints, reason: dateReason, rank: 4 });

  let score = Math.min(100, Math.round(scored.reduce((sum, s) => sum + s.points, 0)));
  // Same category and city alone would already reach 50: without a single
  // shared word the most we can honestly say is "possible".
  if (shared.length === 0) score = Math.min(score, NO_SHARED_WORDS_CAP);
  const reasons = scored
    .filter((s) => s.reason)
    .sort((x, y) => x.rank - y.rank)
    .map((s) => s.reason!);

  return { score, reasons, hasEvidence: shared.length > 0 || areaCoef > 0 };
}

/**
 * Scores every candidate against the source and keeps plausible matches
 * (score >= MIN_MATCH_SCORE with some real evidence), best first.
 */
export function rankCandidates<C extends MatchSubject>(
  source: MatchSubject,
  candidates: readonly C[]
): (ScoreResult & { candidate: C })[] {
  return candidates
    .filter((c) => c.id !== source.id && c.type !== source.type && c.userId !== source.userId)
    .map((candidate) => ({ candidate, ...scoreMatch(source, candidate) }))
    .filter((r) => r.score >= MIN_MATCH_SCORE && r.hasEvidence)
    .sort(
      (a, b) =>
        b.score - a.score ||
        Math.abs(a.candidate.dateLostFound.getTime() - source.dateLostFound.getTime()) -
          Math.abs(b.candidate.dateLostFound.getTime() - source.dateLostFound.getTime()) ||
        b.candidate.id - a.candidate.id
    );
}

/** The [from, to] window a counterpart's date must fall in. */
export function candidateDateWindow(source: Pick<MatchSubject, "type" | "dateLostFound">): [Date, Date] {
  const t = source.dateLostFound.getTime();
  return source.type === "lost"
    ? [new Date(t - FOUND_BEFORE_LOST_DAYS * DAY_MS), new Date(t + FOUND_AFTER_LOST_DAYS * DAY_MS)]
    : [new Date(t - FOUND_AFTER_LOST_DAYS * DAY_MS), new Date(t + FOUND_BEFORE_LOST_DAYS * DAY_MS)];
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

const subjectColumns = {
  id: items.id,
  userId: items.userId,
  type: items.type,
  title: items.title,
  description: items.description,
  category: items.category,
  approximateLocation: items.approximateLocation,
  city: items.city,
  country: items.country,
  dateLostFound: items.dateLostFound,
};

/** SELECT pre-filter: opposite type, active, someone else's, compatible category, date window. */
async function loadCandidates(source: MatchSubject): Promise<MatchSubject[]> {
  const [from, to] = candidateDateWindow(source);
  const conditions: SQL[] = [
    eq(items.type, source.type === "lost" ? "found" : "lost"),
    eq(items.status, "active"),
    ne(items.userId, source.userId),
    ne(items.id, source.id),
    gte(items.dateLostFound, from),
    lte(items.dateLostFound, to),
  ];
  if (source.category.trim().toLowerCase() !== "other") {
    conditions.push(
      or(
        sql`lower(trim(${items.category})) = ${source.category.trim().toLowerCase()}`,
        sql`lower(trim(${items.category})) = 'other'`
      )!
    );
  }
  // Closest dates first, so the cap keeps the most plausible candidates.
  const sourceIso = source.dateLostFound.toISOString();
  return db
    .select(subjectColumns)
    .from(items)
    .where(and(...conditions))
    .orderBy(sql`abs(extract(epoch from (${items.dateLostFound} - ${sourceIso}::timestamp)))`, items.id)
    .limit(MAX_CANDIDATES);
}

/**
 * First-photo URL for each id. Returns a small /api/media URL instead of the
 * base64 image, so the (far away) database never ships the image bytes here.
 */
async function loadFirstPhotos(ids: number[]): Promise<Map<number, string | null>> {
  if (ids.length === 0) return new Map();
  const rows = await db
    .select({
      id: items.id,
      ref: mediaRefColumns(firstPhoto(items.photos)),
      updatedAt: items.updatedAt,
    })
    .from(items)
    .where(inArray(items.id, ids));
  return new Map(
    rows.map((r) => [r.id, resolveMediaRef(r.ref, `/api/media/items/${r.id}/0`, r.updatedAt)])
  );
}

/**
 * Best matches for an item. Returns null when the item doesn't exist or isn't
 * active (callers turn that into a 404).
 */
export async function findMatches(
  itemId: number,
  { limit = DEFAULT_MATCH_LIMIT }: { limit?: number } = {}
): Promise<ItemMatch[] | null> {
  const [source] = await db
    .select(subjectColumns)
    .from(items)
    .where(and(eq(items.id, itemId), eq(items.status, "active")))
    .limit(1);
  if (!source) return null;

  const ranked = rankCandidates(source, await loadCandidates(source)).slice(0, Math.max(1, limit));
  const photos = await loadFirstPhotos(ranked.map((r) => r.candidate.id));

  return ranked.map(({ candidate: c, score, reasons }) => ({
    id: c.id,
    type: c.type,
    title: c.title,
    category: c.category,
    city: c.city,
    approximateLocation: c.approximateLocation,
    dateLostFound: c.dateLostFound.toISOString(),
    photo: photos.get(c.id) ?? null,
    score,
    reasons,
  }));
}

/**
 * Match count and best score for each of a user's active items, e.g. for the
 * dashboard. One candidate query per item, run in parallel (users have few items).
 */
export async function getMatchSummaries(userId: number): Promise<Record<number, MatchSummary>> {
  const sources = await db
    .select(subjectColumns)
    .from(items)
    .where(and(eq(items.userId, userId), eq(items.status, "active")));

  const entries = await Promise.all(
    sources.map(async (source) => {
      const ranked = rankCandidates(source, await loadCandidates(source));
      return [source.id, { count: ranked.length, topScore: ranked[0]?.score ?? 0 }] as const;
    })
  );
  return Object.fromEntries(entries);
}
