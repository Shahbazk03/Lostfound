/** Inline validation helpers for the homepage editors (mirror the API rules). */

export type Errors = Record<string, string>;

const LINK_PATTERN = /^(\/|#|https?:\/\/|mailto:)/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
const URL_PATTERN = /^https?:\/\/\S+$/i;

export const isBlank = (v: unknown) => typeof v !== "string" || v.trim() === "";

export function required(v: unknown, label = "This field") {
  return isBlank(v) ? `${label} is required` : null;
}

export function maxLen(v: unknown, max: number) {
  return typeof v === "string" && v.length > max ? `Keep it under ${max} characters` : null;
}

/** A link must start with /, #, http(s):// or mailto:. */
export function linkError(link: unknown) {
  if (isBlank(link)) return null;
  return LINK_PATTERN.test(String(link).trim()) ? null : "Start with /, #, https:// or mailto:";
}

/** When a button has text it needs a valid link. */
export function buttonLinkError(text: unknown, link: unknown) {
  if (!isBlank(text) && isBlank(link)) return "Add a link for this button";
  return linkError(link);
}

export function emailError(v: unknown) {
  if (isBlank(v)) return null;
  return EMAIL_PATTERN.test(String(v).trim()) ? null : "Enter a valid email address";
}

export function httpUrlError(v: unknown, requiredMessage?: string) {
  if (isBlank(v)) return requiredMessage ?? null;
  return URL_PATTERN.test(String(v).trim()) ? null : "Use a full URL starting with https://";
}

/** Collect non-null messages into an Errors map. */
export function collect(entries: [string, string | null | undefined][]): Errors {
  const out: Errors = {};
  for (const [k, msg] of entries) if (msg) out[k] = msg;
  return out;
}

export function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
