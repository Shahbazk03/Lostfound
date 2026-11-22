/**
 * fetch helpers for admin pages. Every non-2xx response becomes a thrown Error
 * carrying the server's own message ({ error } or { message } in the body), so
 * pages can show it instead of silently "succeeding".
 */

export async function readApiError(res: Response, fallback = "Request failed"): Promise<string> {
  try {
    const data = await res.clone().json();
    if (data && typeof data.error === "string" && data.error) return data.error;
    if (data && typeof data.message === "string" && data.message) return data.message;
  } catch {
    // Body wasn't JSON (e.g. an HTML error page).
  }
  return `${fallback} (HTTP ${res.status})`;
}

type AdminRequestInit = Omit<RequestInit, "body"> & {
  /** Sent as a JSON body with Content-Type: application/json. */
  json?: unknown;
  body?: BodyInit;
};

export async function adminFetch<T = unknown>(
  url: string,
  init: AdminRequestInit = {},
  fallback = "Request failed"
): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(url, {
    cache: "no-store",
    ...rest,
    headers: json === undefined ? headers : { "Content-Type": "application/json", ...headers },
    body: json === undefined ? rest.body : JSON.stringify(json),
  });
  if (!res.ok) throw new Error(await readApiError(res, fallback));
  if (res.status === 204) return undefined as T;
  return (await res.json().catch(() => undefined)) as T;
}

/** Message for a caught error (fetch rejection, adminFetch error, server action error). */
export function errorMessage(err: unknown, fallback = "Something went wrong"): string {
  return err instanceof Error && err.message ? err.message : fallback;
}
