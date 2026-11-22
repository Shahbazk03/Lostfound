import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createToken, setAuthCookie } from "@/lib/auth";
import {
  GOOGLE_COOKIE_PATH,
  GOOGLE_NEXT_COOKIE,
  GOOGLE_STATE_COOKIE,
  NAME_MAX_LENGTH,
  emailEquals,
  findUserByEmail,
  getAppBaseUrl,
  normalizeEmail,
  randomPasswordHash,
  safeEqual,
  safeNextPath,
} from "../../_lib/auth-helpers";

function clearOAuthCookies(response: NextResponse) {
  for (const name of [GOOGLE_STATE_COOKIE, GOOGLE_NEXT_COOKIE]) {
    response.cookies.set(name, "", { path: GOOGLE_COOKIE_PATH, maxAge: 0 });
  }
  return response;
}

export async function GET(request: NextRequest) {
  const baseUrl = getAppBaseUrl(request);
  const params = request.nextUrl.searchParams;

  // Fixed error codes only — never reflect Google's text into the login page.
  const fail = (code: string) =>
    clearOAuthCookies(NextResponse.redirect(new URL(`/login?error=${code}`, baseUrl)));

  const googleError = params.get("error");
  if (googleError) {
    return fail(googleError === "access_denied" ? "GoogleAuthCancelled" : "GoogleAuthFailed");
  }

  const code = params.get("code");
  if (!code) return fail("NoCodeProvided");

  const state = params.get("state");
  const expectedState = request.cookies.get(GOOGLE_STATE_COOKIE)?.value;
  if (!state || !expectedState || !safeEqual(state, expectedState)) {
    console.warn("Google OAuth callback rejected: missing or mismatched state");
    return fail("GoogleAuthFailed");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("Missing Google OAuth credentials");
    return fail("GoogleAuthNotConfigured");
  }

  const oauth2Client = new OAuth2Client(
    clientId,
    clientSecret,
    `${baseUrl}/api/auth/google/callback`
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.id_token) {
      throw new Error("No ID token returned from Google");
    }

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });
    const payload = ticket.getPayload();

    // Only trust addresses Google has verified, otherwise anyone could claim
    // someone else's email.
    if (!payload?.email || payload.email_verified !== true) {
      return fail("GoogleEmailNotVerified");
    }
    const email = normalizeEmail(payload.email);
    if (!email) return fail("GoogleAuthFailed");

    let user = await findUserByEmail(email);

    if (user && !user.verified) {
      // Pre-account-takeover defence: someone may have registered this address
      // without owning it. Google just proved ownership, so lock out whatever
      // password was set and mark the account verified.
      [user] = await db
        .update(users)
        .set({
          password: await randomPasswordHash(),
          verified: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))
        .returning();
      await db.delete(verificationTokens).where(emailEquals(verificationTokens.email, email));
    } else if (!user) {
      // Password is NOT NULL in the schema; store an unusable random hash.
      [user] = await db
        .insert(users)
        .values({
          email,
          name: (payload.name?.trim() || "Google User").slice(0, NAME_MAX_LENGTH),
          password: await randomPasswordHash(),
          verified: true,
          role: "user",
        })
        .returning();
    }

    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    await setAuthCookie(token);

    const next = safeNextPath(request.cookies.get(GOOGLE_NEXT_COOKIE)?.value) ?? "/dashboard";
    return clearOAuthCookies(NextResponse.redirect(new URL(next, baseUrl)));
  } catch (err) {
    console.error("Google auth callback error:", err);
    return fail("GoogleAuthFailed");
  }
}
