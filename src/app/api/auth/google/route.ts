import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  GOOGLE_COOKIE_PATH,
  GOOGLE_NEXT_COOKIE,
  GOOGLE_STATE_COOKIE,
  getAppBaseUrl,
  safeNextPath,
} from "../_lib/auth-helpers";

/** GET /api/auth/google[?next=/some/path] — start the Google sign-in flow. */
export async function GET(request: NextRequest) {
  const baseUrl = getAppBaseUrl(request);
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    console.error("GOOGLE_CLIENT_ID is not configured in .env");
    return NextResponse.redirect(new URL("/login?error=GoogleAuthNotConfigured", baseUrl));
  }

  // CSRF protection: the callback only accepts a `state` matching this cookie.
  const state = randomBytes(32).toString("base64url");

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", `${baseUrl}/api/auth/google/callback`);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("access_type", "online");
  authUrl.searchParams.set("state", state);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // "lax" is required: the callback is a top-level GET navigation from Google.
    sameSite: "lax" as const,
    maxAge: 10 * 60,
    path: GOOGLE_COOKIE_PATH,
  };

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set(GOOGLE_STATE_COOKIE, state, cookieOptions);

  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  if (next) {
    response.cookies.set(GOOGLE_NEXT_COOKIE, next, cookieOptions);
  } else {
    response.cookies.set(GOOGLE_NEXT_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  }

  return response;
}
