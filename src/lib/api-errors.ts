import { NextResponse } from "next/server";

/**
 * requireAuth()/requireAdmin() throw Error("Unauthorized") / Error("Forbidden").
 * Call this first in a route's catch block so those become 401/403 instead of
 * a generic 500.
 *
 *   } catch (error) {
 *     const authResponse = authErrorResponse(error);
 *     if (authResponse) return authResponse;
 *     ...
 *   }
 */
export function authErrorResponse(error: unknown): NextResponse | null {
  const message = error instanceof Error ? error.message : "";
  if (message === "Unauthorized") {
    return NextResponse.json({ error: "Please sign in to continue" }, { status: 401 });
  }
  if (message === "Forbidden") {
    return NextResponse.json({ error: "You don't have access to this" }, { status: 403 });
  }
  return null;
}

/** Parse a positive integer id from a route param or query value. */
export function parseId(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}
